import { queueAction } from './syncService';
import { cacheData, getCachedData } from './offlineDb';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp, collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  medications: Medication[];
  status: 'pending' | 'accepted' | 'in_progress' | 'ready_for_pickup' | 'dispensed' | 'declined';
  pharmacistId?: string;
  notes?: string;
  createdAt: any;
  acceptedAt?: any;
  dispensedAt?: any;
  updatedAt: any;
}

export interface InventoryItem {
  id: string;
  name: string;
  genericName?: string;
  manufacturer?: string;
  batchNumber?: string;
  expiryDate?: any;
  currentStock: number;
  reorderLevel: number;
  unitPrice: number;
  createdAt: any;
  updatedAt: any;
}

export interface DispensationRecord {
  id: string;
  prescriptionId: string;
  patientId: string;
  pharmacistId: string;
  medications: {
    medicationId: string;
    name: string;
    quantityDispensed: number;
    quantityPrescribed: number;
    notes?: string;
    substitution?: string;
  }[];
  dispensedAt: any;
  notes?: string;
}

export async function getPrescriptions(status?: string) {
  if (navigator.onLine) {
    try {
      let q = query(collection(db, 'prescriptions'), orderBy('createdAt', 'desc'));
      if (status) {
        q = query(collection(db, 'prescriptions'), where('status', '==', status), orderBy('createdAt', 'desc'));
      }
      const snap = await getDocs(q);
      const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      for (const prescription of results) {
        await cacheData('cachedPrescriptions', prescription);
      }
      return results;
    } catch (error) {
      console.error('Online prescriptions fetch failed, using cache:', error);
    }
  }
  
  const cached = await getCachedData('cachedPrescriptions') as Prescription[];
  if (!cached) return [];
  
  return status ? cached.filter(p => p.status === status) : cached;
}

export async function acceptPrescription(prescriptionId: string, pharmacistId: string) {
  const updateData = {
    status: 'accepted',
    pharmacistId,
    acceptedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  if (!navigator.onLine) {
    await queueAction('prescriptions', prescriptionId, updateData, 'update');
    await cacheData('cachedPrescriptions', { id: prescriptionId, ...updateData });
    return { id: prescriptionId, ...updateData };
  } else {
    const ref = doc(db, 'prescriptions', prescriptionId);
    await updateDoc(ref, updateData);
    const snap = await getDoc(ref);
    const result = { id: snap.id, ...snap.data() };
    await cacheData('cachedPrescriptions', result);
    return result;
  }
}

export async function updatePrescriptionStatus(prescriptionId: string, status: string, additionalData?: any) {
  const updateData = {
    status,
    updatedAt: Timestamp.now(),
    ...additionalData,
  };

  if (!navigator.onLine) {
    await queueAction('prescriptions', prescriptionId, updateData, 'update');
    await cacheData('cachedPrescriptions', { id: prescriptionId, ...updateData });
    return { id: prescriptionId, ...updateData };
  } else {
    const ref = doc(db, 'prescriptions', prescriptionId);
    await updateDoc(ref, updateData);
    const snap = await getDoc(ref);
    const result = { id: snap.id, ...snap.data() };
    await cacheData('cachedPrescriptions', result);
    return result;
  }
}

export async function dispensePrescription(prescriptionId: string, pharmacistId: string, dispensationData: any) {
  const updateData = {
    status: 'dispensed',
    dispensedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const dispensationRecord: DispensationRecord = {
    id: uuidv4(),
    prescriptionId,
    patientId: dispensationData.patientId,
    pharmacistId,
    medications: dispensationData.medications,
    dispensedAt: Timestamp.now(),
    notes: dispensationData.notes,
  };

  if (!navigator.onLine) {
    await queueAction('prescriptions', prescriptionId, updateData, 'update');
    await queueAction('dispensations', dispensationRecord.id, dispensationRecord, 'create');
    await cacheData('cachedPrescriptions', { id: prescriptionId, ...updateData });
    await cacheData('cachedDispensations', dispensationRecord);
    return { prescription: { id: prescriptionId, ...updateData }, dispensation: dispensationRecord };
  } else {
    const prescriptionRef = doc(db, 'prescriptions', prescriptionId);
    await updateDoc(prescriptionRef, updateData);
    
    await addDoc(collection(db, 'dispensations'), dispensationRecord);
    
    const snap = await getDoc(prescriptionRef);
    const result = { id: snap.id, ...snap.data() };
    await cacheData('cachedPrescriptions', result);
    await cacheData('cachedDispensations', dispensationRecord);
    
    return { prescription: result, dispensation: dispensationRecord };
  }
}

export async function getInventory() {
  if (navigator.onLine) {
    try {
      const q = query(collection(db, 'inventory'), orderBy('name'));
      const snap = await getDocs(q);
      const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      for (const item of results) {
        await cacheData('cachedInventory', item);
      }
      return results;
    } catch (error) {
      console.error('Online inventory fetch failed, using cache:', error);
    }
  }
  
  const cached = await getCachedData('cachedInventory') as InventoryItem[];
  return cached || [];
}

export async function updateInventoryStock(itemId: string, newStock: number, reason: string) {
  const updateData = {
    currentStock: newStock,
    updatedAt: Timestamp.now(),
  };

  const logEntry = {
    id: uuidv4(),
    itemId,
    previousStock: 0, // Will be filled from current data
    newStock,
    reason,
    timestamp: Timestamp.now(),
  };

  if (!navigator.onLine) {
    await queueAction('inventory', itemId, updateData, 'update');
    await queueAction('inventoryLogs', logEntry.id, logEntry, 'create');
    await cacheData('cachedInventory', { id: itemId, ...updateData });
    return { id: itemId, ...updateData };
  } else {
    const ref = doc(db, 'inventory', itemId);
    const currentSnap = await getDoc(ref);
    if (currentSnap.exists()) {
      logEntry.previousStock = currentSnap.data().currentStock || 0;
    }
    
    await updateDoc(ref, updateData);
    await addDoc(collection(db, 'inventoryLogs'), logEntry);
    
    const snap = await getDoc(ref);
    const result = { id: snap.id, ...snap.data() };
    await cacheData('cachedInventory', result);
    return result;
  }
}