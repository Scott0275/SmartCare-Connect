import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getCachedData, cacheData } from './offlineDb';
import { addToSyncQueue } from './syncQueue';

export const createTimelineEvent = async (
  patientId: string,
  type: 'vitals' | 'encounter' | 'diagnosis' | 'allergy' | 'chronic_condition' | 'triage',
  data: any
): Promise<void> => {
  const eventData = {
    patientId,
    type,
    data,
    createdAt: new Date(),
  };

  try {
    if (navigator.onLine) {
      await addDoc(collection(db, 'timeline'), {
        ...eventData,
        createdAt: Timestamp.fromDate(eventData.createdAt),
      });
    } else {
      await addToSyncQueue({
        type: 'CREATE_TIMELINE_EVENT',
        data: eventData,
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    console.error('Error creating timeline event:', error);
  }
};