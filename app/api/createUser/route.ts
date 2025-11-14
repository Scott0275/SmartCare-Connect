import { auth, db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json();

    // Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email,
      password,
    });

    // Save user role in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      role,
      uid: userRecord.uid,
    });

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
