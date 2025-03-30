import { ThemeToggle } from "../components/theme-toggle";
import { H1, P } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <main className="flex flex-col gap-[32px] row-start-2 items-center max-w-2xl">
        <div className="text-center space-y-8">
          <H1>Track Money Like You Talk</H1>
          <div className="flex gap-6 flex-col md:flex-row md:items-center justify-center text-lg">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Natural Input
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Smart Analysis
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              Reporting
            </span>
          </div>
          <P className="text-muted-foreground text-lg max-w-lg mx-auto">
            Just type &ldquo;Groceries at Walmart $75.30&rdquo; and we&apos;ll
            handle the rest. Track your daily expenses, monitor your budget, and
            reach your savings goals effortlessly.
          </P>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row mt-4">
          <Button asChild size="lg">
            <Link href="/auth">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/finance">Demo Dashboard</Link>
          </Button>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-sm text-muted-foreground">
        <a className="hover:text-foreground transition-colors" href="#">
          Docs
        </a>
        <a className="hover:text-foreground transition-colors" href="#">
          Features
        </a>
        <a className="hover:text-foreground transition-colors" href="#">
          Support
        </a>
      </footer>
    </div>
  );
}
