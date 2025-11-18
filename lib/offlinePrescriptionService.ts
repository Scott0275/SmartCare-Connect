import { createPrescription as originalCreatePrescription } from './prescriptionService';
import { queueAction, executeWithOfflineSupport } from './syncService';
import { cacheData } from './offlineDb';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';

export async function createPrescription(patientId: string, doctorId: string, data: any) {
  const prescriptionId = uuidv4();
  const prescriptionData = {
    patientId,
    doctorId,
    diagnosis: data.diagnosis,
    medications: data.medications,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  return await executeWithOfflineSupport(
    async () => {
      const result = await originalCreatePrescription(patientId, doctorId, data);
      await cacheData('cachedPrescriptions', result);
      return result;
    },
    async () => {
      await queueAction('prescriptions', prescriptionId, prescriptionData, 'create');
      await cacheData('cachedPrescriptions', { id: prescriptionId, ...prescriptionData });
      return { id: prescriptionId, ...prescriptionData };
    }
  );
}