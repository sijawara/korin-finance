import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_REALTIME_URL,
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Set persistence immediately
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(console.error);
}

const db = getFirestore(app);
const storage = getStorage(app);
const realtimeDb = getDatabase(app);

// Initialize Analytics with support check
let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported().then(
    (isSupported: boolean) => isSupported && (analytics = getAnalytics(app))
  );
}

export { app, auth, db, storage, realtimeDb, analytics, googleProvider };
