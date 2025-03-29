import useSWR from "swr";
import { useAuth } from "@/lib/auth-context"; // Import the auth context

// Define types for the accounts data
export interface Transaction {
  id: string;
  description: string;
  date: string;
  dueDate: string;
  amount: number;
  status: "PAID" | "UNPAID";
  daysOverdue: number;
}

export interface AccountsData {
  receivable: {
    total: number;
    paid: number;
    unpaid: number;
    overdue: number;
    count: number;
    overdueCount: number;
    transactions: Transaction[];
  };
  payable: {
    total: number;
    paid: number;
    unpaid: number;
    overdue: number;
    count: number;
    overdueCount: number;
    transactions: Transaction[];
  };
  periodLabel: string;
}

export interface AccountsResponse {
  success: boolean;
  data?: AccountsData;
  message?: string;
  receivable?: {
    total: number;
    paid: number;
    unpaid: number;
    overdue: number;
    count: number;
    overdueCount: number;
    transactions: Transaction[];
  };
  payable?: {
    total: number;
    paid: number;
    unpaid: number;
    overdue: number;
    count: number;
    overdueCount: number;
    transactions: Transaction[];
  };
  periodLabel?: string;
}

export function useAccounts(period: string = "this-month") {
  const { getIdToken } = useAuth(); // Get the authentication hook

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
          "Content-Type": "application/json",
        },
      });

      // Parse response
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `API request failed with status ${response.status}`
        );
      }

      return data as AccountsResponse;
    } catch (error) {
      console.error("Error fetching accounts data:", error);
      throw error;
    }
  };

  // Construct the API URL with query parameters
  const url = `/api/reports/accounts?period=${period}`;

  // Use SWR to fetch and cache data
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  // Transform the API response to match the expected AccountsData structure
  const accountsData =
    data && "receivable" in data && "payable" in data && "periodLabel" in data
      ? {
          receivable: data.receivable,
          payable: data.payable,
          periodLabel: data.periodLabel,
        }
      : data?.data;

  return {
    accountsData,
    isLoading,
    isError: !!error,
    error,
    isValidating,
    mutate,
  };
}
