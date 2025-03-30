"use client";

import { useState } from "react";
import { H1, P } from "@/components/ui/typography";
import { BarChart, PieChart, LineChart, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IncomeStatement } from "./components/income-statement";
import { Accounts } from "./components/accounts";
import { Overview } from "./components/overview";
import { CategoriesAnalysis } from "./components/categories-analysis";

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("this-month");
  const [selectedTab, setSelectedTab] = useState("overview");

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <H1 className="text-2xl md:text-3xl">Reports</H1>
          <P className="text-muted-foreground text-sm md:text-base">
            Analyze your financial data and track your progress
          </P>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <Select
            defaultValue={selectedPeriod}
            onValueChange={setSelectedPeriod}
          >
            <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm h-9">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="year-to-date">Year to Date</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
              <SelectItem value="custom">Custom Period</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <div className="overflow-x-auto pb-2">
          <TabsList className="flex w-auto h-auto min-w-0 sm:w-full sm:grid sm:grid-cols-4 mb-6 sm:mb-8 text-xs sm:text-sm">
            <TabsTrigger
              value="overview"
              className="flex-shrink-0 flex items-center gap-1 sm:gap-2 px-3 sm:px-6"
            >
              <BarChart className="h-3 w-3 sm:h-4 sm:w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="income-statement"
              className="flex-shrink-0 flex items-center gap-1 sm:gap-2 px-3 sm:px-6"
            >
              <LineChart className="h-3 w-3 sm:h-4 sm:w-4" />
              Income Statement
            </TabsTrigger>
            <TabsTrigger
              value="accounts"
              className="flex-shrink-0 flex items-center gap-1 sm:gap-2 px-3 sm:px-6"
            >
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
              Accounts
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="flex-shrink-0 flex items-center gap-1 sm:gap-2 px-3 sm:px-6"
            >
              <PieChart className="h-3 w-3 sm:h-4 sm:w-4" />
              Categories
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab Content */}
        <TabsContent value="overview" className="mt-0">
          <Overview period={selectedPeriod} />
        </TabsContent>

        {/* Income Statement Tab Content */}
        <TabsContent value="income-statement" className="mt-0">
          <IncomeStatement period={selectedPeriod} />
        </TabsContent>

        {/* Accounts Tab Content */}
        <TabsContent value="accounts" className="mt-0">
          <Accounts period={selectedPeriod} />
        </TabsContent>

        {/* Categories Tab Content */}
        <TabsContent value="categories" className="mt-0">
          <CategoriesAnalysis period={selectedPeriod} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
