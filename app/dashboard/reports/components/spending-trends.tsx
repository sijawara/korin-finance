"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Loader2,
  BarChart,
} from "lucide-react";
import { useSpendingTrends } from "@/hooks/useSpendingTrends";
import useCurrency from "@/hooks/useCurrency";
import { Badge } from "@/components/ui/badge";

interface SpendingTrendsProps {
  period: string;
}

export function SpendingTrends({ period }: SpendingTrendsProps) {
  // Use the hook to fetch spending trends data
  const { spendingTrends, isLoading, isError } = useSpendingTrends(period);

  // Get currency formatting utilities
  const { formatAmount } = useCurrency();

  // Show loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending Trends</CardTitle>
          <CardDescription>Loading spending data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              Analyzing your spending patterns
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (isError || !spendingTrends) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending Trends</CardTitle>
          <CardDescription>Could not load spending data</CardDescription>
        </CardHeader>
        <CardContent className="text-destructive text-center p-8">
          There was an error loading your spending trends. Please try again
          later.
        </CardContent>
      </Card>
    );
  }

  const { timeSeries, topCategories, insights, totals, periodLabel } =
    spendingTrends;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Spending Trends</CardTitle>
            <CardDescription>Analysis for {periodLabel}</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Total Expenses
              </p>
              <p className="text-2xl font-bold text-red-600">
                {formatAmount(totals.totalExpenses)}
              </p>
              <div className="flex items-center mt-2">
                {insights.changeFromPrevious > 0 ? (
                  <Badge
                    variant="destructive"
                    className="flex items-center text-xs"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />+
                    {insights.changeFromPrevious}% from previous
                  </Badge>
                ) : (
                  <Badge
                    variant="default"
                    className="flex items-center text-xs"
                  >
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {insights.changeFromPrevious}% from previous
                  </Badge>
                )}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Income</p>
              <p className="text-2xl font-bold text-green-600">
                {formatAmount(totals.totalIncome)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Net savings: {formatAmount(totals.netSavings)}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Savings Rate</p>
              <p className="text-2xl font-bold">{totals.savingsRate}%</p>
              <p className="text-xs text-muted-foreground mt-2">
                of your income saved
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Monthly Average
              </p>
              <p className="text-2xl font-bold">
                {formatAmount(Math.round(insights.averageMonthlySpending))}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                average monthly expenses
              </p>
            </div>
          </div>

          {/* Spending Chart Placeholder - In a real app, this would be a chart showing the time series data */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Spending Over Time</h3>
            <div className="h-[300px] bg-muted/20 rounded-md flex items-center justify-center">
              <div className="text-center">
                <BarChart className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Spending chart visualization would go here (using timeSeries
                  data)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Time periods: {timeSeries.labels.length}, Highest expense:
                  {formatAmount(Math.max(...timeSeries.expenses))}
                </p>
              </div>
            </div>
          </div>

          {/* Insights Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Spending Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm font-medium">Top Spending Category</p>
                <p className="text-xl">{insights.fastestGrowingCategory}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your biggest expense area
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm font-medium">Highest Spending Month</p>
                <p className="text-xl">{insights.monthWithHighestSpending}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Month with the most expenses
                </p>
              </div>
            </div>
          </div>

          {/* Top Categories Table */}
          <div>
            <h3 className="text-lg font-medium mb-4">
              Top Spending Categories
            </h3>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>% of Total</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCategories.map((category, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell>{formatAmount(category.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {Math.round(category.percentage)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {category.transactions}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
