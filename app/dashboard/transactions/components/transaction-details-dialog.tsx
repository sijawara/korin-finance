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
import { Pencil, Trash2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthRequest } from "../../components/with-auth";
import { toast } from "sonner";
import useCurrency from "@/hooks/useCurrency";

// Define API response type
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Define API response type
interface CategoryApiResponse {
  id: string;
  name: string;
  type: string;
  color?: string;
  description?: string;
  parent_id?: string;
  is_parent: boolean;
  usage_count?: number;
  profile_id?: string;
}

// Category type for hierarchical structure
type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  color?: string;
  description?: string;
  parent_id?: string;
  is_parent: boolean;
  usage_count?: number;
};

type Transaction = {
  id: string;
  date: string;
  description: string;
  categoryId: string;
  amount: number;
  status: string;
  notes?: string;
};

interface TransactionDetailsDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  categories?: Category[];
}

// Adjust CategoryDetails type for strict typing
type CategoryDetails = {
  id: string;
  name: string;
  type: "income" | "expense";
  color?: string;
  parentName?: string;
};

export function TransactionDetailsDialog({
  transaction,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  categories = [],
}: TransactionDetailsDialogProps) {
  const [apiCategories, setApiCategories] = useState<CategoryApiResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryDetails, setCategoryDetails] =
    useState<CategoryDetails | null>(null);
  const { makeRequest, isTokenLoading } = useAuthRequest();
  const { formatAmount } = useCurrency();

  // Fetch categories from API on first load
  useEffect(() => {
    const fetchCategories = async () => {
      if (categories.length > 0) {
        // Use provided categories
        setApiCategories(categories as CategoryApiResponse[]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await makeRequest<ApiResponse<CategoryApiResponse[]>>(
          "/api/categories"
        );

        if (!data || !data.success || !data.data) {
          throw new Error(data?.message || "Failed to load categories");
        }

        // Convert API response to match our component's type structure
        const formattedCategories = data.data.map((cat) => ({
          id: cat.id,
          name: cat.name,
          // Convert type to lowercase to match our enum
          type: cat.type?.toLowerCase() as "income" | "expense",
          color: cat.color,
          description: cat.description,
          parent_id: cat.parent_id,
          is_parent: cat.is_parent,
          usage_count: cat.usage_count,
        }));

        setApiCategories(formattedCategories);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Using mock data instead.");
        toast.error("Failed to load categories");
        // Fall back to mock data
        setApiCategories([
          {
            id: "1",
            name: "Salary",
            type: "income",
            color: "#4ade80",
            is_parent: true,
          },
          {
            id: "2",
            name: "Freelance",
            type: "income",
            color: "#60a5fa",
            is_parent: true,
          },
          {
            id: "3",
            name: "Food",
            type: "expense",
            color: "#f87171",
            is_parent: true,
          },
          {
            id: "4",
            name: "Transportation",
            type: "expense",
            color: "#fbbf24",
            is_parent: true,
          },
          {
            id: "5",
            name: "Entertainment",
            type: "expense",
            color: "#c084fc",
            is_parent: true,
          },
          {
            id: "9",
            name: "Groceries",
            type: "expense",
            color: "#fb923c",
            parent_id: "3",
            is_parent: false,
          },
          {
            id: "10",
            name: "Restaurants",
            type: "expense",
            color: "#f97316",
            parent_id: "3",
            is_parent: false,
          },
          {
            id: "11",
            name: "Gas",
            type: "expense",
            color: "#f97316",
            parent_id: "4",
            is_parent: false,
          },
          {
            id: "12",
            name: "Public Transit",
            type: "expense",
            color: "#f97316",
            parent_id: "4",
            is_parent: false,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (open && !isTokenLoading) {
      fetchCategories();
    }
  }, [open, categories, makeRequest, isTokenLoading]);

  // Get category details from provided categories or use mock data
  useEffect(() => {
    if (transaction && apiCategories.length > 0) {
      // Find the category for this transaction
      const category = apiCategories.find(
        (c) => c.id === transaction.categoryId
      );

      if (category) {
        if (category.parent_id) {
          // This is a subcategory, get the parent name too
          const parentCategory = apiCategories.find(
            (c) => c.id === category.parent_id
          );
          setCategoryDetails({
            id: category.id,
            name: category.name,
            type: category.type.toLowerCase() as "income" | "expense",
            color: category.color,
            parentName: parentCategory?.name,
          });
        } else {
          // This is a main category
          setCategoryDetails({
            id: category.id,
            name: category.name,
            type: category.type.toLowerCase() as "income" | "expense",
            color: category.color,
          });
        }
      }
    }
  }, [transaction, apiCategories]);

  if (!transaction) return null;

  // Convert string date to Date object
  const transactionDate = new Date(transaction.date);

  // Format amount with proper sign based on category type
  const amountValue = Math.abs(transaction.amount);
  const formattedAmount = formatAmount(amountValue);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            Detailed information about this transaction
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="py-8 text-center">Loading transaction details...</div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">
                  {transaction.description}
                </h3>
                <DatePicker
                  date={transactionDate}
                  disabled={true}
                  className="mt-1 p-0 h-6 min-h-0 border-none bg-transparent text-sm text-muted-foreground hover:bg-transparent hover:text-muted-foreground focus:shadow-none"
                />
              </div>
              <div
                className={`text-xl font-bold ${
                  categoryDetails?.type === "income"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {categoryDetails?.type === "income" ? "+" : "-"}
                {formattedAmount}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Category
                </p>
                {categoryDetails && (
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: categoryDetails.color }}
                    />
                    <div>
                      {categoryDetails.parentName && (
                        <span className="text-sm text-muted-foreground">
                          {categoryDetails.parentName} /{" "}
                        </span>
                      )}
                      <span>{categoryDetails.name}</span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <Badge
                  variant={
                    transaction.status.toLowerCase() === "completed"
                      ? "default"
                      : "secondary"
                  }
                >
                  {transaction.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            {transaction.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Notes
                </p>
                <p className="text-sm">{transaction.notes}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex justify-between sm:justify-between">
          <div>
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDelete(transaction);
                  onOpenChange(false);
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
                  onEdit(transaction);
                  onOpenChange(false);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
