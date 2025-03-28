import useSWR from "swr";
import { useAuth } from "../lib/auth-context";
import { FinancialOverviewData } from "@/app/api/reports/overview/route";

export type FinancialOverviewParams = {
  period?: string;
};

export type FinancialOverviewResponse = {
  success: boolean;
  data: FinancialOverviewData;
  message?: string;
};

/**
 * Custom hook to fetch financial overview data
 */
export function useFinancialOverview(params: FinancialOverviewParams = {}) {
  const { period = "this-month" } = params;

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
        throw new Error(data.message || "Failed to fetch financial overview");
      }

      return data as FinancialOverviewResponse;
    } catch (error) {
      console.error("Error fetching financial overview:", error);
      throw error;
    }
  };

  // Construct the API URL with query parameters
  const url = `/api/reports/overview?period=${period}`;

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
    data: data?.data,
    isLoading,
    isError: !!error,
    error,
    isValidating,
    mutate,
  };
}
