import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Public web configuration. Access is controlled by Firebase Security Rules.
export function firebaseServices() {
  const app = getApps()[0] ?? initializeApp({
    apiKey: "AIzaSyD7goCHGnKzgmD_XIxhP-byDgezG95TCvk",
    authDomain: "cv-builder-214cb.firebaseapp.com",
    projectId: "cv-builder-214cb",
    storageBucket: "cv-builder-214cb.firebasestorage.app",
    messagingSenderId: "323302246391",
    appId: "1:323302246391:web:790fd5b698630dc85e90f2",
  });
  return { auth: getAuth(app), db: getFirestore(app), storage: getStorage(app) };
}
