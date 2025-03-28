import useSWR from "swr";
import { getAuth } from "firebase/auth";
import { CategoriesData } from "@/app/api/reports/categories/route";

export type CategoriesReportParams = {
  period?: string;
};

export type CategoriesReportResponse = {
  success: boolean;
  data: CategoriesData;
  message?: string;
};

/**
 * Custom hook to fetch categories report data from the API
 */
export function useCategoriesReport(params: CategoriesReportParams = {}) {
  const { period = "this-month" } = params;

  // Firebase authentication
  const auth = getAuth();

  // SWR fetcher function
  const fetcher = async (url: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      // Get ID token
      const token = await currentUser.getIdToken();

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
          data.message || "Failed to fetch categories report data"
        );
      }

      return data as CategoriesReportResponse;
    } catch (error) {
      console.error("Error fetching categories report data:", error);
      throw error;
    }
  };

  // Construct the API URL with query parameters
  const url = `/api/reports/categories?period=${period}`;

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
    categoriesData: data?.data,
    isLoading,
    isError: !!error,
    error,
    isValidating,
    mutate,
  };
}
