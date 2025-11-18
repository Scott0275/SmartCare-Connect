import { addPatient, getPatientById, getPatients } from '@/services/patients';
import { queueAction, executeWithOfflineSupport } from './syncService';
import { cacheData, getCachedData } from './offlineDb';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';

export async function createPatientOffline(patientData: any) {
  const patientId = uuidv4();
  const patient = {
    ...patientData,
    id: patientId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  return await executeWithOfflineSupport(
    async () => {
      const result = await addPatient(patientData);
      await cacheData('cachedPatients', result);
      return result;
    },
    async () => {
      await queueAction('patients', patientId, patient, 'create');
      await cacheData('cachedPatients', patient);
      return patient;
    }
  );
}

export async function searchPatientsOffline(query: string) {
  return await executeWithOfflineSupport(
    async () => {
      const allPatients = await getPatients();
      const results = allPatients.filter(patient => 
        patient.firstName?.toLowerCase().includes(query.toLowerCase()) ||
        patient.lastName?.toLowerCase().includes(query.toLowerCase()) ||
        patient.email?.toLowerCase().includes(query.toLowerCase()) ||
        patient.id?.toLowerCase().includes(query.toLowerCase())
      );
      for (const patient of results) {
        await cacheData('cachedPatients', patient);
      }
      return results;
    },
    async () => {
      const cached = await getCachedData('cachedPatients') as any[];
      if (!cached) return [];
      return cached.filter(patient => 
        patient.firstName?.toLowerCase().includes(query.toLowerCase()) ||
        patient.lastName?.toLowerCase().includes(query.toLowerCase()) ||
        patient.email?.toLowerCase().includes(query.toLowerCase()) ||
        patient.patientId?.toLowerCase().includes(query.toLowerCase())
      );
    }
  );
}

export async function getRecentPatients() {
  const cached = await getCachedData('cachedPatients') as any[];
  if (!cached) return [];
  
  return cached
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);
}