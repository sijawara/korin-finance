import useSWR from "swr";
import { useAuth } from "../lib/auth-context";

export type TransactionSummaryParams = {
  startDate?: string;
  endDate?: string;
};

export type TransactionSummaryData = {
  total_income: number;
  total_expenses: number;
  net_balance: number;
};

export type TransactionSummaryResponse = {
  success: boolean;
  data: TransactionSummaryData;
  meta: {
    startDate: string;
    endDate: string;
  };
};

/**
 * Custom hook to fetch transaction summary data from the API
 */
export function useTransactionSummary(params: TransactionSummaryParams = {}) {
  const { startDate, endDate } = params;

  // Get auth context instead of Firebase auth directly
  const { getIdToken } = useAuth();

  // SWR fetcher function
  const fetcher = async (url: string) => {
    try {
      // Get ID token using the auth context
      const token = await getIdToken();

      if (!token) {
        throw new Error("User not authenticated");
      }

      // Fetch data from API
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Parse response
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch transaction summary data"
        );
      }

      return data as TransactionSummaryResponse;
    } catch (error) {
      console.error("Error fetching transaction summary data:", error);
      throw error;
    }
  };

  // Construct the API URL with query parameters
  let url = "/api/transactions/summary";
  const queryParams = [];

  if (startDate) {
    queryParams.push(`startDate=${startDate}`);
  }

  if (endDate) {
    queryParams.push(`endDate=${endDate}`);
  }

  if (queryParams.length > 0) {
    url += `?${queryParams.join("&")}`;
  }

  // Use SWR to fetch and cache data
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  return {
    summaryData: data?.data,
    period: data?.meta,
    isLoading,
    isError: !!error,
    error,
    isValidating,
    mutate,
  };
}
