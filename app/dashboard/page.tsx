"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard/reports");
  }, [router]);

  // Show a loading skeleton while redirecting
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg mt-4" />
      </div>
    </div>
  );
}
