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
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useAccounts } from "../../../../hooks/useAccounts";
import useCurrency from "../../../../hooks/useCurrency";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import Transaction type from the hook
import type { Transaction } from "../../../../hooks/useAccounts";

interface AccountsProps {
  period: string;
}

export function Accounts({ period }: AccountsProps) {
  // Use a hook to fetch accounts data
  const { accountsData, isLoading, isError } = useAccounts(period);

  // Get currency formatting utilities
  const { formatAmount } = useCurrency();

  // Show loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accounts Receivable & Payable</CardTitle>
          <CardDescription>Loading accounts data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              Analyzing your accounts data
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (isError || !accountsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accounts Receivable & Payable</CardTitle>
          <CardDescription>Could not load accounts data</CardDescription>
        </CardHeader>
        <CardContent className="text-destructive text-center p-8">
          There was an error loading your accounts data. Please try again later.
        </CardContent>
      </Card>
    );
  }

  const { receivable, payable, periodLabel } = accountsData || {};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Accounts Receivable & Payable</CardTitle>
            <CardDescription>Analysis for {periodLabel || 'N/A'}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Total Receivable
              </p>
              <p className="text-2xl font-bold text-green-600">
                {formatAmount(receivable?.total || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {receivable?.count || 0} unpaid invoices
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Total Payable
              </p>
              <p className="text-2xl font-bold text-red-600">
                {formatAmount(payable?.total || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {payable?.count || 0} unpaid bills
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Overdue Receivable
              </p>
              <p className="text-2xl font-bold text-amber-600">
                {formatAmount(receivable?.overdue || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {receivable?.overdueCount || 0} overdue invoices
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Overdue Payable
              </p>
              <p className="text-2xl font-bold text-amber-600">
                {formatAmount(payable?.overdue || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {payable?.overdueCount || 0} overdue bills
              </p>
            </div>
          </div>

          {/* Tabs for Receivable and Payable */}
          <Tabs defaultValue="receivable" className="mt-6">
            <TabsList>
              <TabsTrigger value="receivable">Accounts Receivable</TabsTrigger>
              <TabsTrigger value="payable">Accounts Payable</TabsTrigger>
            </TabsList>

            {/* Accounts Receivable Tab Content */}
            <TabsContent value="receivable" className="mt-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <h3 className="text-lg font-medium">Unpaid Invoices</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Paid: {formatAmount(receivable?.paid || 0)}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-yellow-600 dark:text-yellow-400"
                  >
                    Unpaid: {formatAmount(receivable?.unpaid || 0)}
                  </Badge>
                </div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Days</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(receivable?.transactions || []).map(
                      (transaction: Transaction, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {transaction.description}
                          </TableCell>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>
                            {formatAmount(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            {transaction.status === "PAID" ? (
                              <Badge className="bg-green-50 text-green-700 border-green-200">
                                <Check className="h-3 w-3 mr-1" />
                                Paid
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="text-yellow-600 dark:text-yellow-400"
                              >
                                Unpaid
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{transaction.dueDate}</TableCell>
                          <TableCell className="text-right">
                            {transaction.daysOverdue > 0 ? (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {transaction.daysOverdue} days overdue
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">
                                {Math.abs(transaction.daysOverdue)} days left
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Accounts Payable Tab Content */}
            <TabsContent value="payable" className="mt-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <h3 className="text-lg font-medium">Unpaid Bills</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Paid: {formatAmount(payable?.paid || 0)}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-yellow-600 dark:text-yellow-400"
                  >
                    Unpaid: {formatAmount(payable?.unpaid || 0)}
                  </Badge>
                </div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Days</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(payable?.transactions || []).map(
                      (transaction: Transaction, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {transaction.description}
                          </TableCell>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>
                            {formatAmount(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            {transaction.status === "PAID" ? (
                              <Badge className="bg-green-50 text-green-700 border-green-200">
                                <Check className="h-3 w-3 mr-1" />
                                Paid
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="text-yellow-600 dark:text-yellow-400"
                              >
                                Unpaid
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{transaction.dueDate}</TableCell>
                          <TableCell className="text-right">
                            {transaction.daysOverdue > 0 ? (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {transaction.daysOverdue} days overdue
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">
                                {Math.abs(transaction.daysOverdue)} days left
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
