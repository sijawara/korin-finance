import { NextResponse } from "next/server";
import db from "@/lib/init/db";
import { Transaction } from "@/types";
import { verifyToken } from "@/lib/auth/verify-token";
import { getMetadata } from "@/lib/utils/api-utils";

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
    const search = searchParams.get("search");
    const type = searchParams.get("type");

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Build query with potential filters
    let sql = `
      SELECT t.*, c.name as category_name, c.color as category_color, c.type as category_type
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

    if (type) {
      sql += ` AND c.type = $${paramIndex++}`;
      params.push(type.toUpperCase()); // Ensure type is uppercase for consistency
    }

    if (search) {
      sql += ` AND (
        t.description ILIKE $${paramIndex++} OR
        t.notes ILIKE $${paramIndex++}
      )`;
      // Use ILIKE for case-insensitive search with wildcards
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // First, get total count for pagination metadata
    const countSql = `
      SELECT COUNT(*) FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.profile_id = $1
      ${category ? `AND t.category_id = $${params.indexOf(category) + 1}` : ""}
      ${startDate ? `AND t.date >= $${params.indexOf(startDate) + 1}` : ""}
      ${endDate ? `AND t.date <= $${params.indexOf(endDate) + 1}` : ""}
      ${
        status
          ? `AND t.status = $${params.indexOf(status.toUpperCase()) + 1}`
          : ""
      }
      ${
        type
          ? `AND c.type = $${params.indexOf(type.toUpperCase()) + 1}`
          : ""
      }
      ${
        search
          ? `AND (
              t.description ILIKE $${params.indexOf(`%${search}%`) + 1} OR
              t.notes ILIKE $${params.indexOf(`%${search}%`) + 2}
            )`
          : ""
      }
    `;

    const countResult = await db.query(countSql, [
      profile_id,
      ...params.slice(1),
    ]);
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Add order by and pagination
    sql += " ORDER BY t.created_at DESC, t.id DESC";
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await db.query(sql, params);

    // Get user currency metadata
    const meta = await getMetadata(profile_id);

    return NextResponse.json({
      success: true,
      data: result.rows as Transaction[],
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      meta,
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
    const { date, description, amount, notes, category_id, tax_amount } = body;
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

    // Get category type if category_id is provided
    let finalAmount = amount;
    if (category_id) {
      const categoryResult = await db.query(
        "SELECT type FROM categories WHERE id = $1",
        [category_id]
      );
      
      if (categoryResult.rows.length > 0) {
        const categoryType = categoryResult.rows[0].type;
        if (categoryType === 'EXPENSE') {
          finalAmount = Math.abs(amount) * -1; // Convert to negative number
        }
      }
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
        (date, description, amount, status, notes, category_id, profile_id, tax_amount) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        date,
        description,
        finalAmount,
        status,
        notes,
        category_id,
        profile_id,
        tax_amount || null,
      ]
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
