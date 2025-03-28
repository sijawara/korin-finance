import useSWR from "swr";
import { toast } from "sonner";
import { auth } from "@/lib/init/firebase"; // Import Firebase auth
import { useAuth } from "@/lib/auth-context"; // Import auth context

// Transaction type definition
export type Transaction = {
  id: string;
  date: string;
  description: string;
  category_id: string;
  amount: number;
  status: "PAID" | "UNPAID";
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

// Mapped transaction type for UI
export type UiTransaction = {
  id: string;
  date: string;
  description: string;
  categoryId: string;
  amount: number;
  status: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

// Stats type for transaction statistics
export type TransactionStats = {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
  paidCount: number;
  unpaidCount: number;
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

// Map API transaction to UI transaction
export const mapApiToUiTransaction = (
  transaction: Transaction
): UiTransaction => ({
  id: transaction.id,
  date: transaction.date,
  description: transaction.description,
  categoryId: transaction.category_id,
  amount: transaction.amount,
  status: transaction.status.toLowerCase(),
  notes: transaction.notes,
  createdAt: transaction.created_at,
  updatedAt: transaction.updated_at,
});

// Map UI transaction to API transaction
export const mapUiToApiTransaction = (
  transaction: Partial<UiTransaction>
): Partial<Transaction> => ({
  id: transaction.id,
  date: transaction.date,
  description: transaction.description,
  category_id: transaction.categoryId,
  amount: transaction.amount,
  status: transaction.status?.toUpperCase() as "PAID" | "UNPAID",
  notes: transaction.notes,
});

export function useTransactions() {
  const { user } = useAuth(); // Get user from auth context

  // Only fetch when user is authenticated
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<Transaction[]>>(
    user ? "/api/transactions" : null,
    fetcher
  );

  // Fetch transaction statistics from the backend
  const {
    data: statsData,
    error: statsError,
    isLoading: statsLoading,
    mutate: mutateStats,
  } = useSWR<ApiResponse<TransactionStats>>(
    user ? "/api/transactions/stats" : null,
    fetcher
  );

  // Convert API transactions to UI transactions
  const transactions: UiTransaction[] =
    data?.success && data.data ? data.data.map(mapApiToUiTransaction) : [];

  // Get stats from the backend instead of calculating them in the frontend
  const stats: TransactionStats =
    statsData?.success && statsData.data
      ? statsData.data
      : {
          totalIncome: 0,
          totalExpenses: 0,
          netBalance: 0,
          transactionCount: 0,
          paidCount: 0,
          unpaidCount: 0,
        };

  // Updated CRUD operations to use Firebase auth
  const addTransaction = async (
    newTransaction: Omit<UiTransaction, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      // Get current user and token
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be logged in to create a transaction");
      }

      const token = await currentUser.getIdToken();

      const apiTransaction = mapUiToApiTransaction(newTransaction);

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiTransaction),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to create transaction");
      }

      // Revalidate both the transactions list and the stats
      mutate();
      mutateStats();
      toast.success("Transaction created successfully");
      return true;
    } catch (err) {
      console.error("Error creating transaction:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create transaction"
      );
      return false;
    }
  };

  const updateTransaction = async (updatedTransaction: UiTransaction) => {
    try {
      // Get current user and token
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be logged in to update a transaction");
      }

      const token = await currentUser.getIdToken();

      const apiTransaction = mapUiToApiTransaction(updatedTransaction);

      const response = await fetch(
        `/api/transactions/${updatedTransaction.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiTransaction),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to update transaction");
      }

      // Revalidate both the transactions list and the stats
      mutate();
      mutateStats();
      toast.success("Transaction updated successfully");
      return true;
    } catch (err) {
      console.error("Error updating transaction:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update transaction"
      );
      return false;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      // Get current user and token
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be logged in to delete a transaction");
      }

      const token = await currentUser.getIdToken();

      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to delete transaction");
      }

      // Revalidate both the transactions list and the stats
      mutate();
      mutateStats();
      toast.success("Transaction deleted successfully");
      return true;
    } catch (err) {
      console.error("Error deleting transaction:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete transaction"
      );
      return false;
    }
  };

  return {
    transactions,
    isLoading: isLoading || statsLoading,
    isError: !!error || !!statsError,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    mutate,
    // Return backend-calculated stats
    totalIncome: stats.totalIncome,
    totalExpenses: stats.totalExpenses,
    netBalance: stats.netBalance,
    transactionCount: stats.transactionCount,
    paidCount: stats.paidCount,
    unpaidCount: stats.unpaidCount,
  };
}
