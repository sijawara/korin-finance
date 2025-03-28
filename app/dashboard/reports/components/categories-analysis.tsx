"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  Loader2,
  PieChart,
  BarChart3,
  DollarSign,
  TrendingDown,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategoriesReport } from "@/hooks/useCategoriesReport";
import useCurrency from "@/hooks/useCurrency";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface CategoriesAnalysisProps {
  period: string;
}

export function CategoriesAnalysis({ period }: CategoriesAnalysisProps) {
  const [categoryType, setCategoryType] = useState<"income" | "expense">(
    "expense"
  );

  // Fetch data from our categories report API
  const { categoriesData, isLoading, isError } = useCategoriesReport({
    period,
  });

  // Get currency formatting utilities
  const { formatAmount, currency } = useCurrency();

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories Analysis</CardTitle>
          <CardDescription>Loading categories data...</CardDescription>
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

  // Error state
  if (isError || !categoriesData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories Analysis</CardTitle>
          <CardDescription>Could not load categories data</CardDescription>
        </CardHeader>
        <CardContent className="text-destructive text-center p-8">
          There was an error loading your category analysis. Please try again
          later.
        </CardContent>
      </Card>
    );
  }

  // Get the appropriate categories data based on the selected type
  const categories =
    categoryType === "income"
      ? categoriesData.incomeCategories
      : categoriesData.expenseCategories;

  // Set color palette for charts
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#a855f7",
    "#ec4899",
    "#14b8a6",
    "#8b5cf6",
    "#f43f5e",
    "#84cc16",
  ];

  // Format for pie chart
  const pieData = categories.map((item) => ({
    name: item.name,
    value: item.amount,
  }));

  // Format for bar chart
  const barData = [...categories].sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Categories Analysis</CardTitle>
            <CardDescription>
              Breakdown for {categoriesData.period.label}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="expense"
            value={categoryType}
            onValueChange={(value) =>
              setCategoryType(value as "income" | "expense")
            }
            className="w-full mb-6"
          >
            <TabsList className="grid grid-cols-2 w-[400px] mx-auto mb-6">
              <TabsTrigger value="expense" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Expense Categories
              </TabsTrigger>
              <TabsTrigger value="income" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Income Sources
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pie Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-blue-500" />
                  {categoryType === "income"
                    ? "Income Sources"
                    : "Expense Categories"}
                </CardTitle>
                <CardDescription>Distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(1)}%`
                        }
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [
                          formatAmount(value),
                          "Amount",
                        ]}
                      />
                      <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
                  {categoryType === "income"
                    ? "Income Sources Ranking"
                    : "Top Expense Categories"}
                </CardTitle>
                <CardDescription>Ranked by amount</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={true}
                        vertical={false}
                      />
                      <XAxis
                        type="number"
                        tickFormatter={(value) => `${currency.symbol}${value}`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={80}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          formatAmount(value),
                          "Amount",
                        ]}
                        labelFormatter={(label) => `Category: ${label}`}
                      />
                      <Bar
                        dataKey="amount"
                        fill={categoryType === "income" ? "#16a34a" : "#ef4444"}
                        background={{ fill: "#eee" }}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">
                Total {categoryType === "income" ? "Income" : "Expenses"}
              </p>
              <p className="text-2xl font-semibold">
                {formatAmount(
                  categoryType === "income"
                    ? categoriesData.summary.totalIncome
                    : categoriesData.summary.totalExpenses
                )}
              </p>
            </Card>

            <Card className="p-4">
              <p className="text-sm text-muted-foreground">
                Number of Categories
              </p>
              <p className="text-2xl font-semibold">
                {categoryType === "income"
                  ? categoriesData.summary.incomeCategoriesCount
                  : categoriesData.summary.expenseCategoriesCount}
              </p>
            </Card>

            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Top Category</p>
              <p className="text-2xl font-semibold">
                {categoryType === "income"
                  ? categoriesData.summary.topIncomeCategory
                  : categoriesData.summary.topExpenseCategory}
              </p>
            </Card>

            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Top Category %</p>
              <p className="text-2xl font-semibold">
                {(categoryType === "income"
                  ? categoriesData.summary.topIncomePercentage
                  : categoriesData.summary.topExpensePercentage
                ).toFixed(1)}
                %
              </p>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
