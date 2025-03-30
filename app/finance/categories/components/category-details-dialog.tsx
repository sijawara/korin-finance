"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCategories } from "@/hooks/useCategories";

// Define the schema for the form
const formSchema = z.object({
  id: z.string(),
  name: z.string().min(2, {
    message: "Category name must be at least 2 characters.",
  }),
  type: z.enum(["income", "expense"], {
    required_error: "Please select a category type.",
  }),
  color: z
    .string()
    .min(4, {
      message: "Please select a color.",
    })
    .optional(),
  description: z.string().optional(),
  usageCount: z.union([
    z.number(),
    z.string().transform((val) => parseInt(val, 10) || 0),
  ]),
  // Fields for hierarchical categories
  parentId: z.string().optional(),
  isParent: z.boolean().default(false),
});

type Category = z.infer<typeof formSchema>;

// Define the props for the component
interface CategoryDetailsDialogProps {
  category: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (category: Category) => Promise<void>;
  onDelete?: (category: Category) => void;
}

export function CategoryDetailsDialog({
  category,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: CategoryDetailsDialogProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);

  // Predefined colors for categories
  const colors = [
    { value: "#4ade80", label: "Green" },
    { value: "#60a5fa", label: "Blue" },
    { value: "#f87171", label: "Red" },
    { value: "#fbbf24", label: "Yellow" },
    { value: "#c084fc", label: "Purple" },
    { value: "#94a3b8", label: "Gray" },
    { value: "#a3e635", label: "Lime" },
    { value: "#22c55e", label: "Emerald" },
    { value: "#fb923c", label: "Orange" },
  ];

  // Get categories from the hook with parent-only filter
  const {
    categories: allCategories,
    updateParentOnlyFilter,
    updateTypeFilter,
  } = useCategories();

  // Initialize the form with category data
  const form = useForm<Category>({
    resolver: zodResolver(formSchema),
    defaultValues: category,
  });

  // Watch for form type changes
  const formType = form.watch("type");
  const isParent = form.watch("isParent");

  // Set parent-only filter when component mounts
  useEffect(() => {
    updateParentOnlyFilter(true);

    // Clean up filter when component unmounts
    return () => {
      updateParentOnlyFilter(false);
    };
  }, [updateParentOnlyFilter]);

  // Update type filter when form type changes
  useEffect(() => {
    if (formType) {
      updateTypeFilter(formType);
    }

    // Clean up filter when component unmounts
    return () => {
      updateTypeFilter("");
    };
  }, [formType, updateTypeFilter]);

  // Update form when category changes
  useEffect(() => {
    if (category) {
      // Ensure all values have the correct types before setting form defaults
      const formattedCategory = {
        ...category,
        usageCount:
          typeof category.usageCount === "string"
            ? parseInt(category.usageCount as string, 10) || 0
            : category.usageCount,
        description: category.description || "",
      };
      form.reset(formattedCategory);
    }
  }, [category, form]);

  // Find parent category if this is a child category
  useEffect(() => {
    if (category.parentId && !category.isParent) {
      const parent = allCategories.find((c) => c.id === category.parentId);
      if (parent) {
        setParentCategory(parent);
      }
    } else {
      setParentCategory(null);
    }
  }, [category, allCategories]);

  // Watch for isParent changes to reset parentId appropriately
  useEffect(() => {
    if (isParent) {
      form.setValue("parentId", undefined);
    }
  }, [isParent, form]);

  // Filter for parent categories
  const availableParentCategories = allCategories.filter((cat) => cat.isParent);

  // Handle form submission
  const onSubmit = async (values: Category) => {
    if (!category) return;

    setIsSubmitting(true);

    try {
      // Create updated category
      const updatedCategory = {
        ...values,
        // Ensure description is always a string (not undefined)
        description: values.description || "",
        // Ensure usageCount is a number
        usageCount:
          typeof values.usageCount === "string"
            ? parseInt(values.usageCount, 10) || 0
            : values.usageCount,
      };

      // Call the onEdit function with the updated category
      if (onEdit) {
        await onEdit(updatedCategory);
      }

      // Exit edit mode
      setIsEditMode(false);
    } catch (error) {
      console.error("Error updating category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get color label
  const getColorLabel = (colorValue: string) => {
    return colors.find((c) => c.value === colorValue)?.label || "Custom Color";
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          setIsEditMode(false); // Exit edit mode when closing dialog
        }
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Category" : "Category Details"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update category information"
              : "Detailed information about this category"}
          </DialogDescription>
        </DialogHeader>

        {isEditMode ? (
          // Edit Mode View
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Income categories are for money coming in, expense
                      categories for money going out.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category Hierarchy Type */}
              <FormField
                control={form.control}
                name="isParent"
                render={({ field }) => (
                  <FormItem className="space-y-0 rounded-md border p-4 relative">
                    <div className="flex flex-row items-center justify-between space-x-2">
                      <div
                        className="absolute inset-0 cursor-pointer z-10"
                        onClick={() => {
                          form.setValue("isParent", !field.value, {
                            shouldValidate: true,
                          });
                        }}
                        aria-hidden="true"
                      ></div>
                      <div className="flex-1">
                        <div className="space-y-0.5">
                          <FormLabel>Main Category</FormLabel>
                          <FormDescription>
                            Is this a main category that can contain
                            subcategories?
                          </FormDescription>
                        </div>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                          }}
                          className="z-20 relative" /* Make checkbox clickable above overlay */
                        />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />

              {/* Parent Category selector (only shown for non-parent categories) */}
              {!isParent && (
                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isParent}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a parent category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableParentCategories
                            .filter(
                              (parent) =>
                                parent.type === formType &&
                                parent.id !== category.id
                            )
                            .map((parent) => (
                              <SelectItem key={parent.id} value={parent.id}>
                                {parent.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose which main category this belongs to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Color</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{
                                  backgroundColor: field.value || "#94a3b8",
                                }}
                              />
                              <span>
                                {getColorLabel(field.value || "#94a3b8")}
                              </span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {colors.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: color.value }}
                              />
                              <span>{color.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter a description for this category"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex justify-between gap-2 sm:justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditMode(false)}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          // Read-only View
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{category.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {category.isParent ? "Main Category" : "Subcategory"}
                </p>
              </div>
              <Badge
                variant={category.type === "income" ? "default" : "destructive"}
                className="text-xs px-2 py-1"
              >
                {category.type.toUpperCase()}
              </Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Color
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color || "#94a3b8" }}
                  />
                  <span>{getColorLabel(category.color || "#94a3b8")}</span>
                </div>
              </div>

              {parentCategory && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Parent Category
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: parentCategory.color }}
                    />
                    <span>{parentCategory.name}</span>
                  </div>
                </div>
              )}
            </div>

            {category.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Description
                </p>
                <p className="text-sm">{category.description}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground">Usage</p>
              <p className="text-sm">
                Used in {category.usageCount} transaction
                {category.usageCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {!isEditMode && (
          <DialogFooter className="flex justify-between sm:justify-between">
            <div>
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onDelete(category);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {onEdit && (
                <Button
                  onClick={() => {
                    setIsEditMode(true);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
