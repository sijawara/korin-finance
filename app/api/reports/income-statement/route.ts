import { NextResponse } from "next/server";
import db from "@/lib/init/db";
import { verifyToken } from "@/lib/auth/verify-token";
import { getMetadata } from "@/lib/utils/api-utils";

// Define the return type for the income statement
export type IncomeStatementData = {
  income: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  expenses: {
    category: string;
    subcategory: string;
    amount: number;
    percentage: number;
    isDirectParentEntry?: boolean;
  }[];
  totals: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    savingsRate: number;
  };
  periodLabel: string;
};

// GET /api/reports/income-statement - Fetch income statement data
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

    // Get all income transactions (positive amounts)
    const incomeResult = await db.query(
      `
      SELECT 
        c.name as category,
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

    // Get all expense transactions (negative amounts)
    const expensesResult = await db.query(
      `
      WITH parent_categories AS (
        SELECT 
          c.id AS category_id,
          c.name AS category_name
        FROM categories c
        WHERE c.profile_id = $1 AND c.is_parent = true
      ),
      child_expenses AS (
        SELECT 
          pc.category_name AS category,
          c.name AS subcategory,
          ABS(SUM(t.amount)) AS amount,
          COUNT(t.id) as transaction_count,
          false AS is_direct_parent_entry
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        JOIN parent_categories pc ON c.parent_id = pc.category_id
        WHERE 
          t.profile_id = $1 AND 
          t.amount < 0 AND
          t.date >= $2 AND
          t.date <= $3
        GROUP BY pc.category_name, c.name
      ),
      parent_expenses AS (
        SELECT 
          c.name AS category,
          'General' AS subcategory,
          ABS(SUM(t.amount)) AS amount,
          COUNT(t.id) as transaction_count,
          true AS is_direct_parent_entry
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE 
          t.profile_id = $1 AND 
          t.amount < 0 AND
          c.is_parent = true AND
          t.date >= $2 AND
          t.date <= $3
        GROUP BY c.name
      ),
      standalone_expenses AS (
        SELECT 
          c.name AS category,
          c.name AS subcategory,
          ABS(SUM(t.amount)) AS amount,
          COUNT(t.id) as transaction_count,
          false AS is_direct_parent_entry
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE 
          t.profile_id = $1 AND 
          t.amount < 0 AND
          c.is_parent = false AND
          c.parent_id IS NULL AND
          t.date >= $2 AND
          t.date <= $3
        GROUP BY c.name
      )
      SELECT * FROM child_expenses
      UNION ALL
      SELECT * FROM parent_expenses
      UNION ALL
      SELECT * FROM standalone_expenses
      ORDER BY category, is_direct_parent_entry, subcategory
      `,
      [profile_id, startDate, endDate]
    );

    // Calculate totals
    const totalIncome = incomeResult.rows.reduce(
      (sum, row) => sum + parseFloat(row.total_amount),
      0
    );

    const totalExpenses = expensesResult.rows.reduce(
      (sum, row) => sum + parseFloat(row.amount),
      0
    );

    const netIncome = totalIncome - totalExpenses;
    const savingsRate =
      totalIncome > 0 ? Math.round((netIncome / totalIncome) * 100) : 0;

    // Format income data with percentages
    const incomeData = incomeResult.rows.map((row) => {
      const amount = parseFloat(row.total_amount);
      return {
        category: row.category,
        amount,
        percentage:
          totalIncome > 0
            ? Math.round((amount / totalIncome) * 100 * 10) / 10
            : 0,
      };
    });

    // Format expense data with percentages
    const expenseData = expensesResult.rows.map((row) => {
      const amount = parseFloat(row.amount);
      return {
        category: row.category,
        subcategory: row.subcategory,
        amount,
        percentage:
          totalExpenses > 0
            ? Math.round((amount / totalExpenses) * 100 * 10) / 10
            : 0,
        isDirectParentEntry: row.is_direct_parent_entry,
      };
    });

    // Construct the response
    const incomeStatement: IncomeStatementData = {
      income: incomeData,
      expenses: expenseData,
      totals: {
        totalIncome,
        totalExpenses,
        netIncome,
        savingsRate,
      },
      periodLabel,
    };

    // Get user currency metadata
    const meta = await getMetadata(profile_id);

    return NextResponse.json({
      success: true,
      data: incomeStatement,
      meta,
    });
  } catch (error) {
    console.error("Error generating income statement:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate income statement" },
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
