import { NextResponse } from "next/server";
import db from "@/lib/init/db";
import { verifyToken } from "@/lib/auth/verify-token";
import { getMetadata } from "@/lib/utils/api-utils";

// GET /api/categories - Fetch all categories
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

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Optional filters
    const type = searchParams.get("type");
    const parentOnly = searchParams.get("parentOnly") === "true";
    const searchQuery = searchParams.get("search");

    // Build the base query
    let countQuery = `
      SELECT COUNT(*) 
      FROM categories c
      WHERE c.profile_id = $1
    `;

    let query = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM transactions WHERE category_id = c.id) AS usage_count 
      FROM categories c
      WHERE c.profile_id = $1
    `;

    // Add filters to both queries
    const params: (string | boolean | number)[] = [profile_id];
    let paramIndex = 2;

    if (type) {
      const whereClause = ` AND c.type = $${paramIndex++}`;
      countQuery += whereClause;
      query += whereClause;
      params.push(type.toUpperCase());
    }

    if (parentOnly) {
      const whereClause = ` AND c.is_parent = $${paramIndex++}`;
      countQuery += whereClause;
      query += whereClause;
      params.push(parentOnly);
    }

    if (searchQuery) {
      const whereClause = ` AND (c.name ILIKE $${paramIndex++} OR c.description ILIKE $${paramIndex++})`;
      countQuery += whereClause;
      query += whereClause;
      params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    // Get total count for pagination
    const countResult = await db.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Add order by and pagination
    query += " ORDER BY c.name ASC";
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    // Execute the main query
    const result = await db.query(query, params);

    // Get user currency metadata
    const meta = await getMetadata(profile_id);

    return NextResponse.json({
      success: true,
      data: result.rows,
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
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category
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
    const { name, color, description, parent_id, is_parent } = body;
    let { type } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { success: false, message: "Name and type are required" },
        { status: 400 }
      );
    }

    // Convert type to uppercase to match schema constraint
    type = type.toUpperCase();
    if (type !== "INCOME" && type !== "EXPENSE") {
      return NextResponse.json(
        {
          success: false,
          message: "Type must be either 'INCOME' or 'EXPENSE'",
        },
        { status: 400 }
      );
    }

    // Create the new category
    const result = await db.query(
      `INSERT INTO categories 
        (name, type, color, description, parent_id, is_parent, profile_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        name,
        type,
        color,
        description,
        parent_id,
        is_parent || false,
        profile_id,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create category" },
      { status: 500 }
    );
  }
}
