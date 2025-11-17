import { queueAction, executeWithOfflineSupport } from './syncService';
import { cacheData, getCachedData } from './offlineDb';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp, collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from './firebase';

export const LAB_TESTS = [
  { id: 'cbc', name: 'Complete Blood Count (CBC)', category: 'Hematology' },
  { id: 'fbc', name: 'Full Blood Count (FBC)', category: 'Hematology' },
  { id: 'cmp', name: 'Comprehensive Metabolic Panel', category: 'Chemistry' },
  { id: 'electrolytes', name: 'Electrolytes', category: 'Chemistry' },
  { id: 'urinalysis', name: 'Urinalysis', category: 'Urine' },
  { id: 'widal', name: 'Widal Test', category: 'Serology' },
  { id: 'hbsag', name: 'Hepatitis B Surface Antigen', category: 'Serology' },
  { id: 'hiv', name: 'HIV Test', category: 'Serology' },
  { id: 'glucose', name: 'Blood Glucose', category: 'Chemistry' },
  { id: 'lipid', name: 'Lipid Profile', category: 'Chemistry' },
];

export async function createLabRequest(patientId: string, doctorId: string, requestData: any) {
  const requestId = uuidv4();
  const labRequest = {
    ...requestData,
    id: requestId,
    patientId,
    doctorId,
    status: 'pending',
    createdAt: Timestamp.now(),
  };

  if (!navigator.onLine) {
    // Offline: queue action
    await queueAction('labRequests', requestId, labRequest, 'create');
    await cacheData('cachedLabRequests', labRequest);
    return labRequest;
  } else {
    // Online: perform Firestore write immediately
    const ref = await addDoc(collection(db, 'labRequests'), labRequest);
    const result = { ...labRequest, id: ref.id };
    await cacheData('cachedLabRequests', result);
    return result;
  }
}

export async function getLabRequestsForPatient(patientId: string) {
  if (navigator.onLine) {
    try {
      const q = query(
        collection(db, 'labRequests'),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Cache results
      for (const request of results) {
        await cacheData('cachedLabRequests', request);
      }
      return results;
    } catch (error) {
      console.error('Online lab requests fetch failed, using cache:', error);
    }
  }
  
  // Offline - get from cache
  const cached = await getCachedData('cachedLabRequests') as any[];
  if (!cached) return [];
  
  return cached
    .filter(request => request.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}