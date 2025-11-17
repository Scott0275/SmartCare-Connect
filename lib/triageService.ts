import { db } from './firebase';
import { collection, doc, addDoc, updateDoc, getDocs, getDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { getCachedData, cacheData } from './offlineDb';
import { addToSyncQueue } from './syncQueue';
import { createTimelineEvent } from './createTimelineEvent';

export interface TriageRecord {
  id: string;
  patientId: string;
  nurseId: string;
  appointmentId?: string;
  vitals: {
    temperature?: number;
    bloodPressure?: string;
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    weight?: number;
    height?: number;
  };
  complaint: string;
  triageLevel: 'emergency' | 'urgent' | 'semi-urgent' | 'non-urgent';
  status: 'pending' | 'completed' | 'doctor_started' | 'closed';
  notes?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const createTriage = async (
  patientId: string,
  nurseId: string,
  data: Partial<TriageRecord>,
  appointmentId?: string
): Promise<string> => {
  const triageData = {
    patientId,
    nurseId,
    appointmentId,
    vitals: data.vitals || {},
    complaint: data.complaint || '',
    triageLevel: data.triageLevel || 'non-urgent',
    status: 'pending' as const,
    notes: data.notes || '',
    attachments: data.attachments || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    if (navigator.onLine) {
      const docRef = await addDoc(collection(db, 'triage'), {
        ...triageData,
        createdAt: Timestamp.fromDate(triageData.createdAt),
        updatedAt: Timestamp.fromDate(triageData.updatedAt),
      });
      
      // Cache locally
      await cacheData('cachedTriage', { ...triageData, id: docRef.id });
      
      return docRef.id;
    } else {
      // Offline mode
      const tempId = `temp_${Date.now()}`;
      const triageWithId = { ...triageData, id: tempId };
      
      await cacheData('cachedTriage', triageWithId);
      
      await addToSyncQueue({
        type: 'CREATE_TRIAGE',
        data: triageData,
        tempId,
        timestamp: Date.now(),
      });
      
      return tempId;
    }
  } catch (error) {
    console.error('Error creating triage:', error);
    throw error;
  }
};

export const updateTriageStatus = async (
  triageId: string,
  status: TriageRecord['status'],
  additionalData?: Partial<TriageRecord>
): Promise<void> => {
  const updateData = {
    status,
    updatedAt: new Date(),
    ...additionalData,
  };

  try {
    if (navigator.onLine && !triageId.startsWith('temp_')) {
      await updateDoc(doc(db, 'triage', triageId), {
        ...updateData,
        updatedAt: Timestamp.fromDate(updateData.updatedAt),
      });
    }
    
    // Update cache
    const cachedTriage = await getCachedData('cachedTriage') as TriageRecord[] || [];
    const triageRecord = cachedTriage.find(t => t.id === triageId);
    if (triageRecord) {
      await cacheData('cachedTriage', { ...triageRecord, ...updateData });
    }
    
    // Create timeline event when triage is completed
    if (status === 'completed' && triageRecord) {
      await createTimelineEvent(triageRecord.patientId, 'triage', {
        triageId,
        level: triageRecord.triageLevel,
        complaint: triageRecord.complaint,
        vitals: triageRecord.vitals,
      });
    }
    
    if (!navigator.onLine || triageId.startsWith('temp_')) {
      await addToSyncQueue({
        type: 'UPDATE_TRIAGE',
        data: { id: triageId, ...updateData },
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    console.error('Error updating triage status:', error);
    throw error;
  }
};

export const getTriageRecords = async (filters?: {
  patientId?: string;
  status?: string;
  nurseId?: string;
}): Promise<TriageRecord[]> => {
  try {
    let cachedTriage = await getCachedData('cachedTriage') as TriageRecord[] || [];
    
    if (navigator.onLine) {
      let q = query(collection(db, 'triage'), orderBy('createdAt', 'desc'));
      
      if (filters?.patientId) {
        q = query(q, where('patientId', '==', filters.patientId));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.nurseId) {
        q = query(q, where('nurseId', '==', filters.nurseId));
      }
      
      const snapshot = await getDocs(q);
      const onlineData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as TriageRecord[];
      
      for (const record of onlineData) {
        await cacheData('cachedTriage', record);
      }
      cachedTriage = onlineData;
    }
    
    // Apply filters to cached data
    if (filters) {
      cachedTriage = cachedTriage.filter(t => {
        if (filters.patientId && t.patientId !== filters.patientId) return false;
        if (filters.status && t.status !== filters.status) return false;
        if (filters.nurseId && t.nurseId !== filters.nurseId) return false;
        return true;
      });
    }
    
    return cachedTriage.sort((a, b) => {
      const urgencyOrder = { emergency: 0, urgent: 1, 'semi-urgent': 2, 'non-urgent': 3 };
      const aUrgency = urgencyOrder[a.triageLevel];
      const bUrgency = urgencyOrder[b.triageLevel];
      
      if (aUrgency !== bUrgency) return aUrgency - bUrgency;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (error) {
    console.error('Error getting triage records:', error);
    return [];
  }
};

export const getTriageById = async (triageId: string): Promise<TriageRecord | null> => {
  try {
    const cachedTriage = await getCachedData('cachedTriage') as TriageRecord[] || [];
    const cached = cachedTriage.find(t => t.id === triageId);
    
    if (cached) return cached;
    
    if (navigator.onLine && !triageId.startsWith('temp_')) {
      const docSnap = await getDoc(doc(db, 'triage', triageId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as TriageRecord;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting triage by ID:', error);
    return null;
  }
};

export const getTriageLevelColor = (level: TriageRecord['triageLevel']): string => {
  switch (level) {
    case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
    case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'semi-urgent': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'non-urgent': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getTriageLevelLabel = (level: TriageRecord['triageLevel']): string => {
  switch (level) {
    case 'emergency': return 'Emergency';
    case 'urgent': return 'Urgent';
    case 'semi-urgent': return 'Semi-Urgent';
    case 'non-urgent': return 'Non-Urgent';
    default: return 'Unknown';
  }
};