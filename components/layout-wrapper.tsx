"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Footer } from "./footer";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't show header and footer in finance section
  const isFinanceSection = pathname && pathname.startsWith("/finance");

  if (isFinanceSection) {
    // In finance section, just render the children without header/footer
    return <>{children}</>;
  }

  // In other sections, render with header and footer
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
