import { getAuth, DecodedIdToken } from "firebase-admin/auth";
import { getFirebaseAdminApp } from "../init/firebase-admin";

export async function verifyToken(token: string): Promise<DecodedIdToken> {
  try {
    if (!token) {
      throw new Error("No token provided");
    }

    const app = getFirebaseAdminApp();
    const auth = getAuth(app);

    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying token:", error);
    throw new Error("Invalid token");
  }
}
