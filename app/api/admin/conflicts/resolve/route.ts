import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebaseAdmin';
import { resolveConflict } from '@/lib/conflictService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Verify admin role
    const userRef = doc(db, 'users', decodedToken.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists() || userSnap.data().role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { conflictId, resolutionType, mergedData, note } = await request.json();

    if (!conflictId || !resolutionType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await resolveConflict(
      conflictId,
      resolutionType,
      mergedData,
      note,
      decodedToken.uid
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error resolving conflict:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}