import { NextResponse } from "next/server";
import db from "@/lib/init/db";
import { verifyToken } from "@/lib/auth/verify-token";
import { getMetadata } from "@/lib/utils/api-utils";

// Define the return type for the categories data
export type CategoriesData = {
  // Income categories
  incomeCategories: {
    name: string;
    amount: number;
    percentage: number;
    transactions: number;
  }[];

  // Expense categories
  expenseCategories: {
    name: string;
    amount: number;
    percentage: number;
    transactions: number;
  }[];

  // Summary data
  summary: {
    totalIncome: number;
    totalExpenses: number;
    incomeCategoriesCount: number;
    expenseCategoriesCount: number;
    topIncomeCategory: string;
    topIncomePercentage: number;
    topExpenseCategory: string;
    topExpensePercentage: number;
  };

  // Time period information
  period: {
    startDate: string;
    endDate: string;
    label: string;
  };
};

// GET /api/reports/categories - Fetch categories data
export async function GET(request: Request) {
  try {
    // Authentication check
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await verifyToken(token);
    const profile_id = decodedToken.uid;

    // Parse period from query parameters
    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "this-month";

    // Calculate date range based on period
    const { startDate, endDate, periodLabel } = calculateDateRange(period);

    // Get income categories
    const incomeCategoriesResult = await db.query(
      `
      SELECT 
        c.name as category_name,
        SUM(t.amount) as total_amount,
        COUNT(t.id) as transaction_count
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE 
        t.profile_id = $1 AND 
        t.amount > 0 AND
        t.date >= $2 AND
        t.date <= $3
      GROUP BY c.name
      ORDER BY total_amount DESC
      `,
      [profile_id, startDate, endDate]
    );

    // Get expense categories
    const expenseCategoriesResult = await db.query(
      `
      SELECT 
        c.name as category_name,
        ABS(SUM(t.amount)) as total_amount,
        COUNT(t.id) as transaction_count
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE 
        t.profile_id = $1 AND 
        t.amount < 0 AND
        t.date >= $2 AND
        t.date <= $3
      GROUP BY c.name
      ORDER BY total_amount DESC
      `,
      [profile_id, startDate, endDate]
    );

    // Calculate totals
    const totalIncome = incomeCategoriesResult.rows.reduce(
      (sum, row) => sum + parseFloat(row.total_amount || "0"),
      0
    );

    const totalExpenses = expenseCategoriesResult.rows.reduce(
      (sum, row) => sum + parseFloat(row.total_amount || "0"),
      0
    );

    // Format income categories with percentages
    const incomeCategories = incomeCategoriesResult.rows.map((row) => {
      const amount = parseFloat(row.total_amount || "0");
      return {
        name: row.category_name,
        amount,
        percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
        transactions: parseInt(row.transaction_count || "0"),
      };
    });

    // Format expense categories with percentages
    const expenseCategories = expenseCategoriesResult.rows.map((row) => {
      const amount = parseFloat(row.total_amount || "0");
      return {
        name: row.category_name,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        transactions: parseInt(row.transaction_count || "0"),
      };
    });

    // Create summary data
    const summary = {
      totalIncome,
      totalExpenses,
      incomeCategoriesCount: incomeCategories.length,
      expenseCategoriesCount: expenseCategories.length,
      topIncomeCategory:
        incomeCategories.length > 0 ? incomeCategories[0].name : "N/A",
      topIncomePercentage:
        incomeCategories.length > 0 ? incomeCategories[0].percentage : 0,
      topExpenseCategory:
        expenseCategories.length > 0 ? expenseCategories[0].name : "N/A",
      topExpensePercentage:
        expenseCategories.length > 0 ? expenseCategories[0].percentage : 0,
    };

    // Construct the response
    const categoriesData: CategoriesData = {
      incomeCategories,
      expenseCategories,
      summary,
      period: {
        startDate,
        endDate,
        label: periodLabel,
      },
    };

    // Get user currency metadata
    const meta = await getMetadata(profile_id);

    return NextResponse.json({
      success: true,
      data: categoriesData,
      meta,
    });
  } catch (error) {
    console.error("Error generating categories data:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate categories data" },
      { status: 500 }
    );
  }
}

// Helper function to calculate date range based on period
function calculateDateRange(period: string): {
  startDate: string;
  endDate: string;
  periodLabel: string;
} {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  let startDate: Date;
  let endDate: Date = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  let periodLabel: string;

  switch (period) {
    case "this-month":
      startDate = new Date(currentYear, currentMonth, 1);
      endDate = new Date(currentYear, currentMonth + 1, 0);
      periodLabel = now.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      break;

    case "last-month":
      startDate = new Date(currentYear, currentMonth - 1, 1);
      endDate = new Date(currentYear, currentMonth, 0);
      periodLabel = new Date(startDate).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      break;

    case "last-3-months":
      startDate = new Date(currentYear, currentMonth - 3, 1);
      periodLabel = `${new Date(startDate).toLocaleString("default", {
        month: "long",
      })} - ${now.toLocaleString("default", {
        month: "long",
        year: "numeric",
      })}`;
      break;

    case "last-6-months":
      startDate = new Date(currentYear, currentMonth - 6, 1);
      periodLabel = `${new Date(startDate).toLocaleString("default", {
        month: "long",
      })} - ${now.toLocaleString("default", {
        month: "long",
        year: "numeric",
      })}`;
      break;

    case "year-to-date":
      startDate = new Date(currentYear, 0, 1);
      periodLabel = `Jan - ${now.toLocaleString("default", {
        month: "long",
        year: "numeric",
      })}`;
      break;

    case "last-year":
      startDate = new Date(currentYear - 1, 0, 1);
      endDate = new Date(currentYear - 1, 11, 31);
      periodLabel = (currentYear - 1).toString();
      break;

    case "all-time":
      startDate = new Date(2000, 0, 1); // Arbitrary past date
      periodLabel = "All Time";
      break;

    default: // Custom date range would be handled directly with startDate and endDate params
      startDate = new Date(currentYear, currentMonth, 1);
      periodLabel = now.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    periodLabel,
  };
}
