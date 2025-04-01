"use client";

import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export function Header({ title = "KorinAI Desk" }: { title?: string }) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo/KorinAILogo-Black.png"
              alt="KorinAI Logo"
              className="h-7 w-7 dark:invert"
            />
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4"
            />
            <h1 className="text-base font-medium">{title}</h1>
          </Link>
        </div>
        <div className="flex items-center gap-2 px-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
