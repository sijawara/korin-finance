import { getApps, initializeApp, cert } from "firebase-admin/app";
import { AppOptions } from "firebase-admin";

// Get Firebase Admin app instance or initialize a new one
export function getFirebaseAdminApp() {
  const apps = getApps();

  if (apps.length > 0) {
    return apps[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin SDK credentials are not properly configured in environment variables"
    );
  }

  const options: AppOptions = {
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  };

  return initializeApp(options);
}
