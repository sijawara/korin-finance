import { NextResponse } from "next/server";
import db from "@/lib/init/db";
import { verifyToken } from "@/lib/auth/verify-token";

// GET /api/categories/stats - Fetch category statistics
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

    // Query to get all category statistics in a single database call
    const result = await db.query(
      `
      SELECT
        COUNT(*) AS total_categories,
        SUM(CASE WHEN type = 'INCOME' THEN 1 ELSE 0 END) AS income_categories,
        SUM(CASE WHEN type = 'EXPENSE' THEN 1 ELSE 0 END) AS expense_categories,
        SUM(CASE WHEN is_parent = true THEN 1 ELSE 0 END) AS parent_categories
      FROM categories
      WHERE profile_id = $1
      `,
      [profile_id]
    );

    // Extract the statistics from the query result
    const stats = result.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        totalCategories: parseInt(stats.total_categories || "0"),
        incomeCategories: parseInt(stats.income_categories || "0"),
        expenseCategories: parseInt(stats.expense_categories || "0"),
        parentCategories: parseInt(stats.parent_categories || "0"),
      },
    });
  } catch (error) {
    console.error("Error fetching category statistics:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch category statistics" },
      { status: 500 }
    );
  }
}
