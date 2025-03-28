import { NextResponse } from "next/server";
import db from "@/lib/init/db";
import { verifyToken } from "@/lib/auth/verify-token";

// GET /api/settings - Fetch user settings
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

    // Get user settings
    const result = await db.query(
      `
      SELECT * FROM user_settings
      WHERE profile_id = $1
      `,
      [profile_id]
    );

    // If no settings found, return default settings
    if (result.rows.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          profile_id,
          currency: "IDR",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch user settings" },
      { status: 500 }
    );
  }
}

// POST /api/settings - Create or update user settings
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
    const { currency } = body;

    // Validate required fields
    if (!currency) {
      return NextResponse.json(
        { success: false, message: "Currency is required" },
        { status: 400 }
      );
    }

    // Check if settings already exist for this profile
    const existingResult = await db.query(
      `SELECT * FROM user_settings WHERE profile_id = $1`,
      [profile_id]
    );

    let result;
    if (existingResult.rows.length === 0) {
      // Create new settings
      result = await db.query(
        `INSERT INTO user_settings 
          (profile_id, currency) 
         VALUES ($1, $2) 
         RETURNING *`,
        [profile_id, currency]
      );
    } else {
      // Update existing settings
      result = await db.query(
        `UPDATE user_settings 
         SET currency = $2, updated_at = CURRENT_TIMESTAMP
         WHERE profile_id = $1 
         RETURNING *`,
        [profile_id, currency]
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update user settings" },
      { status: 500 }
    );
  }
}
