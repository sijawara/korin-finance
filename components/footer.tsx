"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="flex h-auto min-h-[80px] shrink-0 items-center border-t transition-[width,height] ease-linear bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between py-4 gap-4">
          <div className="md:flex md:items-center">
            <span className="text-sm block mb-1 md:mb-0">
              PT Sinergi Rajawali Mataram
            </span>

            <div className="hidden md:flex md:items-center">
              <div className="mx-2 h-4 w-[1px] bg-border"></div>
              <span className="text-xs text-muted-foreground">
                Yogyakarta, Indonesia
              </span>
            </div>

            <span className="block md:hidden text-xs text-muted-foreground">
              Yogyakarta, Indonesia
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-2 md:mt-0">
            <Link
              href="mailto:hi@korinai.com"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              hi@korinai.com
            </Link>
            <span className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} KorinAI
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
