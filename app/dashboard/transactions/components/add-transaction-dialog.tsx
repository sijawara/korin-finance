"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuthRequest } from "../../components/with-auth";
import { toast } from "sonner";

// Define API response type
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// CategoryApiResponse type
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

// Category type definition for hierarchical structure
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

const formSchema = z.object({
  description: z.string().min(3, {
    message: "Description must be at least 3 characters.",
  }),
  amount: z.preprocess(
    // Convert empty string to undefined (which will fail required validation)
    (val) => (val === "" ? undefined : val),
    // Validate as a number
    z
      .number({
        required_error: "Amount is required",
        invalid_type_error: "Amount must be a number",
      })
      .refine((val) => val !== 0, {
        message: "Amount cannot be zero.",
      })
  ),
  category: z.string().min(1, {
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

type TransactionFormValues = z.infer<typeof formSchema>;

// Add addTransaction prop type
type AddTransactionDialogProps = {
  addTransaction?: (transaction: {
    description: string;
    amount: number;
    categoryId: string;
    date: string;
    notes?: string;
    status: string;
  }) => Promise<boolean>;
};

export function AddTransactionDialog({
  addTransaction,
}: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryType, setSelectedCategoryType] = useState<
    "income" | "expense" | null
  >(null);
  const { makeRequest, isTokenLoading } = useAuthRequest();

  // Fetch categories from the API
  useEffect(() => {
    const fetchCategories = async () => {
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

        setCategories(formattedCategories);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Using mock data instead.");
        toast.error("Failed to load categories");
        // Fall back to mock data
        setCategories([
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
  }, [open, makeRequest, isTokenLoading]);

  // Organize categories by parent/child hierarchy
  const organizeCategories = () => {
    const parents = categories.filter((cat) => cat.is_parent);
    const children = categories.filter((cat) => !cat.is_parent);

    // Group children by their parent ID
    const childrenByParent = children.reduce((acc, child: Category) => {
      if (!acc[child.parent_id!]) {
        acc[child.parent_id!] = [];
      }
      acc[child.parent_id!].push(child);
      return acc;
    }, {} as Record<string, Category[]>);

    return { parents, childrenByParent };
  };

  const { parents, childrenByParent } = organizeCategories();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: undefined,
      category: "",
      date: new Date(),
      notes: "",
      status: "paid",
    },
  });

  function onSubmit(values: TransactionFormValues) {
    // Apply positive/negative amount based on category type
    const selectedCategory = categories.find(
      (cat) => cat.id === values.category
    );
    const finalAmount =
      Math.abs(values.amount) * (selectedCategory?.type === "expense" ? -1 : 1);

    // Create a transaction object to send to the API
    const createTransaction = async () => {
      try {
        // Use addTransaction from props or fall back to direct API call
        const transactionData = {
          description: values.description,
          amount: finalAmount,
          categoryId: values.category,
          date: values.date.toISOString(),
          notes: values.notes || "",
          status: values.status,
        };

        if (addTransaction) {
          // Use the provided addTransaction function
          // Don't show toast here as useTransactions.addTransaction already has toast notifications
          const success = await addTransaction(transactionData);
          if (!success) {
            throw new Error("Failed to create transaction");
          }
        } else {
          // Fall back to direct API call if addTransaction is not provided
          interface TransactionResponse {
            id: string;
            description: string;
            amount: number;
            category_id: string;
            date: string;
            notes?: string;
            created_at: string;
            updated_at: string;
          }

          const response = await makeRequest<ApiResponse<TransactionResponse>>(
            "/api/transactions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                description: values.description,
                amount: finalAmount,
                category_id: values.category,
                date: values.date.toISOString(),
                notes: values.notes || "",
                status: values.status.toUpperCase(),
              }),
            }
          );

          if (!response || !response.success) {
            throw new Error(
              response?.message || "Failed to create transaction"
            );
          }

          // Only show toast when using direct API call
          toast.success("Transaction added successfully");
        }
      } catch (error) {
        console.error("Error creating transaction:", error);

        // Only show error toast for the direct API call case
        if (!addTransaction) {
          toast.error("Failed to create transaction");
        }
      }
    };

    // Execute the transaction creation
    createTransaction();

    // Close the dialog
    setOpen(false);

    // Reset the form
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Enter the details of your transaction below.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            {/* Amount and Date in the same row */}
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
                        value={value === 0 ? "" : Math.abs(Number(value || 0))}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          onChange(
                            inputValue === ""
                              ? undefined
                              : Math.abs(parseFloat(inputValue))
                          );
                        }}
                        className={
                          selectedCategoryType
                            ? `${
                                selectedCategoryType === "expense"
                                  ? "border-red-300 focus-visible:ring-red-200"
                                  : "border-green-300 focus-visible:ring-green-200"
                              }`
                            : ""
                        }
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

            {/* Category and Status in the same row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        const category = categories.find(
                          (cat) => cat.id === value
                        );
                        setSelectedCategoryType(category?.type || null);
                      }}
                      defaultValue={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loading
                                ? "Loading categories..."
                                : "Select a category"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Income categories group */}
                        <SelectGroup>
                          <SelectLabel>Income</SelectLabel>
                          {parents
                            .filter((parent) => parent.type === "income")
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
                        </SelectGroup>

                        {/* Expense categories group with subcategories */}
                        <SelectGroup>
                          <SelectLabel>Expenses</SelectLabel>
                          {parents
                            .filter((parent) => parent.type === "expense")
                            .map((parent) => (
                              <React.Fragment key={parent.id}>
                                {/* Parent category */}
                                <SelectItem value={parent.id}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: parent.color }}
                                    />
                                    <span className="font-medium">
                                      {parent.name}
                                    </span>
                                  </div>
                                </SelectItem>

                                {/* Child categories with indentation */}
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
                        </SelectGroup>
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
                    <Input placeholder="Add any additional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Transaction</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
