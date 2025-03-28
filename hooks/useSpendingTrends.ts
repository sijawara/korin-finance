import useSWR from "swr";
import { auth } from "@/lib/init/firebase";
import { useAuth } from "@/lib/auth-context";
import { SpendingTrendsData } from "@/app/api/reports/spending-trends/route";

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

export function useSpendingTrends(period: string) {
  const { user } = useAuth();

  // Only fetch when user is authenticated and period is provided
  const { data, error, isLoading, mutate } = useSWR<
    ApiResponse<SpendingTrendsData>
  >(user ? `/api/reports/spending-trends?period=${period}` : null, fetcher);

  // Extract the spending trends data
  const spendingTrends = data?.success && data.data ? data.data : null;

  // Return hook data
  return {
    spendingTrends,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
