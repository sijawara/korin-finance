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
  const { getIdToken, user, loading: authLoading, isAuthenticated } = useAuth();

  // SWR fetcher function
  const fetcher = async (url: string) => {
    // Maximum retries for auth issues
    const MAX_AUTH_RETRIES = 3;
    let retryCount = 0;

    while (retryCount < MAX_AUTH_RETRIES) {
      try {
        // If auth is still loading, wait a bit
        if (authLoading) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          retryCount++;
          continue;
        }

        // Ensure user is authenticated
        if (!isAuthenticated || !user) {
          // If reached max retries, throw error
          if (retryCount >= MAX_AUTH_RETRIES - 1) {
            throw new Error("User not authenticated after multiple attempts");
          }

          // Wait and retry
          await new Promise((resolve) => setTimeout(resolve, 1000));
          retryCount++;
          continue;
        }

        // Get ID token using the auth context
        const token = await getIdToken();

        if (!token) {
          // If no token after retries, throw error
          if (retryCount >= MAX_AUTH_RETRIES - 1) {
            throw new Error("Failed to get authentication token");
          }

          // Wait and retry
          await new Promise((resolve) => setTimeout(resolve, 1000));
          retryCount++;
          continue;
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

        // Successfully got data, return it
        return data as FinancialOverviewResponse;
      } catch (error) {
        // If it's the last retry or not an auth-related error, rethrow
        if (
          retryCount >= MAX_AUTH_RETRIES - 1 ||
          !(error instanceof Error) ||
          (!error.message.includes("auth") &&
            !error.message.includes("token") &&
            !error.message.includes("User"))
        ) {
          console.error("Error fetching financial overview:", error);
          throw error;
        }

        // Otherwise increment retry count and try again
        retryCount++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // This should not be reached, but TypeScript requires a return
    throw new Error("Failed to fetch data after maximum retries");
  };

  // Construct the API URL with query parameters
  const url = `/api/reports/overview?period=${period}`;

  // Use SWR to fetch and cache data
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    // Only start fetching when auth is ready
    !isAuthenticated && authLoading ? null : url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      // Add retry logic for auth loading issues
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      // Increase the dedupe interval to handle auth initialization
      dedupingInterval: 5000,
      // Suspend loading until ready
      suspense: false,
    }
  );

  return {
    data: data?.data,
    isLoading: isLoading || authLoading,
    isError: !!error && !authLoading,
    error,
    isValidating,
    mutate,
  };
}
