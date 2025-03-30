import { NextRequest, NextResponse } from "next/server";
import db from "../../../../lib/init/db";
import { verifyToken } from "../../../../lib/auth/verify-token";
import { getMetadata } from "@/lib/utils/api-utils";

export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await verifyToken(token);
    const profileId = decodedToken.uid;

    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "this-month";

    // Parse the period to determine date range
    const { startDate, endDate } = getPeriodDates(period);

    // Fetch accounts receivable summary with direct SQL query
    // Receivable = positive amount (income) that is UNPAID
    const receivableSummaryResult = await db.query(
      `
      WITH receivable_data AS (
        SELECT 
            t.amount,
            t.status,
            CASE 
                WHEN (COALESCE(t.due_date, t.date + INTERVAL '30 days')) < CURRENT_DATE AND t.status = 'UNPAID' THEN true
                ELSE false
            END as is_overdue
        FROM 
            transactions t
        WHERE 
            t.amount > 0
            AND t.status = 'UNPAID'
            AND t.date BETWEEN $1 AND $2
            AND t.profile_id = $3
      )
      SELECT 
          COALESCE(SUM(amount), 0) as total_receivable,
          0 as paid_receivable,
          COALESCE(SUM(amount), 0) as unpaid_receivable,
          COALESCE(SUM(CASE WHEN is_overdue THEN amount ELSE 0 END), 0) as overdue_receivable,
          COUNT(*) as unpaid_count,
          COUNT(CASE WHEN is_overdue THEN 1 END) as overdue_count
      FROM 
          receivable_data
    `,
      [startDate, endDate, profileId]
    );

    // Fetch accounts payable summary with direct SQL query
    // Payable = negative amount (expense) that is UNPAID
    const payableSummaryResult = await db.query(
      `
      WITH payable_data AS (
        SELECT 
            ABS(t.amount) as amount,
            t.status,
            CASE 
                WHEN (COALESCE(t.due_date, t.date + INTERVAL '30 days')) < CURRENT_DATE AND t.status = 'UNPAID' THEN true
                ELSE false
            END as is_overdue
        FROM 
            transactions t
        WHERE 
            t.amount < 0
            AND t.status = 'UNPAID'
            AND t.date BETWEEN $1 AND $2
            AND t.profile_id = $3
      )
      SELECT 
          COALESCE(SUM(amount), 0) as total_payable,
          0 as paid_payable,
          COALESCE(SUM(amount), 0) as unpaid_payable,
          COALESCE(SUM(CASE WHEN is_overdue THEN amount ELSE 0 END), 0) as overdue_payable,
          COUNT(*) as unpaid_count,
          COUNT(CASE WHEN is_overdue THEN 1 END) as overdue_count
      FROM 
          payable_data
    `,
      [startDate, endDate, profileId]
    );

    // Fetch accounts receivable transactions with direct SQL query
    const receivableTransactionsResult = await db.query(
      `
      SELECT 
          t.id,
          t.description,
          t.date as transaction_date,
          COALESCE(t.due_date, (t.date + INTERVAL '30 days')::DATE) as due_date,
          t.amount,
          t.status,
          CASE 
              WHEN COALESCE(t.due_date, (t.date + INTERVAL '30 days')::DATE) < CURRENT_DATE AND t.status = 'UNPAID' THEN 
                  (CURRENT_DATE - COALESCE(t.due_date, (t.date + INTERVAL '30 days')::DATE))::INTEGER
              ELSE 
                  -(COALESCE(t.due_date, (t.date + INTERVAL '30 days')::DATE) - CURRENT_DATE)::INTEGER
          END as days_overdue
      FROM 
          transactions t
      WHERE 
          t.amount > 0
          AND t.status = 'UNPAID'
          AND t.date BETWEEN $1 AND $2
          AND t.profile_id = $3
      ORDER BY
          t.date DESC
    `,
      [startDate, endDate, profileId]
    );

    // Fetch accounts payable transactions with direct SQL query
    const payableTransactionsResult = await db.query(
      `
      SELECT 
          t.id,
          t.description,
          t.date as transaction_date,
          COALESCE(t.due_date, (t.date + INTERVAL '30 days')::DATE) as due_date,
          ABS(t.amount) as amount,
          t.status,
          CASE 
              WHEN COALESCE(t.due_date, (t.date + INTERVAL '30 days')::DATE) < CURRENT_DATE AND t.status = 'UNPAID' THEN 
                  (CURRENT_DATE - COALESCE(t.due_date, (t.date + INTERVAL '30 days')::DATE))::INTEGER
              ELSE 
                  -(COALESCE(t.due_date, (t.date + INTERVAL '30 days')::DATE) - CURRENT_DATE)::INTEGER
          END as days_overdue
      FROM 
          transactions t
      WHERE 
          t.amount < 0
          AND t.status = 'UNPAID'
          AND t.date BETWEEN $1 AND $2
          AND t.profile_id = $3
      ORDER BY
          t.date DESC
    `,
      [startDate, endDate, profileId]
    );

    // Extract summary data
    const receivableSummary = receivableSummaryResult.rows[0] || {
      total_receivable: 0,
      paid_receivable: 0,
      unpaid_receivable: 0,
      overdue_receivable: 0,
      unpaid_count: 0,
      overdue_count: 0,
    };

    const payableSummary = payableSummaryResult.rows[0] || {
      total_payable: 0,
      paid_payable: 0,
      unpaid_payable: 0,
      overdue_payable: 0,
      unpaid_count: 0,
      overdue_count: 0,
    };

    // Format transaction data
    const receivableTxns =
      receivableTransactionsResult.rows.map(formatTransaction);
    const payableTxns = payableTransactionsResult.rows.map(formatTransaction);

    // Get user currency metadata
    const meta = await getMetadata(profileId);

    return NextResponse.json({
      success: true,
      receivable: {
        total: parseFloat(receivableSummary.total_receivable),
        paid: parseFloat(receivableSummary.paid_receivable),
        unpaid: parseFloat(receivableSummary.unpaid_receivable),
        overdue: parseFloat(receivableSummary.overdue_receivable),
        count: parseInt(receivableSummary.unpaid_count),
        overdueCount: parseInt(receivableSummary.overdue_count),
        transactions: receivableTxns,
      },
      payable: {
        total: parseFloat(payableSummary.total_payable),
        paid: parseFloat(payableSummary.paid_payable),
        unpaid: parseFloat(payableSummary.unpaid_payable),
        overdue: parseFloat(payableSummary.overdue_payable),
        count: parseInt(payableSummary.unpaid_count),
        overdueCount: parseInt(payableSummary.overdue_count),
        transactions: payableTxns,
      },
      periodLabel: getPeriodLabel(period),
      meta,
    });
  } catch (error: unknown) {
    console.error("Error in accounts report API:", error);

    // Handle authentication errors
    if (error instanceof Error && error.message === "Invalid token") {
      return NextResponse.json(
        { success: false, message: "Authentication failed" },
        { status: 401 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch accounts data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper function to format transaction data from DB
interface TransactionRow {
  id: string;
  description: string;
  transaction_date: Date;
  due_date: Date;
  amount: string;
  status: string;
  days_overdue: string;
}

function formatTransaction(row: TransactionRow) {
  return {
    id: row.id,
    description: row.description,
    date:
      row.transaction_date instanceof Date
        ? row.transaction_date.toISOString().split("T")[0]
        : row.transaction_date,
    dueDate:
      row.due_date instanceof Date
        ? row.due_date.toISOString().split("T")[0]
        : row.due_date,
    amount: parseFloat(row.amount),
    status: row.status,
    daysOverdue: parseInt(row.days_overdue),
  };
}

// Helper function to get period date range
function getPeriodDates(period: string) {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  switch (period) {
    case "this-month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case "last-month":
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case "last-3-months":
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      endDate = now;
      break;
    case "last-6-months":
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      endDate = now;
      break;
    case "year-to-date":
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = now;
      break;
    case "last-year":
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31);
      break;
    case "all-time":
      startDate = new Date(2000, 0, 1); // Some far past date
      endDate = now;
      break;
    default: // Custom or invalid, default to this month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}

// Helper function to get a human-readable period label
function getPeriodLabel(period: string): string {
  const periodLabels: Record<string, string> = {
    "this-month": "This Month",
    "last-month": "Last Month",
    "last-3-months": "Last 3 Months",
    "last-6-months": "Last 6 Months",
    "year-to-date": "Year to Date",
    "last-year": "Last Year",
    "all-time": "All Time",
    custom: "Custom Period",
  };

  return periodLabels[period] || "Custom Period";
}
