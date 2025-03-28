"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "./init/firebase";
import { useRouter, usePathname } from "next/navigation";

// Auth context type
type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string>;
};

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  getIdToken: async () => "",
});

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Protected route paths (require authentication)
const protectedPaths = ["/dashboard"];

// Public paths (no authentication required)
const publicPaths = ["/", "/auth"];

// Auth Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Sign out function
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push("/auth");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // Get ID token function
  const getIdToken = async (): Promise<string> => {
    if (!user) {
      console.error("No user is signed in");
      return "";
    }
    try {
      const token = await user.getIdToken();
      return token;
    } catch (error) {
      console.error("Error getting ID token:", error);
      return "";
    }
  };

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Handle route protection
  useEffect(() => {
    if (!loading) {
      const isProtectedRoute = protectedPaths.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
      );

      const isPublicRoute = publicPaths.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
      );

      if (isProtectedRoute && !user) {
        // Redirect to auth page if user is not authenticated and trying to access protected route
        router.push("/auth");
      } else if (user && isPublicRoute && pathname === "/auth") {
        // Redirect to dashboard if user is already authenticated and trying to access auth page
        router.push("/dashboard");
      }
    }
  }, [user, loading, pathname, router]);

  const value = {
    user,
    loading,
    signOut,
    getIdToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
