import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Next.js embeds NEXT_PUBLIC values in the web bundle. Firebase rules enforce access.
export function firebaseServices() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  if (Object.values(config).some((value) => !value?.trim())) {
    throw new Error("Configuration Firebase manquante. Renseigne les variables de .env.example dans .env.local puis redémarre le site.");
  }
  const app = getApps()[0] ?? initializeApp({ ...config, storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET });
  return { auth: getAuth(app), db: getFirestore(app) };
}
