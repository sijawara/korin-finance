"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

// Type definitions for the context
type AuthRequestContextType = {
  makeRequest: <T>(url: string, options?: RequestInit) => Promise<T | null>;
  isTokenLoading: boolean;
};

// Create the context
const AuthRequestContext = createContext<AuthRequestContextType | null>(null);

// Hook to use the auth request context
export function useAuthRequest() {
  const context = useContext(AuthRequestContext);
  if (!context) {
    throw new Error("useAuthRequest must be used within a WithAuth provider");
  }
  return context;
}

// WithAuth component props
type WithAuthProps = {
  children: ReactNode;
};

export function WithAuth({ children }: WithAuthProps) {
  const { user } = useAuth();
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Get the auth token from Firebase
  const getAuthToken = useCallback(
    async (forceRefresh = false): Promise<string | null> => {
      if (!user) {
        // Don't show error toast here as this might be called during initial loading
        return null;
      }

      try {
        setIsTokenLoading(true);
        const token = await user.getIdToken(forceRefresh);
        setAuthToken(token);
        return token;
      } catch (error) {
        console.error("Error getting auth token:", error);
        toast.error("Authentication error");
        return null;
      } finally {
        setIsTokenLoading(false);
      }
    },
    [user]
  );

  // Initialize token when user changes
  useEffect(() => {
    getAuthToken();
  }, [getAuthToken]);

  // Refresh token periodically (every 50 minutes)
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      getAuthToken(true); // Force refresh
    }, 50 * 60 * 1000); // 50 minutes (Firebase tokens expire after 60 minutes)

    return () => clearInterval(intervalId);
  }, [user, getAuthToken]);

  // Make an authenticated request
  const makeRequest = async <T,>(
    url: string,
    options?: RequestInit
  ): Promise<T | null> => {
    try {
      // Try to use existing token or get a new one if needed
      let token = authToken;
      if (!token) {
        token = await getAuthToken();
        if (!token) {
          toast.error("Authentication required");
          return null;
        }
      }

      // Create headers with authorization
      const headers = {
        ...(options?.headers || {}),
        Authorization: `Bearer ${token}`,
      };

      // Make the request
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Parse the response
      const data = await response.json();

      // Handle authentication errors (401)
      if (response.status === 401) {
        console.log("Auth token expired, refreshing...");
        // Try to refresh the token
        const refreshedToken = await getAuthToken(true);

        if (refreshedToken) {
          // Retry the request with new token
          const retryHeaders = {
            ...(options?.headers || {}),
            Authorization: `Bearer ${refreshedToken}`,
          };

          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
          });

          return await retryResponse.json();
        } else {
          toast.error("Session expired. Please log in again.");
          return null;
        }
      }

      return data;
    } catch (error) {
      console.error("Error making authenticated request:", error);
      toast.error("Failed to make request. Please try again.");
      return null;
    }
  };

  // Context value
  const contextValue: AuthRequestContextType = {
    makeRequest,
    isTokenLoading,
  };

  return (
    <AuthRequestContext.Provider value={contextValue}>
      {children}
    </AuthRequestContext.Provider>
  );
}
