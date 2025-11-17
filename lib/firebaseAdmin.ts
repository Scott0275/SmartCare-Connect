
import admin from "firebase-admin";

let auth: any = null;
let db: any = null;

try {
  if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString()
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  auth = admin.apps.length > 0 ? admin.auth() : null;
  db = admin.apps.length > 0 ? admin.firestore() : null;
} catch (error) {
  console.warn('Firebase Admin initialization failed during build:', error);
  // Keep auth and db as null for build time
}

export { auth, db };
export default admin;
