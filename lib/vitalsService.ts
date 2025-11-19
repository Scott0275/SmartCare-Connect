import { createDocument, updateDocument } from './syncEngine';
import { cacheData, getCachedData } from './offlineDb';

export async function createVitals(patientId: string, vitalsData: any, userId: string) {
  const data = {
    ...vitalsData,
    patientId,
    recordedBy: userId,
    recordedAt: new Date(),
    id: `vitals_${patientId}_${Date.now()}`
  };

  try {
    const docId = await createDocument('vitals', data);
    return docId;
  } catch (error) {
    // Cache locally for offline
    await cacheData('cachedVitals', data);
    throw error;
  }
}

export async function getPatientVitals(patientId: string) {
  try {
    // Try to get from cache first for speed
    const cached = await getCachedData('cachedVitals') as any[];
    return cached?.filter(v => v.patientId === patientId) || [];
  } catch (error) {
    console.error('Error getting vitals:', error);
    return [];
  }
}

export async function getVitalsForPatient(patientId: string) {
  return getPatientVitals(patientId);
}