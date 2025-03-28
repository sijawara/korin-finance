import { NextResponse } from "next/server";
import db from "@/lib/init/db";
import { verifyToken } from "@/lib/auth/verify-token";

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

    // Get all categories with their usage count and filter by profile_id
    const result = await db.query(
      `
      SELECT c.*, 
        (SELECT COUNT(*) FROM transactions WHERE category_id = c.id) AS usage_count 
      FROM categories c
      WHERE c.profile_id = $1
      ORDER BY name
    `,
      [profile_id]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
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
