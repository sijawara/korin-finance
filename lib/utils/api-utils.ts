import db from "@/lib/init/db";

/**
 * Gets a user's currency setting from the database to include in API responses
 * @param profile_id The user's profile ID
 * @returns The user's currency setting (default: "IDR")
 */
export async function getUserCurrency(profile_id: string): Promise<string> {
  try {
    const result = await db.query(
      `SELECT currency FROM user_settings WHERE profile_id = $1`,
      [profile_id]
    );

    // If no settings found, return default currency
    if (result.rows.length === 0) {
      return "IDR";
    }

    return result.rows[0].currency;
  } catch (error) {
    console.error("Error fetching user currency:", error);
    return "IDR"; // Default fallback
  }
}

/**
 * Adds currency metadata to API responses
 * @param profile_id The user's profile ID
 * @returns An object with the user's currency
 */
export async function getMetadata(
  profile_id: string
): Promise<{ currency: string }> {
  const currency = await getUserCurrency(profile_id);
  return { currency };
}
