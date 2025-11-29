import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// It's common for hosting environments (like Amplify) to run a build
// without having the firebase env vars configured. Protect imports so
// that the app doesn't throw while running `next build` during CI.
const isFirebaseConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

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

export const auth = appInstance ? getAuth(appInstance) : null;
export const db = appInstance ? getFirestore(appInstance) : null;
export const storage = appInstance ? getStorage(appInstance) : null;
