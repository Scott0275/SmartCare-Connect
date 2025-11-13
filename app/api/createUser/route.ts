
import { NextResponse } from "next/server";
import admin from "@/lib/firebaseAdmin"; // Ensure firebaseAdmin.ts is properly set up with your service account

// Function to generate a secure temporary password
function generateTempPassword() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(req: Request) {
  try {
    const { email, fullName, role } = await req.json();

    if (!email || !role || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate a temporary password
    const tempPassword = generateTempPassword();

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password: tempPassword,
      displayName: fullName,
    });

    // Assign custom claim (role)
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });

    // Optionally store in Firestore
    const db = admin.firestore();
    await db.collection("users").doc(userRecord.uid).set({
      fullName,
      email,
      role,
      createdAt: new Date(),
    });

    return NextResponse.json({
      message: "User created successfully",
      email,
      role,
      tempPassword, // Display to admin only
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
