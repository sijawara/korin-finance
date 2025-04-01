import crypto from "crypto";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const API_ACCESS_TOKEN = process.env.META_CONVERSION_API_TOKEN;
const API_VERSION = "v17.0"; // Meta API version

interface ConversionData {
  event_name: string;
  event_time: number;
  user_data: {
    em?: string[];
    ph?: string[];
    external_id?: string[];
    client_ip_address?: string;
    client_user_agent?: string;
  };
  custom_data?: {
    [key: string]: unknown;
  };
  event_source_url?: string;
  action_source: "website";
}

export const sendConversionEvent = async (data: ConversionData) => {
  if (!PIXEL_ID || !API_ACCESS_TOKEN) {
    console.warn("Meta Pixel ID or API Access Token not configured");
    return;
  }

  try {
    // Hash user data if present
    if (data.user_data.em) {
      data.user_data.em = data.user_data.em.map((email) =>
        crypto
          .createHash("sha256")
          .update(email.toLowerCase().trim())
          .digest("hex")
      );
    }
    if (data.user_data.ph) {
      data.user_data.ph = data.user_data.ph.map((phone) =>
        crypto
          .createHash("sha256")
          .update(phone.replace(/[^0-9]/g, ""))
          .digest("hex")
      );
    }

    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [data],
          access_token: API_ACCESS_TOKEN,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Meta Conversion API response:", result);
    return result;
  } catch (error) {
    console.error("Error sending conversion event:", error);
    return null;
  }
};
