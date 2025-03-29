import { NextResponse, NextRequest } from "next/server";
import db from "@/lib/init/db";
import { verifyToken } from "@/lib/auth/verify-token";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/categories/:id - Fetch a single category by ID
export async function GET(request: NextRequest, props: RouteParams) {
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

    const params = await props.params;
    const { id } = params;

    // Get the category by ID and ensure it belongs to the authenticated user
    const result = await db.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM transactions WHERE category_id = c.id) AS usage_count 
      FROM categories c
      WHERE c.id = $1 AND c.profile_id = $2`,
      [id, profile_id]
    );

    // Check if category exists
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error(`Error fetching category ${(await props.params).id}:`, error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// PATCH /api/categories/:id - Update a category
export async function PATCH(request: NextRequest, props: RouteParams) {
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

    const params = await props.params;
    const { id } = params;

    const body = await request.json();
    const {
      name,
      type: rawType,
      color,
      description,
      parent_id,
      is_parent,
    } = body;

    // Convert type to uppercase if provided
    let type = rawType;
    if (type !== undefined) {
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
    }

    // Update the category, ensuring it belongs to the authenticated user
    const result = await db.query(
      `UPDATE categories 
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           color = COALESCE($3, color),
           description = COALESCE($4, description),
           parent_id = COALESCE($5, parent_id),
           is_parent = COALESCE($6, is_parent)
       WHERE id = $7 AND profile_id = $8
       RETURNING *`,
      [name, type, color, description, parent_id, is_parent, id, profile_id]
    );

    // Check if category exists
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error(`Error updating category ${(await props.params).id}:`, error);
    return NextResponse.json(
      { success: false, message: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/:id - Delete a category
export async function DELETE(request: NextRequest, props: RouteParams) {
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

    const params = await props.params;
    const { id } = params;

    // Delete the category, ensuring it belongs to the authenticated user
    const result = await db.query(
      "DELETE FROM categories WHERE id = $1 AND profile_id = $2 RETURNING id",
      [id, profile_id]
    );

    // Check if category existed
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting category ${(await props.params).id}:`, error);
    return NextResponse.json(
      { success: false, message: "Failed to delete category" },
      { status: 500 }
    );
  }
}
