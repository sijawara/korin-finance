import useSWR from "swr";
import { auth } from "@/lib/init/firebase";
import { useAuth } from "@/lib/auth-context";
import { IncomeStatementData } from "@/app/api/reports/income-statement/route";

// API Response type
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

// Fetch function for SWR - uses Firebase auth
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

export function useIncomeStatement(period: string) {
  const { user } = useAuth();

  // Only fetch when user is authenticated and period is provided
  const { data, error, isLoading, mutate } = useSWR<
    ApiResponse<IncomeStatementData>
  >(user ? `/api/reports/income-statement?period=${period}` : null, fetcher);

  // Extract the income statement data
  const incomeStatement = data?.success && data.data ? data.data : null;

  // Return hook data
  return {
    incomeStatement,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
