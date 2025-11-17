import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Check if we have valid Firebase configuration
const hasValidConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'dummy-key' &&
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('undefined');

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

// Only initialize Firebase if we have valid config
if (hasValidConfig) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
    // Keep services as null for graceful degradation
  }
} else {
  console.warn('Firebase configuration missing or invalid - running in offline mode');
}

export { app, auth, db, storage };
