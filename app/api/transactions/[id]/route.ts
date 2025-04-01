import { NextResponse, NextRequest } from "next/server";
import db from "@/lib/init/db";
import { Transaction } from "@/types";
import { verifyToken } from "@/lib/auth/verify-token";
import { getMetadata } from "@/lib/utils/api-utils";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/transactions/:id - Fetch a single transaction by ID
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

    // Get the transaction by ID and ensure it belongs to the authenticated user
    const result = await db.query(
      `SELECT t.*, c.name as category_name, c.color as category_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = $1 AND t.profile_id = $2`,
      [id, profile_id]
    );

    // Check if transaction exists
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Transaction not found" },
        { status: 404 }
      );
    }

    // Get user currency metadata
    const meta = await getMetadata(profile_id);

    return NextResponse.json({
      success: true,
      data: result.rows[0] as Transaction,
      meta,
    });
  } catch (error) {
    console.error(
      `Error fetching transaction ${(await props.params).id}:`,
      error
    );
    return NextResponse.json(
      { success: false, message: "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}

// PATCH /api/transactions/:id - Update a transaction
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
    const { date, description, amount, notes, category_id, tax_amount } = body;
    let { status } = body;

    // Format and validate status if provided
    if (status !== undefined) {
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
    }

    // Update the transaction, ensuring it belongs to the authenticated user
    const result = await db.query(
      `UPDATE transactions 
       SET date = COALESCE($1, date),
           description = COALESCE($2, description),
           amount = COALESCE($3, amount),
           status = COALESCE($4, status),
           notes = COALESCE($5, notes),
           category_id = COALESCE($6, category_id),
           tax_amount = COALESCE($7, tax_amount)
       WHERE id = $8 AND profile_id = $9
       RETURNING *`,
      [
        date,
        description,
        amount,
        status,
        notes,
        category_id,
        tax_amount,
        id,
        profile_id,
      ]
    );

    // Check if transaction exists
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0] as Transaction,
    });
  } catch (error) {
    console.error(
      `Error updating transaction ${(await props.params).id}:`,
      error
    );
    return NextResponse.json(
      { success: false, message: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/:id - Delete a transaction
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

    // Delete the transaction, ensuring it belongs to the authenticated user
    const result = await db.query(
      "DELETE FROM transactions WHERE id = $1 AND profile_id = $2 RETURNING id",
      [id, profile_id]
    );

    // Check if transaction existed
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error(
      `Error deleting transaction ${(await props.params).id}:`,
      error
    );
    return NextResponse.json(
      { success: false, message: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
