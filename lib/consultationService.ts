import { queueAction, executeWithOfflineSupport } from './syncService';
import { cacheData, getCachedData } from './offlineDb';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp, collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function createConsultation(patientId: string, doctorId: string, consultationData: any) {
  const consultationId = uuidv4();
  const consultation = {
    ...consultationData,
    id: consultationId,
    patientId,
    doctorId,
    status: 'draft',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  return executeWithOfflineSupport(
    async () => {
      const ref = await addDoc(collection(db, 'consultations'), consultation);
      const result = { ...consultation, id: ref.id };
      await cacheData('cachedConsultations', result);
      return result;
    },
    async () => {
      await queueAction('consultations', consultationId, consultation, 'create');
      await cacheData('cachedConsultations', consultation);
      return consultation;
    }
  );
}

export async function updateConsultation(consultationId: string, updates: any) {
  const updatedData = { ...updates, updatedAt: Timestamp.now() };
  
  return executeWithOfflineSupport(
    async () => {
      const ref = doc(db, 'consultations', consultationId);
      await updateDoc(ref, updatedData);
      const snap = await getDoc(ref);
      const result = { id: snap.id, ...snap.data() };
      await cacheData('cachedConsultations', result);
      return result;
    },
    async () => {
      await queueAction('consultations', consultationId, updatedData, 'update');
      // Update local cache
      const cached = await getCachedData('cachedConsultations') as any[];
      const updated = cached?.map(c => c.id === consultationId ? { ...c, ...updatedData } : c) || [];
      await cacheData('cachedConsultations', { id: consultationId, ...updatedData });
      return { id: consultationId, ...updatedData };
    }
  );
}

export async function getConsultationsForPatient(patientId: string) {
  if (navigator.onLine) {
    try {
      const q = query(
        collection(db, 'consultations'),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Cache results
      for (const consultation of results) {
        await cacheData('cachedConsultations', consultation);
      }
      return results;
    } catch (error) {
      console.error('Online consultations fetch failed, using cache:', error);
    }
  }
  
  // Offline - get from cache
  const cached = await getCachedData('cachedConsultations') as any[];
  if (!cached) return [];
  
  return cached
    .filter(consultation => consultation.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getConsultationById(consultationId: string) {
  if (navigator.onLine) {
    try {
      const ref = doc(db, 'consultations', consultationId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const result = { id: snap.id, ...snap.data() };
        await cacheData('cachedConsultations', result);
        return result;
      }
    } catch (error) {
      console.error('Online consultation fetch failed, using cache:', error);
    }
  }
  
  // Offline - get from cache
  const cached = await getCachedData('cachedConsultations') as any[];
  return cached?.find(c => c.id === consultationId) || null;
}