"use client";

import * as React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useLogo } from "./logo-context";

interface KorinAILogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
  textClassName?: string;
}

export function KorinAILogo({
  className,
  size = 32,
  withText = false,
  textClassName,
}: KorinAILogoProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // After mounting, allow client-side theme detection to work
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which logo to use based on the theme
  const logoSrc = React.useMemo(() => {
    if (!mounted) return "/logo/KorinAILogo-Black.svg"; // Default for SSR

    // First, try to match the explicitly set theme
    if (theme === "dark" || resolvedTheme === "dark") {
      return "/logo/KorinAILogo-White.svg";
    }

    // Default to black logo for light theme
    return "/logo/KorinAILogo-Black.svg";
  }, [theme, resolvedTheme, mounted]);

  return (
    <div className={cn("relative flex items-center gap-2", className)}>
      <Image
        src={logoSrc}
        alt="KorinAI Logo"
        width={size}
        height={size}
        className={cn(
          "object-contain transition-opacity duration-300",
          !mounted && "opacity-0"
        )}
        priority
      />
      {withText && mounted && (
        <span className={cn("font-semibold", textClassName)}>KorinAI Desk</span>
      )}
    </div>
  );
}

// Alternate version that uses the logo context
export function KorinAILogoWithContext({
  className,
  size = 32,
  withText = false,
  textClassName,
}: KorinAILogoProps) {
  const { logoPath } = useLogo();
  const [mounted, setMounted] = React.useState(false);

  // After mounting, allow client-side theme detection to work
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={cn("relative flex items-center gap-2", className)}>
      <Image
        src={logoPath}
        alt="KorinAI Logo"
        width={size}
        height={size}
        className={cn(
          "object-contain transition-opacity duration-300",
          !mounted && "opacity-0"
        )}
        priority
      />
      {withText && mounted && (
        <span className={cn("font-semibold", textClassName)}>KorinAI Desk</span>
      )}
    </div>
  );
}
