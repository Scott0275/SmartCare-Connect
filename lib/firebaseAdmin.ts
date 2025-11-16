
import admin from "firebase-admin";

if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString()
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.apps.length > 0 ? admin.auth() : null;
const db = admin.apps.length > 0 ? admin.firestore() : null;

export { auth, db };
export default admin;
