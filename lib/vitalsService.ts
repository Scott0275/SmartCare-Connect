import { queueAction, executeWithOfflineSupport } from './syncService';
import { cacheData, getCachedData } from './offlineDb';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp, collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from './firebase';

export async function createVitals(patientId: string, vitalsData: any, nurseId: string) {
  const vitalsId = uuidv4();
  const vitals = {
    ...vitalsData,
    id: vitalsId,
    patientId,
    nurseId,
    createdAt: Timestamp.now(),
  };

  if (!navigator.onLine) {
    // Offline: queue action
    await queueAction('vitals', vitalsId, vitals, 'create');
    await cacheData('cachedVitals', vitals);
    return vitals;
  } else {
    // Online: perform Firestore write immediately
    const ref = await addDoc(collection(db, 'vitals'), vitals);
    const result = { id: ref.id, ...vitals };
    await cacheData('cachedVitals', result);
    return result;
  }
}

export async function getVitalsForPatient(patientId: string) {
  if (navigator.onLine) {
    try {
      const q = query(
        collection(db, 'vitals'),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Cache results
      for (const vital of results) {
        await cacheData('cachedVitals', vital);
      }
      return results;
    } catch (error) {
      console.error('Online vitals fetch failed, using cache:', error);
    }
  }
  
  // Offline - get from cache
  const cached = await getCachedData('cachedVitals') as any[];
  if (!cached) return [];
  
  return cached
    .filter(vital => vital.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}