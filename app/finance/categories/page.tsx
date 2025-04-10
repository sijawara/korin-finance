"use client";

import { useState } from "react";
import { H1, P } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AddCategoryDialog } from "./components/add-category-dialog";
import { CategoryDetailsDialog } from "./components/category-details-dialog";
import { useCategories, UiCategory } from "@/hooks/useCategories";

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<UiCategory | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Use the hook instead of direct API calls
  const {
    categories,
    isLoading,
    isError,
    addCategory: addCategoryAction,
    updateCategory: updateCategoryAction,
    deleteCategory: deleteCategoryAction,
    totalCategories,
    incomeCategories,
    expenseCategories,
    parentCategories,
  } = useCategories();

  // Filter categories based on search query
  const filteredCategories = categories.filter(
    (category: UiCategory) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Organize categories by hierarchy
  const organizeCategories = () => {
    const parents = filteredCategories.filter(
      (cat: UiCategory) => cat.isParent
    );
    const children = filteredCategories.filter(
      (cat: UiCategory) => !cat.isParent
    );

    // Group children by their parent ID
    const childrenByParent = children.reduce(
      (acc: Record<string, UiCategory[]>, child: UiCategory) => {
        if (!acc[child.parentId!]) {
          acc[child.parentId!] = [];
        }
        acc[child.parentId!].push(child);
        return acc;
      },
      {} as Record<string, UiCategory[]>
    );

    // Create organized list with parents followed by their children
    const organized: { category: UiCategory; level: number }[] = [];

    parents.forEach((parent: UiCategory) => {
      organized.push({ category: parent, level: 0 });

      if (childrenByParent[parent.id]) {
        childrenByParent[parent.id].forEach((child: UiCategory) => {
          organized.push({ category: child, level: 1 });
        });
      }
    });

    return organized;
  };

  const organizedCategories = organizeCategories();

  // Action handlers simplified to use the hook actions
  const handleAddCategory = async (
    newCategory: Omit<UiCategory, "id" | "usageCount">
  ) => {
    await addCategoryAction(newCategory);
  };

  const handleEditCategory = async (updatedCategory: UiCategory) => {
    const success = await updateCategoryAction(updatedCategory);
    if (success) {
      setDetailsOpen(false);
    }
  };

  const handleDeleteCategory = async (category: UiCategory) => {
    const success = await deleteCategoryAction(category.id);
    if (success) {
      setDetailsOpen(false);
    }
  };

  const handleRowClick = (category: UiCategory) => {
    setSelectedCategory(category);
    setDetailsOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <H1 className="text-2xl md:text-3xl">Categories</H1>
          <P className="text-muted-foreground text-sm md:text-base">
            Manage your transaction categories
          </P>
        </div>
        <Button
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          Add Category
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4 sm:mb-6">
        <Input
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:max-w-sm text-sm"
        />
      </div>

      {/* Categories Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs sm:text-sm">Category</TableHead>
              <TableHead className="text-xs sm:text-sm">Type</TableHead>
              <TableHead className="hidden sm:table-cell text-xs sm:text-sm">
                Description
              </TableHead>
              <TableHead className="text-center text-xs sm:text-sm">
                Usage
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    <span className="ml-2">Loading categories...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-destructive"
                >
                  Error loading categories. Please try again.
                </TableCell>
              </TableRow>
            ) : organizedCategories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-4 sm:py-6 text-xs sm:text-sm text-muted-foreground"
                >
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              organizedCategories.map(({ category, level }) => (
                <TableRow
                  key={category.id}
                  className={`${
                    level > 0 ? "bg-muted/10" : ""
                  } hover:bg-muted/50 cursor-pointer`}
                  onClick={() => handleRowClick(category)}
                >
                  <TableCell className="py-2 sm:py-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      {level > 0 && (
                        <div className="w-3 sm:w-4 ml-2 sm:ml-4"></div>
                      )}
                      <div
                        className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span
                        className={`font-medium text-xs sm:text-sm ${
                          level > 0 ? "text-[10px] sm:text-xs" : ""
                        }`}
                      >
                        {category.name}
                      </span>
                      {category.isParent && (
                        <Badge
                          variant="outline"
                          className="ml-1 sm:ml-2 text-[10px] sm:text-xs py-0 h-4 sm:h-5"
                        >
                          Parent
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 sm:py-4">
                    <Badge
                      variant={
                        category.type === "income" ? "default" : "destructive"
                      }
                      className="text-[10px] sm:text-xs py-0 px-1.5 sm:px-2"
                    >
                      {category.type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-2 sm:py-4 max-w-xs truncate text-xs sm:text-sm">
                    {category.description || "—"}
                  </TableCell>
                  <TableCell className="text-center py-2 sm:py-4 text-xs sm:text-sm">
                    {category.usageCount}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="p-4 md:p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className="text-sm md:text-base font-medium mb-1 md:mb-2">
            Total Categories
          </h3>
          <p className="text-xl md:text-2xl font-bold">{totalCategories}</p>
        </div>
        <div className="p-4 md:p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className="text-sm md:text-base font-medium mb-1 md:mb-2">
            Income Categories
          </h3>
          <p className="text-xl md:text-2xl font-bold text-green-600">
            {incomeCategories}
          </p>
        </div>
        <div className="p-4 md:p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className="text-sm md:text-base font-medium mb-1 md:mb-2">
            Expense Categories
          </h3>
          <p className="text-xl md:text-2xl font-bold text-red-600">
            {expenseCategories}
          </p>
        </div>
        <div className="p-4 md:p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className="text-sm md:text-base font-medium mb-1 md:mb-2">
            Parent Categories
          </h3>
          <p className="text-xl md:text-2xl font-bold">{parentCategories}</p>
        </div>
      </div>

      {/* Dialogs */}
      <AddCategoryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAddCategory={handleAddCategory}
      />

      {selectedCategory && (
        <CategoryDetailsDialog
          category={selectedCategory}
          open={detailsOpen}
          onOpenChange={(open) => {
            setDetailsOpen(open);
            if (!open) {
              setSelectedCategory(null);
            }
          }}
          onEdit={handleEditCategory}
          onDelete={handleDeleteCategory}
        />
      )}
    </div>
  );
}
