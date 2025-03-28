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
import { Trash2, AlertCircle } from "lucide-react";

// Category type definition
type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  color?: string;
  icon?: string;
  description?: string;
  usageCount: number;
};

interface DeleteCategoryDialogProps {
  category: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

export function DeleteCategoryDialog({
  category,
  open,
  onOpenChange,
  onDelete,
}: DeleteCategoryDialogProps) {
  const handleDelete = () => {
    onDelete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Delete Category
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this category? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="font-medium">{category.name}</span>
          </div>

          {category.usageCount > 0 && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-amber-800 dark:text-amber-300 text-sm">
              <p className="font-medium">Warning</p>
              <p>
                This category is used in {category.usageCount} transaction
                {category.usageCount !== 1 ? "s" : ""}. If you delete it, these
                transactions will no longer have a category assigned.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
