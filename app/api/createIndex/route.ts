import admin from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';

export async function POST(req: Request) {
  try {
    if (!admin.apps.length) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Missing auth' }, { status: 401 });
    const idToken = authHeader.replace('Bearer ', '');

    // Verify ID token and check role
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;
    const userDoc = await admin.firestore().doc(`users/${uid}`).get();
    const role = userDoc.exists ? (userDoc.data() as any).role : null;
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { collectionGroup, fields, queryScope = 'COLLECTION' } = body;
    if (!collectionGroup || !fields) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

    // Load service account from env
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!serviceAccountBase64) return NextResponse.json({ error: 'Service account not configured' }, { status: 500 });
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString());
    const projectId = serviceAccount.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) return NextResponse.json({ error: 'Project ID not found' }, { status: 500 });

    // Authorize via JWT
    const jwtClient = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/datastore', 'https://www.googleapis.com/auth/cloud-platform'],
    });
    const tokens = await jwtClient.authorize();
    const accessToken = tokens.access_token;
    if (!accessToken) return NextResponse.json({ error: 'Failed to obtain access token' }, { status: 500 });

    // Build Firestore Admin create index endpoint for collection group
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/collectionGroups/${encodeURIComponent(
      collectionGroup
    )}/indexes`;

    const indexBody = {
      fields: fields.map((f: any) => ({ fieldPath: f.fieldPath, order: f.order })),
      queryScope,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(indexBody),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: 'Failed to create index', detail: data }, { status: res.status });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('createIndex error', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
