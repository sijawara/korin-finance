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
import { Pencil, Trash2, AlertCircle, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthRequest } from "../../components/with-auth";
import { toast } from "sonner";
import useCurrency from "@/hooks/useCurrency";
import { Input } from "@/components/ui/input";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";

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
  tax_amount?: number;
  status: string;
  notes?: string;
};

interface TransactionDetailsDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (transaction: Transaction) => Promise<void>;
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

// Add form schema for edit mode
const editFormSchema = z.object({
  description: z.string().min(3, {
    message: "Description must be at least 3 characters.",
  }),
  amount: z.preprocess(
    // Convert empty string to undefined
    (val) => (val === "" ? undefined : val),
    z
      .number({
        required_error: "Amount is required",
        invalid_type_error: "Amount must be a number",
      })
      .refine((val) => val !== 0, {
        message: "Amount cannot be zero.",
      })
  ),
  tax_amount: z.preprocess(
    // Convert empty string to undefined
    (val) => (val === "" ? undefined : val),
    // Validate as a number or undefined
    z
      .number({
        invalid_type_error: "Tax amount must be a number",
      })
      .optional()
  ),
  categoryId: z.string().min(1, {
    message: "Please select a category.",
  }),
  date: z.date({
    required_error: "Please select a date.",
  }),
  notes: z.string().optional(),
  status: z.enum(["paid", "unpaid"], {
    required_error: "Please select a status.",
  }),
});

