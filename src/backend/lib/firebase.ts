import { initializeApp, getApps, getApp } from "@firebase/app";
import { getAuth } from "@firebase/auth";

const clean = (val?: string) => (val ? val.trim().replace(/^["']|["']$/g, "") : "");

const firebaseConfig = {
  apiKey: clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) || "AIzaSyCEQVh9MeeGfSpaBxBdcfWw0LAVHkPsUOE",
  authDomain: clean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || "lvstrendz-facc6.firebaseapp.com",
  projectId: clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || "lvstrendz-facc6",
  storageBucket: clean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || "lvstrendz-facc6.firebasestorage.app",
  messagingSenderId: clean(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || "778942627197",
  appId: clean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) || "1:778942627197:web:c8f3fdd479359d43556014",
  measurementId: clean(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) || "G-V5JYX7N418",
};

export const getFirebaseAuth = () => {
  if (typeof window === "undefined") {
    throw new Error("Firebase Auth can only be initialized on the client side.");
  }
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  return getAuth(app);
};
