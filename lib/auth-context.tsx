"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { auth } from "./init/firebase";
import { useRouter, usePathname } from "next/navigation";

// Auth context type
type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string>;
  isAuthenticated: boolean;
};

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  getIdToken: async () => "",
  isAuthenticated: false,
});

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Protected route paths (require authentication)
const protectedPaths = ["/finance"];

// Public paths (no authentication required)
const publicPaths = ["/", "/auth"];

// Auth Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Sign out function
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setIsAuthenticated(false);
      router.push("/auth");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // Get ID token function with caching
  const getIdToken = async (): Promise<string> => {
    if (!user) {
      console.error("No user is signed in");
      return "";
    }
    try {
      const token = await user.getIdToken(false); // Don't force refresh by default
      return token;
    } catch (error) {
      console.error("Error getting ID token:", error);
      return "";
    }
  };

  useEffect(() => {
    // Set persistence to LOCAL - this ensures Firebase keeps the user
    // logged in even after browser refresh/restart
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log("Auth persistence set to LOCAL");
      })
      .catch((error) => {
        console.error("Error setting persistence:", error);
      });

    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      setLoading(false);

      // Log auth state for debugging
      console.log(
        "Auth state changed:",
        currentUser ? "User authenticated" : "No user"
      );
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
        router.push("/finance");
      }
    }
  }, [user, loading, pathname, router]);

  const value = {
    user,
    loading,
    signOut,
    getIdToken,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
