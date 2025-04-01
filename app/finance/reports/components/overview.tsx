"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, DollarSign, BarChart3, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFinancialOverview } from "@/hooks/useFinancialOverview";
import useCurrency from "@/hooks/useCurrency";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface OverviewProps {
  period: string;
}

export function Overview({ period }: OverviewProps) {
  // Fetch data from the financial overview hook
  const {
    data: overview,
    isLoading,
    isError,
  } = useFinancialOverview({ period });

  // Get currency formatting utilities
  const { formatAmount, currency } = useCurrency();

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
          <CardDescription>Loading dashboard data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              Generating your financial overview
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError || !overview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
          <CardDescription>Could not load dashboard data</CardDescription>
        </CardHeader>
        <CardContent className="text-destructive text-center p-8">
          There was an error loading your financial overview. Please try again
          later.
        </CardContent>
      </Card>
    );
  }

  const { financialHealth, incomeMetrics, spendingMetrics, timeSeries } =
    overview;

  // Format chart data
  const chartData = timeSeries.labels.map((label, index) => ({
    name: formatChartLabel(label),
    Income: timeSeries.income[index],
    Expenses: timeSeries.expenses[index],
  }));

  return (
    <div className="space-y-6">
      {/* Financial Health Score Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Financial Health Dashboard</CardTitle>
            <CardDescription>
              Summary for {overview.period.label}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Health Score */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="md:col-span-1 flex flex-col items-center p-4 border rounded-lg h-full justify-between">
              <p className="text-xs text-muted-foreground">Health Score</p>
              <div
                className={`text-4xl font-bold text-center my-auto py-2 ${getHealthScoreColor(
                  financialHealth.score
                )}`}
              >
                {financialHealth.score === -1 ? "--" : financialHealth.score}
                {financialHealth.score !== -1 && (
                  <span className="text-lg font-normal">/100</span>
                )}
              </div>
              <div className="text-xs text-center text-muted-foreground">
                {financialHealth.description}
              </div>
            </div>

            <div className="md:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-4 border rounded-lg h-full justify-between">
                <p className="text-xs text-muted-foreground">Net Cash Flow</p>
                <p className="text-3xl font-semibold text-center my-auto py-2">
                  {formatAmount(Math.abs(financialHealth.netIncome))}
                </p>
                <div>
                  <Badge
                    className={
                      financialHealth.netIncome >= 0
                        ? "bg-green-100 hover:bg-green-100/80 text-green-700 dark:bg-green-800/30 dark:text-green-400"
                        : "bg-red-100 hover:bg-red-100/80 text-red-700 dark:bg-red-800/30 dark:text-red-400"
                    }
                  >
                    {financialHealth.netIncome >= 0 ? "Surplus" : "Deficit"}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col items-center p-4 border rounded-lg h-full justify-between">
                <p className="text-xs text-muted-foreground">Savings Rate</p>
                <p className="text-3xl font-semibold text-center my-auto py-2">
                  {financialHealth.savingsRate.toFixed(1)}%
                </p>
                <div>
                  <Badge
                    className={
                      financialHealth.savingsRate >= 20
                        ? "bg-green-100 hover:bg-green-100/80 text-green-700 dark:bg-green-800/30 dark:text-green-400"
                        : financialHealth.savingsRate >= 10
                        ? "bg-amber-100 hover:bg-amber-100/80 text-amber-700 dark:bg-amber-800/30 dark:text-amber-400"
                        : "bg-red-100 hover:bg-red-100/80 text-red-700 dark:bg-red-800/30 dark:text-red-400"
                    }
                  >
                    {financialHealth.savingsRate >= 20
                      ? "Excellent"
                      : financialHealth.savingsRate >= 10
                      ? "Good"
                      : "Low"}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col items-center p-4 border rounded-lg h-full justify-between">
                <p className="text-xs text-muted-foreground">Expense Ratio</p>
                <p className="text-3xl font-semibold text-center my-auto py-2">
                  {financialHealth.expenseToIncomeRatio.toFixed(1)}%
                </p>
                <div>
                  <Badge
                    className={
                      financialHealth.expenseToIncomeRatio <= 70
                        ? "bg-green-100 hover:bg-green-100/80 text-green-700 dark:bg-green-800/30 dark:text-green-400"
                        : financialHealth.expenseToIncomeRatio <= 90
                        ? "bg-amber-100 hover:bg-amber-100/80 text-amber-700 dark:bg-amber-800/30 dark:text-amber-400"
                        : "bg-red-100 hover:bg-red-100/80 text-red-700 dark:bg-red-800/30 dark:text-red-400"
                    }
                  >
                    {financialHealth.expenseToIncomeRatio <= 70
                      ? "Low"
                      : financialHealth.expenseToIncomeRatio <= 90
                      ? "Moderate"
                      : "High"}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col items-center p-4 border rounded-lg h-full justify-between">
                <p className="text-xs text-muted-foreground">Monthly Change</p>
                <p className="text-3xl font-semibold text-center my-auto py-2">
                  {Math.abs(financialHealth.monthlyChange).toFixed(1)}%
                </p>
                <div>
                  <Badge
                    className={
                      financialHealth.budgetStatus === "On track"
                        ? "bg-green-100 hover:bg-green-100/80 text-green-700 dark:bg-green-800/30 dark:text-green-400"
                        : "bg-red-100 hover:bg-red-100/80 text-red-700 dark:bg-red-800/30 dark:text-red-400"
                    }
                  >
                    {financialHealth.budgetStatus}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unique Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Income Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-500" />
              Income Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Income</p>
                <p className="text-2xl font-semibold">
                  {formatAmount(incomeMetrics.totalIncome)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Income/Expense Ratio
                  </p>
                  <p className="text-lg font-medium">
                    {incomeMetrics.incomeToExpenseRatio.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Disposable Income
                  </p>
                  <p className="text-lg font-medium">
                    {formatAmount(incomeMetrics.disposableIncome)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Income Sources
                  </p>
                  <p className="text-lg font-medium">
                    {incomeMetrics.incomeSources}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Primary Source
                  </p>
                  <p className="text-lg font-medium">
                    {incomeMetrics.primarySourcePercentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spending Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <TrendingDown className="h-5 w-5 mr-2 text-blue-500" />
              Spending Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-semibold">
                  {formatAmount(spendingMetrics.totalExpenses)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Daily Average</p>
                  <p className="text-lg font-medium">
                    {formatAmount(spendingMetrics.dailyAverage)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Spending Volatility
                  </p>
                  <p className="text-lg font-medium">
                    {spendingMetrics.volatility.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Top Category</p>
                  <p className="text-lg font-medium">
                    {spendingMetrics.topCategory.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">% of Spending</p>
                  <p className="text-lg font-medium">
                    {spendingMetrics.topCategory.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Income vs Expenses Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
              Income vs Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `${currency.symbol}${value}`}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatAmount(value as number),
                      undefined,
                    ]}
                    labelFormatter={(label) => `Period: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Income"
                    stroke="#16a34a"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="Expenses"
                    stroke="#ef4444"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to get color based on health score
function getHealthScoreColor(score: number): string {
  if (score === -1) return "text-gray-500"; // No data score
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

// Helper function to format chart labels based on period
function formatChartLabel(label: string): string {
  // For daily format (YYYY-MM-DD)
  if (label.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const date = new Date(label);
    return date.getDate().toString(); // Just return the day number
  }

  // For weekly format (YYYY-MM-WXX)
  if (label.match(/^\d{4}-\d{2}-W\d+$/)) {
    const weekNum = label.split("-W")[1];
    return `W${weekNum}`;
  }

  // For monthly format (YYYY-MM)
  if (label.match(/^\d{4}-\d{2}$/)) {
    const date = new Date(label + "-01");
    return date.toLocaleString("default", { month: "short" });
  }

  return label;
}
