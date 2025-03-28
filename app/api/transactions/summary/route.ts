import { NextResponse } from "next/server";
import db from "@/lib/init/db";
import { TransactionSummary } from "@/types";
import { verifyToken } from "@/lib/auth/verify-token";

// GET /api/transactions/summary - Get transaction summary statistics
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

    // Get search parameters
    const { searchParams } = new URL(request.url);

    // Date range parameters (defaults to current month if not provided)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    );

    const startDate =
      searchParams.get("startDate") ||
      firstDayOfMonth.toISOString().split("T")[0];
    const endDate =
      searchParams.get("endDate") || lastDayOfMonth.toISOString().split("T")[0];

    // Get the transaction summary using the database function and filter by profile_id
    const result = await db.query(
      "SELECT * FROM get_transaction_summary($1, $2, $3)",
      [startDate, endDate, profile_id]
    );

    // If no data, return zeros
    const summary = (result.rows[0] as TransactionSummary) || {
      total_income: 0,
      total_expenses: 0,
      net_balance: 0,
    };

    return NextResponse.json({
      success: true,
      data: summary,
      meta: {
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error("Error fetching transaction summary:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch transaction summary" },
      { status: 500 }
    );
  }
}
