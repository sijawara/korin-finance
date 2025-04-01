import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";

// Define the currency types
export type CurrencyCode = "USD" | "IDR" | "SGD";

export interface Currency {
  code: CurrencyCode;
  name: string;
  symbol: string;
}

// Currency data
const currencies: Record<CurrencyCode, Currency> = {
  USD: { code: "USD", name: "US Dollar", symbol: "$" },
  IDR: { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  SGD: { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
};

// Default currency
const DEFAULT_CURRENCY: CurrencyCode = "IDR";

// Helper function to format numbers with K, M, B suffixes
const formatWithSuffix = (amount: number): string => {
  if (Math.abs(amount) >= 1_000_000_000) {
    return (amount / 1_000_000_000).toFixed(1) + "B";
  } else if (Math.abs(amount) >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1) + "M";
  } else if (Math.abs(amount) >= 1_000) {
    return (amount / 1_000).toFixed(1) + "K";
  } else {
    return amount.toFixed(0);
  }
};

export function useCurrency() {
  const [currencyCode, setCurrencyCode] =
    useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, getIdToken } = useAuth();

  // Fetch user's currency preference from settings API
  useEffect(() => {
    const fetchCurrencySetting = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = await getIdToken();
        const response = await fetch("/api/settings", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch currency settings");
        }

        const data = await response.json();

        if (data.success && data.data && data.data.currency) {
          // Validate that the currency code exists in our defined currencies
          const code = data.data.currency as CurrencyCode;
          if (currencies[code]) {
            setCurrencyCode(code);
          } else {
            console.warn(
              `Unknown currency code: ${code}, falling back to ${DEFAULT_CURRENCY}`
            );
            setCurrencyCode(DEFAULT_CURRENCY);
          }
        }
      } catch (err) {
        console.error("Error fetching currency settings:", err);
        setError("Failed to load currency settings");
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencySetting();
  }, [user, getIdToken]);

  // Get the current currency object
  const currency = currencies[currencyCode] || currencies[DEFAULT_CURRENCY];

  // Format amount with the user's preferred currency
  const formatAmount = useCallback(
    (amount: number, useSuffix = true) => {
      // Use K, M, B for large numbers if requested
      if (useSuffix && Math.abs(amount) >= 1000) {
        return `${currency.symbol}${formatWithSuffix(amount)}`;
      }

      // For smaller amounts, use the currency symbol directly instead of the default formatting
      return `${currency.symbol}${amount.toLocaleString("en-US", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`;
    },
    [currencyCode, currency.symbol]
  );

  // Format with custom options but using the user's currency
  const formatCurrency = useCallback(
    (
      amount: number,
      options: Intl.NumberFormatOptions = {},
      useSuffix = false
    ) => {
      // Use K, M, B for large numbers if requested
      if (useSuffix && Math.abs(amount) >= 1000) {
        return `${currency.symbol}${formatWithSuffix(amount)}`;
      }

      return amount.toLocaleString("en-US", {
        style: "currency",
        currency: currencyCode,
        ...options,
      });
    },
    [currencyCode, currency.symbol]
  );

  // Simple formatting with just the symbol
  const formatWithSymbol = useCallback(
    (amount: number, useSuffix = true) => {
      // Use K, M, B for large numbers if requested
      if (useSuffix && Math.abs(amount) >= 1000) {
        return `${currency.symbol}${formatWithSuffix(amount)}`;
      }

      return `${currency.symbol}${amount.toLocaleString()}`;
    },
    [currency]
  );

  return {
    currencyCode,
    currency,
    loading,
    error,
    formatAmount,
    formatCurrency,
    formatWithSymbol,
    // Export the currency list for settings page
    currencies: Object.values(currencies),
  };
}

export default useCurrency;
