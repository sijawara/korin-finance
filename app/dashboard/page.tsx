"use client";

import { H1, P } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, ArrowUp, ArrowDown } from "lucide-react";
import { useTransactionSummary } from "@/hooks/useTransactionSummary";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useFinancialOverview } from "@/hooks/useFinancialOverview";
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
import { useTransactions } from "@/hooks/useTransactions";
import { formatDistanceToNow } from "date-fns";
import useCurrency from "@/hooks/useCurrency";

export default function DashboardPage() {
  // Fetch transaction summary data from API
  const { summaryData, isLoading, isError } = useTransactionSummary();

  // Fetch recent transactions
  const { transactions, isLoading: transactionsLoading } = useTransactions();

  // Get currency formatting utilities
  const { formatAmount, currency } = useCurrency();

  // Get just the 3 most recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // Fetch financial overview data for the chart
  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
  } = useFinancialOverview({ period: "this-month" });

  // Calculate savings rate if data is available
  const savingsRate = summaryData
    ? Math.round((summaryData.net_balance / summaryData.total_income) * 100)
    : 0;

  // Format chart data if available
  const chartData =
    overview?.timeSeries?.labels.map((label, index) => ({
      name: formatChartLabel(label),
      Income: overview.timeSeries.income[index],
      Expenses: overview.timeSeries.expenses[index],
    })) || [];

  // Helper to format the relative date
  const formatRelativeDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Unknown date";
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <H1 className="text-2xl md:text-3xl">Dashboard</H1>
          <P className="text-muted-foreground text-sm md:text-base">
            Welcome back! Here&apos;s an overview of your finances.
          </P>
        </div>
        <div className="flex items-center">
          <Button size="sm" className="w-full sm:w-auto">
            <Plus className="mr-2 h-3 w-3 md:h-4 md:w-4" />
            <Link href="/dashboard/transactions">Add Transaction</Link>
          </Button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Summary Cards */}
        <div className="p-4 md:p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className="text-sm md:text-base font-medium mb-1 md:mb-2">
            Total Balance
          </h3>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : isError ? (
            <p className="text-xl md:text-2xl font-bold text-destructive">
              Error loading data
            </p>
          ) : (
            <p className="text-xl md:text-2xl font-bold">
              {summaryData
                ? formatAmount(summaryData.net_balance)
                : formatAmount(0)}
            </p>
          )}
        </div>
        <div className="p-4 md:p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className="text-sm md:text-base font-medium mb-1 md:mb-2">
            Monthly Spending
          </h3>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : isError ? (
            <p className="text-xl md:text-2xl font-bold text-destructive">
              Error loading data
            </p>
          ) : (
            <p className="text-xl md:text-2xl font-bold text-red-500">
              {summaryData
                ? formatAmount(summaryData.total_expenses)
                : formatAmount(0)}
            </p>
          )}
        </div>
        <div className="p-4 md:p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className="text-sm md:text-base font-medium mb-1 md:mb-2">
            Savings Rate
          </h3>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : isError ? (
            <p className="text-xl md:text-2xl font-bold text-destructive">
              Error loading data
            </p>
          ) : (
            <p className="text-xl md:text-2xl font-bold">
              {isNaN(savingsRate) ? "0" : savingsRate}%
            </p>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-6 md:mt-8">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl font-semibold">
            Recent Transactions
          </h2>
          <Link
            href="/dashboard/transactions"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="rounded-lg border bg-card">
          {transactionsLoading ? (
            <div className="p-8 flex justify-center items-center">
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <p>No recent transactions</p>
              <Button size="sm" variant="outline" asChild className="mt-3">
                <Link href="/dashboard/transactions">
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first transaction
                </Link>
              </Button>
            </div>
          ) : (
            recentTransactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className={`p-3 md:p-4 ${
                  index !== recentTransactions.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                        transaction.amount >= 0
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {transaction.amount >= 0 ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm md:text-base font-medium">
                        {transaction.description}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {formatRelativeDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-sm md:text-base ${
                      transaction.amount >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {transaction.amount >= 0 ? "+" : ""}
                    {formatAmount(Math.abs(transaction.amount))}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Financial Insights Card */}
      <div className="mt-6 md:mt-8">
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">
          Financial Insights
        </h2>
        <div className="rounded-lg border bg-card p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="md:w-1/2">
              <h3 className="text-base md:text-lg font-medium mb-2 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
                Income vs Expenses
              </h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4">
                Track your income and expenses over time, see spending by
                category, and analyze your financial trends.
              </p>
              <Button
                size="sm"
                className="w-full sm:w-auto md:size-default"
                asChild
              >
                <Link href="/dashboard/reports">View Reports</Link>
              </Button>
            </div>
            <div className="md:w-1/2 h-[180px]">
              {overviewLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full rounded-md" />
                </div>
              ) : overviewError || !overview?.timeSeries ? (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <p className="text-sm">No chart data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
