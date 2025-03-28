import useSWR from "swr";
import { toast } from "sonner";
import { auth } from "@/lib/init/firebase"; // Import Firebase auth
import { useAuth } from "@/lib/auth-context"; // Import auth context

// Category type definition (API type)
export type Category = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color?: string;
  icon?: string;
  description?: string;
  usage_count: number;
  // Hierarchical category fields
  parent_id?: string;
  is_parent: boolean;
};

// Mapped frontend category type
export type UiCategory = {
  id: string;
  name: string;
  type: "income" | "expense";
  color?: string;
  icon?: string;
  description?: string;
  usageCount: number;
  parentId?: string;
  isParent: boolean;
};

// Stats type for category statistics
export type CategoryStats = {
  totalCategories: number;
  incomeCategories: number;
  expenseCategories: number;
  parentCategories: number;
};

// API Response types
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

// Fetch function for SWR - now uses Firebase auth
const fetcher = async (url: string) => {
  // Get current Firebase user
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be logged in to access this resource");
  }

  // Get the ID token
  const token = await currentUser.getIdToken();

  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }

  return response.json();
};

// Map API category to UI category
export const mapApiToUiCategory = (category: Category): UiCategory => ({
  id: category.id,
  name: category.name,
  type: category.type.toLowerCase() as "income" | "expense",
  color: category.color,
  icon: category.icon,
  description: category.description,
  usageCount: category.usage_count || 0,
  parentId: category.parent_id,
  isParent: category.is_parent,
});

// Map UI category to API category
export const mapUiToApiCategory = (
  category: Partial<UiCategory>
): Partial<Omit<Category, "type"> & { type?: "INCOME" | "EXPENSE" }> => ({
  id: category.id,
  name: category.name,
  type: category.type
    ? (category.type.toUpperCase() as "INCOME" | "EXPENSE")
    : undefined,
  color: category.color,
  icon: category.icon,
  description: category.description,
  parent_id: category.parentId,
  is_parent: category.isParent,
});

export function useCategories() {
  const { user } = useAuth(); // Get user from auth context

  // Only fetch when user is authenticated
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<Category[]>>(
    user ? "/api/categories" : null,
    fetcher
  );

  // Fetch category statistics from the backend
  const {
    data: statsData,
    error: statsError,
    isLoading: statsLoading,
    mutate: mutateStats,
  } = useSWR<ApiResponse<CategoryStats>>(
    user ? "/api/categories/stats" : null,
    fetcher
  );

  // Convert API categories to UI categories
  const categories: UiCategory[] =
    data?.success && data.data ? data.data.map(mapApiToUiCategory) : [];

  // Get stats from the backend instead of calculating them in the frontend
  const stats: CategoryStats =
    statsData?.success && statsData.data
      ? statsData.data
      : {
          totalCategories: 0,
          incomeCategories: 0,
          expenseCategories: 0,
          parentCategories: 0,
        };

  // Updated CRUD operations to use Firebase auth
  const addCategory = async (
    newCategory: Omit<UiCategory, "id" | "usageCount">
  ) => {
    try {
      // Get current user and token
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be logged in to create a category");
      }

      const token = await currentUser.getIdToken();

      const apiCategory = mapUiToApiCategory(newCategory);

      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiCategory),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to create category");
      }

      // Revalidate both the categories list and the stats
      mutate();
      mutateStats();
      toast.success("Category created successfully");
      return true;
    } catch (err) {
      console.error("Error creating category:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create category"
      );
      return false;
    }
  };

  const updateCategory = async (updatedCategory: UiCategory) => {
    try {
      // Get current user and token
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be logged in to update a category");
      }

      const token = await currentUser.getIdToken();

      const apiCategory = mapUiToApiCategory(updatedCategory);

      const response = await fetch(`/api/categories/${updatedCategory.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiCategory),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to update category");
      }

      // Revalidate both the categories list and the stats
      mutate();
      mutateStats();
      toast.success("Category updated successfully");
      return true;
    } catch (err) {
      console.error("Error updating category:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update category"
      );
      return false;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      // Get current user and token
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be logged in to delete a category");
      }

      const token = await currentUser.getIdToken();

      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to delete category");
      }

      // Revalidate both the categories list and the stats
      mutate();
      mutateStats();
      toast.success("Category deleted successfully");
      return true;
    } catch (err) {
      console.error("Error deleting category:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete category"
      );
      return false;
    }
  };

  return {
    categories,
    isLoading: isLoading || statsLoading,
    isError: !!error || !!statsError,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    mutate,
    // Return backend-calculated stats
    totalCategories: stats.totalCategories,
    incomeCategories: stats.incomeCategories,
    expenseCategories: stats.expenseCategories,
    parentCategories: stats.parentCategories,
  };
}
