import { queueAction } from './syncService';
import { cacheData, getCachedData } from './offlineDb';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp, collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface LabResult {
  testId: string;
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag?: 'High' | 'Low' | 'Critical' | 'Normal';
  notes?: string;
}

export interface LabRequest {
  id: string;
  patientId: string;
  doctorId: string;
  tests: any[];
  priority: 'normal' | 'urgent' | 'stat';
  status: 'pending' | 'accepted' | 'sample_collected' | 'in_progress' | 'completed';
  notes?: string;
  createdAt: any;
  acceptedAt?: any;
  completedAt?: any;
  technicianId?: string;
  results?: LabResult[];
  attachments?: string[];
}

export async function getLabRequests(status?: string) {
  if (navigator.onLine) {
    try {
      let q = query(collection(db, 'labRequests'), orderBy('createdAt', 'desc'));
      if (status) {
        q = query(collection(db, 'labRequests'), where('status', '==', status), orderBy('createdAt', 'desc'));
      }
      const snap = await getDocs(q);
      const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      for (const request of results) {
        await cacheData('cachedLabRequests', request);
      }
      return results;
    } catch (error) {
      console.error('Online lab requests fetch failed, using cache:', error);
    }
  }
  
  const cached = await getCachedData('cachedLabRequests') as LabRequest[];
  if (!cached) return [];
  
  return status ? cached.filter(req => req.status === status) : cached;
}

export async function acceptLabRequest(requestId: string, technicianId: string) {
  const updateData = {
    status: 'accepted',
    technicianId,
    acceptedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  if (!navigator.onLine) {
    await queueAction('labRequests', requestId, updateData, 'update');
    const cached = await getCachedData('cachedLabRequests') as LabRequest[];
    const updated = cached?.map(req => req.id === requestId ? { ...req, ...updateData } : req) || [];
    await cacheData('cachedLabRequests', { id: requestId, ...updateData });
    return { id: requestId, ...updateData };
  } else {
    const ref = doc(db, 'labRequests', requestId);
    await updateDoc(ref, updateData);
    const snap = await getDoc(ref);
    const result = { id: snap.id, ...snap.data() };
    await cacheData('cachedLabRequests', result);
    return result;
  }
}

export async function updateLabRequestStatus(requestId: string, status: string, additionalData?: any) {
  const updateData = {
    status,
    updatedAt: Timestamp.now(),
    ...additionalData,
  };

  if (!navigator.onLine) {
    await queueAction('labRequests', requestId, updateData, 'update');
    await cacheData('cachedLabRequests', { id: requestId, ...updateData });
    return { id: requestId, ...updateData };
  } else {
    const ref = doc(db, 'labRequests', requestId);
    await updateDoc(ref, updateData);
    const snap = await getDoc(ref);
    const result = { id: snap.id, ...snap.data() };
    await cacheData('cachedLabRequests', result);
    return result;
  }
}

export async function submitLabResults(requestId: string, results: LabResult[], attachments?: string[]) {
  const updateData = {
    status: 'completed',
    results,
    attachments: attachments || [],
    completedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  if (!navigator.onLine) {
    await queueAction('labRequests', requestId, updateData, 'update');
    await cacheData('cachedLabRequests', { id: requestId, ...updateData });
    return { id: requestId, ...updateData };
  } else {
    const ref = doc(db, 'labRequests', requestId);
    await updateDoc(ref, updateData);
    const snap = await getDoc(ref);
    const result = { id: snap.id, ...snap.data() };
    await cacheData('cachedLabRequests', result);
    return result;
  }
}

export async function getLabRequestById(requestId: string) {
  if (navigator.onLine) {
    try {
      const ref = doc(db, 'labRequests', requestId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const result = { id: snap.id, ...snap.data() };
        await cacheData('cachedLabRequests', result);
        return result;
      }
    } catch (error) {
      console.error('Online lab request fetch failed, using cache:', error);
    }
  }
  
  const cached = await getCachedData('cachedLabRequests') as LabRequest[];
  return cached?.find(req => req.id === requestId) || null;
}