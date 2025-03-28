import { NextResponse } from "next/server";
import db from "@/lib/init/db";
import { Transaction } from "@/types";
import { verifyToken } from "@/lib/auth/verify-token";

// GET /api/transactions - Fetch all transactions
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

    // Optional filters
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    // Build query with potential filters
    let sql = `
      SELECT t.*, c.name as category_name, c.color as category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.profile_id = $1
    `;

    const params: (string | number | null)[] = [profile_id];
    let paramIndex = 2;

    if (category) {
      sql += ` AND t.category_id = $${paramIndex++}`;
      params.push(category);
    }

    if (startDate) {
      sql += ` AND t.date >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND t.date <= $${paramIndex++}`;
      params.push(endDate);
    }

    if (status) {
      sql += ` AND t.status = $${paramIndex++}`;
      params.push(status.toUpperCase()); // Ensure status is uppercase for consistency
    }

    // Add order by
    sql += " ORDER BY t.date DESC";

    const result = await db.query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows as Transaction[],
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(request: Request) {
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

    const body = await request.json();
    const { date, description, amount, notes, category_id } = body;
    let { status } = body;

    // Validate required fields
    if (!date || !description || amount === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "Date, description, and amount are required",
        },
        { status: 400 }
      );
    }

    // Format and validate status
    if (status) {
      status = status.toUpperCase();
      if (status !== "PAID" && status !== "UNPAID") {
        return NextResponse.json(
          {
            success: false,
            message: "Status must be either 'PAID' or 'UNPAID'",
          },
          { status: 400 }
        );
      }
    } else {
      status = "UNPAID"; // Default status
    }

    // Create the new transaction
    const result = await db.query(
      `INSERT INTO transactions 
        (date, description, amount, status, notes, category_id, profile_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [date, description, amount, status, notes, category_id, profile_id]
    );

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0] as Transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
