import { NextResponse } from "next/server";
import db from "@/lib/init/db";
import { verifyToken } from "@/lib/auth/verify-token";

// GET /api/transactions/stats - Fetch transaction statistics
export async function GET(request: Request) {
  try {
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

    // Optional date range filtering from query parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // Build where clause for date range filtering
    let dateRangeWhere = "";
    const queryParams = [profile_id];

    if (startDate && endDate) {
      dateRangeWhere = "AND date >= $2 AND date <= $3";
      queryParams.push(startDate, endDate);
    } else if (startDate) {
      dateRangeWhere = "AND date >= $2";
      queryParams.push(startDate);
    } else if (endDate) {
      dateRangeWhere = "AND date <= $2";
      queryParams.push(endDate);
    }

    // Query to get transaction statistics in a single database call
    const result = await db.query(
      `
      SELECT
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) AS total_expenses,
        COUNT(*) AS transaction_count,
        SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) AS paid_count,
        SUM(CASE WHEN status = 'UNPAID' THEN 1 ELSE 0 END) AS unpaid_count
      FROM transactions
      WHERE profile_id = $1 ${dateRangeWhere}
      `,
      queryParams
    );

    // Extract the statistics from the query result
    const stats = result.rows[0];

    // Calculate the net balance (income - expenses)
    const totalIncome = parseFloat(stats.total_income || "0");
    const totalExpenses = parseFloat(stats.total_expenses || "0");
    const netBalance = totalIncome - totalExpenses;

    return NextResponse.json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        netBalance,
        transactionCount: parseInt(stats.transaction_count || "0"),
        paidCount: parseInt(stats.paid_count || "0"),
        unpaidCount: parseInt(stats.unpaid_count || "0"),
      },
    });
  } catch (error) {
    console.error("Error fetching transaction statistics:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch transaction statistics" },
      { status: 500 }
    );
  }
}
