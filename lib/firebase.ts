import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Avoid initializing the Firebase *client* SDK during server-side build
// (Amplify / Next build runs in Node). We only initialize in a browser
// environment where NEXT_PUBLIC_FIREBASE_* variables are present.
const isBrowser = typeof window !== 'undefined';
const isFirebaseConfigured = isBrowser && !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

let appInstance: ReturnType<typeof initializeApp> | undefined;
if (isFirebaseConfigured) {
	const firebaseConfig = {
		apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
		authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
		projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
		storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
		messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
		appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
		measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
	};

	// initialize lazily (avoid double-init errors in dev HMR)
	appInstance = !getApps().length ? initializeApp(firebaseConfig) : getApp();
}

// Keep the exported types matching client SDK signatures to avoid
// TypeScript churn in files that import these. If we didn't initialize
// due to being in a server/build environment, we export typed `undefined`
// at runtime (casted via any to satisfy TS). This prevents build-time
// initialization errors while preserving existing types across the codebase.
type AuthType = ReturnType<typeof getAuth>;
type FirestoreType = ReturnType<typeof getFirestore>;
type StorageType = ReturnType<typeof getStorage>;

export const auth = (appInstance ? getAuth(appInstance) : (undefined as any)) as AuthType;
export const db = (appInstance ? getFirestore(appInstance) : (undefined as any)) as FirestoreType;
export const storage = (appInstance ? getStorage(appInstance) : (undefined as any)) as StorageType;