type EditFormValues = z.infer<typeof editFormSchema>;

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
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategoryType, setSelectedCategoryType] = useState<
    "income" | "expense" | null
  >(null);
  const { makeRequest, isTokenLoading } = useAuthRequest();
  const { formatAmount } = useCurrency();

  // Initialize the form with transaction data
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: transaction
      ? {
          description: transaction.description,
          amount: Math.abs(transaction.amount),
          tax_amount: transaction.tax_amount,
          categoryId: transaction.categoryId,
          date: new Date(transaction.date),
          notes: transaction.notes || "",
          status: transaction.status.toLowerCase() as "paid" | "unpaid",
        }
      : {
          description: "",
          amount: undefined,
          tax_amount: undefined,
          categoryId: "",
          date: new Date(),
          notes: "",
          status: "paid",
        },
  });

  // Update form values when transaction changes
  useEffect(() => {
    if (transaction) {
      form.reset({
        description: transaction.description,
        amount: Math.abs(transaction.amount),
        tax_amount: transaction.tax_amount,
        categoryId: transaction.categoryId,
        date: new Date(transaction.date),
        notes: transaction.notes || "",
        status: transaction.status.toLowerCase() as "paid" | "unpaid",
      });
    }
  }, [transaction, form]);

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
        // Set the selected category type for the form
        setSelectedCategoryType(
          category.type.toLowerCase() as "income" | "expense"
        );

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

  // Function to handle form submission
  const onSubmit = async (values: EditFormValues) => {
    if (!transaction) return;

    setIsSubmitting(true);

    try {
      // No need to modify the amount here since we're handling it in the input
      const updatedTransaction = {
        ...transaction,
        description: values.description,
        amount: values.amount,
        tax_amount: values.tax_amount,
        categoryId: values.categoryId,
        date: values.date.toISOString(),
        notes: values.notes,
        status: values.status,
      };

      // Call the onEdit function with the updated transaction
      if (onEdit) {
        await onEdit(updatedTransaction);
      }

      // Exit edit mode
      setIsEditMode(false);
    } catch (error) {
      console.error("Error updating transaction:", error);
      // Show error feedback if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  // Organize categories to display in form
  const organizeCategories = () => {
    const parents = apiCategories.filter((cat) => cat.is_parent);
    const children = apiCategories.filter((cat) => !cat.is_parent);

    // Group children by their parent ID
    const childrenByParent = children.reduce((acc, child) => {
      if (!acc[child.parent_id!]) {
        acc[child.parent_id!] = [];
      }
      acc[child.parent_id!].push(child);
      return acc;
    }, {} as Record<string, CategoryApiResponse[]>);

    return { parents, childrenByParent };
  };

  const { parents, childrenByParent } = organizeCategories();

  if (!transaction) return null;

  // Convert string date to Date object
  const transactionDate = new Date(transaction.date);

  // Format amount with proper sign based on category type
  const amountValue = Math.abs(transaction.amount);
  const formattedAmount = formatAmount(amountValue);

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
            {isEditMode ? "Edit Transaction" : "Transaction Details"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update transaction information"
              : "Detailed information about this transaction"}
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
        ) : isEditMode ? (
          // Edit Mode View
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-4"
            >
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter amount"
                          value={value === undefined ? "" : Math.abs(Number(value || 0))}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            if (inputValue === "") {
                              onChange(undefined);
                              return;
                            }
                            const absValue = Math.abs(parseFloat(inputValue));
                            // Make negative if expense category is selected
                            const finalValue = selectedCategoryType === "expense" ? -absValue : absValue;
                            onChange(finalValue);
                          }}
                          variant={selectedCategoryType || "default"}
                          {...fieldProps}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onDateChange={field.onChange}
                          placeholder="Select transaction date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tax Amount */}
              <FormField
                control={form.control}
                name="tax_amount"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Tax Amount (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter tax amount"
                        value={
                          value === undefined
                            ? ""
                            : Math.abs(Number(value))
                        }
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          if (inputValue === "") {
                            onChange(undefined);
                            return;
                          }
                          const absValue = Math.abs(parseFloat(inputValue));
                          // Always make tax amount negative
                          onChange(-absValue);
                        }}
                        variant="expense"
                        {...fieldProps}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          const category = apiCategories.find(
                            (cat) => cat.id === value
                          );
                          setSelectedCategoryType(
                            (category?.type.toLowerCase() as
                              | "income"
                              | "expense") || null
                          );
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* Income categories */}
                          {parents
                            .filter(
                              (parent) => parent.type.toLowerCase() === "income"
                            )
                            .map((parent) => (
                              <SelectItem key={parent.id} value={parent.id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: parent.color }}
                                  />
                                  <span>{parent.name}</span>
                                </div>
                              </SelectItem>
                            ))}

                          {/* Expense categories */}
                          {parents
                            .filter(
                              (parent) =>
                                parent.type.toLowerCase() === "expense"
                            )
                            .map((parent) => (
                              <React.Fragment key={parent.id}>
                                <SelectItem key={parent.id} value={parent.id}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: parent.color }}
                                    />
                                    <span>{parent.name}</span>
                                  </div>
                                </SelectItem>

                                {/* Child categories */}
                                {childrenByParent[parent.id]?.map((child) => (
                                  <SelectItem key={child.id} value={child.id}>
                                    <div className="flex items-center gap-2 ml-4">
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: child.color }}
                                      />
                                      <span className="text-sm">
                                        {child.name}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </React.Fragment>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="paid">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500" />
                              <span>Paid</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="unpaid">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-amber-500" />
                              <span>Unpaid</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Add any additional notes"
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
                <h3 className="text-lg font-semibold">
                  {transaction.description}
                </h3>
                <DatePicker
                  date={transactionDate}
                  disabled={true}
                  className="mt-1 p-0 h-6 min-h-0 border-none bg-transparent text-sm text-muted-foreground hover:bg-transparent hover:text-muted-foreground focus:shadow-none"
                />
              </div>
              <div>
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
                {transaction.tax_amount !== null &&
                  transaction.tax_amount !== undefined && (
                    <div className="text-sm text-right text-muted-foreground">
                      Incl. tax:{" "}
                      {formatAmount(Math.abs(transaction.tax_amount || 0))}
                    </div>
                  )}
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
                    transaction.status.toLowerCase() === "paid"
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

        {!isEditMode && (
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
