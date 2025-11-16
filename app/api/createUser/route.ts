import admin from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    if (!admin.apps.length) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    // Verify caller is authenticated and is an admin
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.replace('Bearer ', '');
    let decoded: any;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // check role in Firestore
    const callerUid = decoded.uid;
    const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
    if (!callerDoc.exists || (callerDoc.exists && callerDoc.data()?.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, password, role } = await req.json();

    // Create user in Firebase Authentication using admin SDK
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    // Save user role in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      role,
      uid: userRecord.uid,
    });

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (error: any) {
    console.error('createUser error', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
