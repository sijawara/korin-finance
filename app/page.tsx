import { H1, P } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[1fr] items-center justify-items-center min-h-[calc(100vh-120px)] p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] items-center max-w-2xl">
        <div className="text-center space-y-6 md:space-y-8">
          <H1 className="text-3xl md:text-4xl lg:text-5xl">
            Track Money Like You Talk
          </H1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 w-full max-w-md mx-auto">
            <div className="flex items-center gap-2 text-base md:text-lg justify-center md:justify-start">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
              <span>Natural Input</span>
            </div>
            <div className="flex items-center gap-2 text-base md:text-lg justify-center md:justify-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
              <span>Smart Analysis</span>
            </div>
            <div className="flex items-center gap-2 text-base md:text-lg justify-center md:justify-start">
              <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />
              <span>Reporting</span>
            </div>
          </div>

          <P className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto">
            Just type &ldquo;Groceries at Walmart $75.30&rdquo; and we&apos;ll
            handle the rest. Track your daily expenses, monitor your budget, and
            reach your savings goals effortlessly.
          </P>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row mt-4">
          <Button asChild size="lg">
            <Link href="/finance">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link
              href="https://korinai.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
            >
              Browse Another AI
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
