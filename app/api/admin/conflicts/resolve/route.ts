import { NextRequest, NextResponse } from 'next/server';
import { resolveConflict } from '@/lib/conflictService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Lazy load Firebase to avoid build-time initialization
    const { auth } = await import('@/lib/firebaseAdmin');
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');
    if (!auth || !db) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

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