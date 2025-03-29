"use client";

import { useState, useEffect } from "react";
import { H1, P } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AddTransactionDialog } from "./components/add-transaction-dialog";
import { TransactionDetailsDialog } from "./components/transaction-details-dialog";
// Import hooks from hooks
import { useTransactions, UiTransaction } from "@/hooks/useTransactions";
import { useCategories, UiCategory } from "@/hooks/useCategories";
import useCurrency from "@/hooks/useCurrency";

// Type definition for what TransactionDetailsDialog expects
type DialogCategory = {
  id: string;
  name: string;
  type: "income" | "expense";
  color?: string;
  icon?: string;
  description?: string;
  usage_count: number;
  parent_id?: string;
  is_parent: boolean;
};

export default function TransactionsPage() {
  const [selectedTransaction, setSelectedTransaction] =
    useState<UiTransaction | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Use hooks instead of direct API calls with pagination
  const {
    transactions,
    isLoading: transactionsLoading,
    updateTransaction,
    deleteTransaction,
    addTransaction,
    totalIncome,
    totalExpenses,
    netBalance,
    transactionCount,
    // Pagination related properties and functions
    pagination,
    pageSize,
    goToPage,
    nextPage,
    previousPage,
    changePageSize,
    // Filters
    filters,
    applyFilters,
    resetFilters,
  } = useTransactions();

  const { categories, isLoading: categoriesLoading } = useCategories();
  const { formatAmount } = useCurrency();

  // Map UiCategory to DialogCategory for compatibility with TransactionDetailsDialog
  const mapCategoriesToDialogFormat = (
    categories: UiCategory[]
  ): DialogCategory[] => {
    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      color: cat.color,
      icon: cat.icon,
      description: cat.description,
      usage_count: cat.usageCount,
      parent_id: cat.parentId,
      is_parent: cat.isParent,
    }));
  };

  // Handle search input with debounce
  useEffect(() => {
    // Set a timer to update the debounced value after 500ms
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      if (searchQuery !== debouncedSearchQuery) {
        applyFilters({ search: searchQuery.trim() || null });
      }
    }, 500);

    // Clear timeout if the search query changes before the timer expires
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update the search handler to just update the state
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle category filter changes
  const handleCategoryChange = (value: string) => {
    applyFilters({ category: value === "all" ? null : value });
  };

  // Handle date range filter changes
  const handleDateRangeChange = (value: string) => {
    applyFilters({ dateRange: value === "all" ? null : value });
  };

  // Handle status filter changes
  const handleStatusChange = (value: string) => {
    applyFilters({ status: value === "all" ? null : value });
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    resetFilters();
  };

  // Action handlers
  const handleRowClick = (transaction: UiTransaction) => {
    setSelectedTransaction(transaction);
    setDetailsOpen(true);
  };

  const handleEditTransaction = async (transaction: UiTransaction) => {
    const success = await updateTransaction(transaction);
    if (success) {
      setDetailsOpen(false);
    }
  };

  const handleDeleteTransaction = async (transaction: UiTransaction) => {
    const success = await deleteTransaction(transaction.id);
    if (success) {
      setDetailsOpen(false);
    }
  };

  // CSS classes for rendering category with its color
  const getCategoryWithColor = (categoryId: string) => {
    const category = categories.find((c: UiCategory) => c.id === categoryId);
    if (!category) return "Unknown";

    if (category.parentId) {
      const parent = categories.find(
        (c: UiCategory) => c.id === category.parentId
      );
      if (parent) {
        return (
          <div className="flex items-center gap-1 sm:gap-2">
            <div
              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-xs sm:text-sm text-muted-foreground">
              {parent.name} /{" "}
            </span>
            <span className="text-xs sm:text-sm">{category.name}</span>
          </div>
        );
      }
    }

    return (
      <div className="flex items-center gap-1 sm:gap-2">
        <div
          className="w-2 h-2 sm:w-3 sm:h-3 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        <span className="text-xs sm:text-sm">{category.name}</span>
      </div>
    );
  };

  // Show loading state when waiting for data
  const isLoading = transactionsLoading || categoriesLoading;

  // Create array of page numbers for pagination
  const getPageNumbers = () => {
    if (!pagination) return [];

    const { page, totalPages } = pagination;
    const delta = 1; // Number of pages to show on each side of current page

    // Always show first page, last page, and pages around current page
    const pages = [];

    // Add first page
    pages.push(1);

    // Add pages around current page
    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      pages.push(i);
    }

    // Add last page if more than 1 page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    // Add ellipsis indicators
    const result = [];
    let prev = 0;

    for (const p of pages) {
      if (prev + 1 !== p) {
        result.push(-prev); // Negative values represent ellipsis after this page
      }
      result.push(p);
      prev = p;
    }

    return result;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <H1 className="text-2xl md:text-3xl">Transactions</H1>
          <P className="text-muted-foreground text-sm md:text-base">
            View and manage all your financial transactions
          </P>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <AddTransactionDialog addTransaction={addTransaction} />
        </div>
      </div>

      {/* Filters - Updated with handlers */}
      <div className="flex flex-col gap-3 mb-4 sm:mb-6">
        <div className="w-full flex gap-2">
          <Input
            placeholder="Search transactions..."
            className="text-sm w-full"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <Select
            value={filters.category || "all"}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm h-9">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.dateRange || "all"}
            onValueChange={handleDateRangeChange}
          >
            <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm h-9">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.status || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
          {(filters.category ||
            filters.dateRange ||
            filters.search ||
            filters.status) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs sm:text-sm h-9"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Show active filters */}
        {(filters.category ||
          filters.dateRange ||
          filters.search ||
          filters.status) && (
          <div className="flex flex-wrap gap-2 mt-2">
            <p className="text-xs text-muted-foreground">Active filters:</p>
            {filters.category && (
              <Badge variant="outline" className="text-xs">
                Category:{" "}
                {categories.find((c) => c.id === filters.category)?.name ||
                  filters.category}
              </Badge>
            )}
            {filters.dateRange && (
              <Badge variant="outline" className="text-xs">
                Date:{" "}
                {filters.dateRange.charAt(0).toUpperCase() +
                  filters.dateRange.slice(1)}
              </Badge>
            )}
            {filters.search && (
              <Badge variant="outline" className="text-xs">
                Search: {filters.search}
              </Badge>
            )}
            {filters.status && (
              <Badge variant="outline" className="text-xs">
                Status:{" "}
                {filters.status.charAt(0).toUpperCase() +
                  filters.status.slice(1)}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Transactions Table - Responsive Layout */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] sm:w-[100px] text-xs sm:text-sm">
                Date
              </TableHead>
              <TableHead className="min-w-[150px] text-xs sm:text-sm">
                Description
              </TableHead>
              <TableHead className="text-xs sm:text-sm">Category</TableHead>
              <TableHead className="text-xs sm:text-sm">Status</TableHead>
              <TableHead className="text-right text-xs sm:text-sm">
                <div className="flex items-center justify-end">
                  Amount
                  <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="mr-2 animate-spin">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          opacity="0.25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          opacity="0.75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </div>
                    Loading transactions...
                  </div>
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction: UiTransaction) => (
                <TableRow
                  key={transaction.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(transaction)}
                >
                  <TableCell className="font-medium text-xs sm:text-sm py-2 sm:py-4">
                    {new Date(transaction.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm py-2 sm:py-4">
                    {transaction.description}
                  </TableCell>
                  <TableCell className="py-2 sm:py-4">
                    {getCategoryWithColor(transaction.categoryId)}
                  </TableCell>
                  <TableCell className="py-2 sm:py-4">
                    <Badge
                      variant={
                        transaction.status.toLowerCase() === "paid"
                          ? "default"
                          : "secondary"
                      }
                      className="text-[10px] sm:text-xs py-0 px-1.5 sm:px-2"
                    >
                      {transaction.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium text-xs sm:text-sm py-2 sm:py-4 ${
                      transaction.amount >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.amount >= 0 ? "+" : ""}
                    {formatAmount(transaction.amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination - Updated with dynamic data */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-2 sm:mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(
              pagination.page * pagination.limit,
              pagination.totalItems
            )}{" "}
            of {pagination.totalItems} transactions
          </div>
          <Pagination>
            <PaginationContent className="text-xs sm:text-sm">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => previousPage()}
                  className={
                    !pagination.hasPrevPage
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {pageNumbers.map((pageNumber, index) => {
                // If negative, it's an ellipsis indicator
                if (pageNumber < 0) {
                  return (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => goToPage(pageNumber)}
                      isActive={pageNumber === pagination.page}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => nextPage()}
                  className={
                    !pagination.hasNextPage
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Items per page:
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => changePageSize(parseInt(value))}
            >
              <SelectTrigger className="w-16 h-8">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Summary Section */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="p-4 md:p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className="text-sm md:text-base font-medium mb-1 md:mb-2">
            Total Income
          </h3>
          <p className="text-xl md:text-2xl font-bold text-green-600">
            {formatAmount(totalIncome)}
          </p>
        </div>
        <div className="p-4 md:p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className="text-sm md:text-base font-medium mb-1 md:mb-2">
            Total Expenses
          </h3>
          <p className="text-xl md:text-2xl font-bold text-red-600">
            {formatAmount(totalExpenses)}
          </p>
        </div>
        <div className="p-4 md:p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className="text-sm md:text-base font-medium mb-1 md:mb-2">
            Net Balance
          </h3>
          <p className="text-xl md:text-2xl font-bold">
            {formatAmount(netBalance)}
          </p>
        </div>
        <div className="p-4 md:p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
          <h3 className="text-sm md:text-base font-medium mb-1 md:mb-2">
            Transaction Count
          </h3>
          <p className="text-xl md:text-2xl font-bold">
            {transactionCount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Transaction Details Dialog */}
      {selectedTransaction && (
        <TransactionDetailsDialog
          transaction={selectedTransaction}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          categories={mapCategoriesToDialogFormat(categories)}
        />
      )}
    </div>
  );
}
