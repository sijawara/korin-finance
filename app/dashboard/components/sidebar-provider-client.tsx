"use client";

import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { KorinAILogo } from "./KorinAILogo";

interface SidebarProviderClientProps {
  defaultOpen?: boolean;
  children: React.ReactNode;
  logoSize?: number;
}

export function SidebarProviderClient({
  defaultOpen = true,
  children,
  logoSize = 32,
}: SidebarProviderClientProps) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          "--logo-size": `${logoSize}px`,
        } as React.CSSProperties
      }
    >
      {children}
    </SidebarProvider>
  );
}

// Export the KorinAILogo component for use in other components
export { KorinAILogo };
