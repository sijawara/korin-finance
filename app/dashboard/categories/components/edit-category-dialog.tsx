"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";

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
  usageCount: z.number(),
  // New fields for hierarchical categories
  parentId: z.string().optional(),
  isParent: z.boolean().default(false),
});

type Category = z.infer<typeof formSchema>;

interface EditCategoryDialogProps {
  category: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (category: Category) => void;
}

export function EditCategoryDialog({
  category,
  open,
  onOpenChange,
  onSave,
}: EditCategoryDialogProps) {
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

  // Current available parent categories for selection
  // In a real app, this would be fetched from your backend
  const availableParentCategories = [
    { id: "1", name: "Housing" },
    { id: "3", name: "Food" },
    { id: "4", name: "Transportation" },
    { id: "5", name: "Entertainment" },
    { id: "6", name: "Debt Payments" },
  ];

  const form = useForm<Category>({
    resolver: zodResolver(formSchema),
    defaultValues: category,
  });

  // Update form when category changes
  useEffect(() => {
    if (category) {
      form.reset(category);
    }
  }, [category, form]);

  function onSubmit(values: Category) {
    onSave(values);
  }

  // Watch for isParent changes to reset parentId appropriately
  const isParent = form.watch("isParent");
  useEffect(() => {
    if (isParent) {
      form.setValue("parentId", undefined);
    }
  }, [isParent, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update this category&apos;s details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            {/* New field: Category Hierarchy Type */}
            <FormField
              control={form.control}
              name="isParent"
              render={({ field }) => (
                <FormItem className="space-y-0 rounded-md border p-4 relative">
                  <div className="flex flex-row items-center justify-between space-x-2">
                    {/* Invisible overlay that makes the entire card clickable */}
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
                        {availableParentCategories.map((parent) => (
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
                              style={{ backgroundColor: field.value }}
                            />
                            <span>
                              {colors.find((c) => c.value === field.value)
                                ?.label || "Custom Color"}
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

            <DialogFooter>
              <div className="flex flex-col sm:flex-row w-full justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Used in {category.usageCount} transaction
                  {category.usageCount !== 1 ? "s" : ""}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
