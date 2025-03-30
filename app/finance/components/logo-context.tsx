"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useTheme } from "next-themes";

type LogoContextType = {
  logoPath: string;
  isDark: boolean;
};

const LogoContext = createContext<LogoContextType | undefined>(undefined);

export function LogoProvider({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // After mounting, allow client-side theme detection to work
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const value = useMemo(() => {
    const isDark = mounted && (theme === "dark" || resolvedTheme === "dark");

    return {
      logoPath: isDark
        ? "/logo/KorinAILogo-White.svg"
        : "/logo/KorinAILogo-Black.svg",
      isDark,
    };
  }, [theme, resolvedTheme, mounted]);

  return <LogoContext.Provider value={value}>{children}</LogoContext.Provider>;
}

export function useLogo() {
  const context = useContext(LogoContext);
  if (context === undefined) {
    throw new Error("useLogo must be used within a LogoProvider");
  }
  return context;
}
