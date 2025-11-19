import { createDocument, updateDocument } from './syncEngine';
import { cacheData, getCachedData } from './offlineDb';

export async function createTriage(triageData: any, userId: string) {
  const data = {
    ...triageData,
    createdBy: userId,
    createdAt: new Date(),
    status: 'pending',
    id: `triage_${Date.now()}`
  };

  try {
    const docId = await createDocument('triage', data);
    return docId;
  } catch (error) {
    await cacheData('cachedTriage', data);
    throw error;
  }
}

export async function updateTriageStatus(triageId: string, status: string, userId: string) {
  const updateData = {
    status,
    updatedBy: userId,
    updatedAt: new Date()
  };

  try {
    await updateDocument('triage', triageId, updateData);
    return true;
  } catch (error) {
    throw error;
  }
}

export async function getTriageList() {
  try {
    const cached = await getCachedData('cachedTriage') as any[];
    return cached || [];
  } catch (error) {
    console.error('Error getting triage list:', error);
    return [];
  }
}

export async function getTriageRecords() {
  return getTriageList();
}

export async function getTriageById(triageId: string) {
  try {
    const cached = await getCachedData('cachedTriage', triageId);
    return cached;
  } catch (error) {
    console.error('Error getting triage:', error);
    return null;
  }
}

export function getTriageLevelColor(level: number): string {
  switch (level) {
    case 1: return 'bg-red-500';
    case 2: return 'bg-orange-500';
    case 3: return 'bg-yellow-500';
    case 4: return 'bg-green-500';
    case 5: return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
}

export function getTriageLevelLabel(level: number): string {
  switch (level) {
    case 1: return 'Critical';
    case 2: return 'Urgent';
    case 3: return 'Less Urgent';
    case 4: return 'Non-Urgent';
    case 5: return 'Routine';
    default: return 'Unknown';
  }
}