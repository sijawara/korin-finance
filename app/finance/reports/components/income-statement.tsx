"use client";

import React, { useState } from "react";
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
import { Plus, Minus, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useIncomeStatement } from "@/hooks/useIncomeStatement";
import useCurrency from "@/hooks/useCurrency";

interface IncomeStatementProps {
  period: string;
}

export function IncomeStatement({ period }: IncomeStatementProps) {
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  // Use the hook to fetch income statement data
  const { incomeStatement, isLoading, isError } = useIncomeStatement(period);

  // Get currency formatting utilities
  const { formatAmount } = useCurrency();

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Group expenses by category if we have data
  const groupedExpenses =
    incomeStatement?.expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = [];
      }
      acc[expense.category].push(expense);
      return acc;
    }, {} as Record<string, typeof incomeStatement.expenses>) || {};

  // Calculate category totals
  const categoryTotals = Object.keys(groupedExpenses).map((category) => {
    const total = groupedExpenses[category].reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const percentage = incomeStatement?.totals.totalExpenses
      ? Math.round((total / incomeStatement.totals.totalExpenses) * 100)
      : 0;
    return { category, total, percentage };
  });

  // Show loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Income Statement</CardTitle>
          <CardDescription>Loading financial data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              Calculating your financial statement
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (isError || !incomeStatement) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Income Statement</CardTitle>
          <CardDescription>Could not load financial data</CardDescription>
        </CardHeader>
        <CardContent className="text-destructive text-center p-8">
          There was an error loading your financial statement. Please try again
          later.
        </CardContent>
      </Card>
    );
  }

  const { totalIncome, totalExpenses, netIncome, savingsRate } =
    incomeStatement.totals;

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <CardTitle>Income Statement</CardTitle>
          <CardDescription>
            Financial summary for {incomeStatement.periodLabel}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-medium text-base" colSpan={2}>
                  Income Statement
                </TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Income Section */}
              <TableRow className="bg-muted/30">
                <TableCell colSpan={2} className="font-semibold">
                  <div className="flex items-center text-green-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Income
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatAmount(totalIncome)}
                </TableCell>
                <TableCell className="text-right font-semibold">100%</TableCell>
              </TableRow>

              {/* Income Items */}
              {incomeStatement.income.map((item, index) => (
                <TableRow key={index} className="border-t-0">
                  <TableCell className="w-8"></TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatAmount(item.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.percentage}%
                  </TableCell>
                </TableRow>
              ))}

              {/* Expenses Section */}
              <TableRow className="bg-muted/30">
                <TableCell colSpan={2} className="font-semibold">
                  <div className="flex items-center text-red-600">
                    <Minus className="h-4 w-4 mr-2" />
                    Expenses
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatAmount(totalExpenses)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {totalIncome > 0
                    ? `${Math.round((totalExpenses / totalIncome) * 100)}%`
                    : "N/A"}
                </TableCell>
              </TableRow>

              {/* Category Groups */}
              {categoryTotals.map((category, index) => (
                <React.Fragment key={index}>
                  <TableRow
                    onClick={() => toggleCategory(category.category)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="py-2">
                      {expandedCategories[category.category] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium py-2">
                      {category.category}
                    </TableCell>
                    <TableCell className="text-right py-2 text-red-600">
                      {formatAmount(category.total)}
                    </TableCell>
                    <TableCell className="text-right py-2">
                      {category.percentage}%
                    </TableCell>
                  </TableRow>

                  {/* Subcategories (only shown when category is expanded) */}
                  {expandedCategories[category.category] &&
                    groupedExpenses[category.category].map(
                      (expense, subIndex) => (
                        <TableRow
                          key={`${index}-${subIndex}`}
                          className="border-t-0 bg-muted/10"
                        >
                          <TableCell></TableCell>
                          <TableCell className="pl-8 py-1 text-sm">
                            {expense.subcategory}
                            {expense.isDirectParentEntry && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (Direct)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-1 text-sm text-red-600">
                            {formatAmount(expense.amount)}
                          </TableCell>
                          <TableCell className="text-right py-1 text-sm">
                            {expense.percentage}%
                          </TableCell>
                        </TableRow>
                      )
                    )}
                </React.Fragment>
              ))}

              {/* Net Income */}
              <TableRow className="border-t-2 border-border bg-muted/40">
                <TableCell colSpan={2} className="font-bold text-base">
                  Net Income
                </TableCell>
                <TableCell
                  className={`text-right font-bold text-base ${
                    netIncome >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatAmount(netIncome)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {totalIncome > 0 ? (
                    <span
                      className={
                        savingsRate >= 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      {savingsRate}%
                    </span>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
