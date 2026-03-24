import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Use a safe initialization pattern to prevent "Black Screen" if VITE_ variables are missing
let app: any = null;
let db: any = null;
let auth: any = null;
let storage: any = null;
let analytics: any = null;

try {
  if (!firebaseConfig.apiKey) {
    console.warn("⚠️ Firebase API Key is missing! Firebase services will be disabled. Check your .env.local file.");
  } else {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    
    if (typeof window !== "undefined") {
      isSupported().then(yes => {
        if (yes) analytics = getAnalytics(app);
      }).catch(err => console.debug("Analytics not supported:", err));
    }
  }
} catch (error) {
  console.error("❌ Firebase initialization failed:", error);
}

export { app, db, auth, storage, analytics };
