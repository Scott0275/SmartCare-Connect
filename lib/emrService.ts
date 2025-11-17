import { queueAction } from './syncService';
import { cacheData, getCachedData } from './offlineDb';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp, collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface Diagnosis {
  id: string;
  patientId: string;
  providerId: string;
  icd10Code: string;
  description: string;
  type: 'differential' | 'final';
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Encounter {
  id: string;
  patientId: string;
  providerId: string;
  providerRole: string;
  timestamp: any;
  type: 'consultation' | 'follow-up' | 'emergency';
  soap: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  locked: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Allergy {
  id: string;
  patientId: string;
  type: 'drug' | 'food' | 'environmental';
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface ChronicCondition {
  id: string;
  patientId: string;
  condition: string;
  diagnosedDate?: any;
  status: 'active' | 'inactive' | 'resolved';
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface TimelineEvent {
  id: string;
  patientId: string;
  type: 'vital' | 'diagnosis' | 'encounter' | 'prescription' | 'lab' | 'imaging' | 'billing' | 'triage';
  title: string;
  description: string;
  timestamp: any;
  providerId?: string;
  data: any;
}

export async function createDiagnosis(patientId: string, providerId: string, diagnosisData: Partial<Diagnosis>) {
  const diagnosisId = uuidv4();
  const diagnosis: Diagnosis = {
    id: diagnosisId,
    patientId,
    providerId,
    icd10Code: diagnosisData.icd10Code || '',
    description: diagnosisData.description || '',
    type: diagnosisData.type || 'differential',
    notes: diagnosisData.notes,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  if (!navigator.onLine) {
    await queueAction('diagnoses', diagnosisId, diagnosis, 'create');
    await cacheData('cachedDiagnoses', diagnosis);
    return diagnosis;
  } else {
    const ref = await addDoc(collection(db, 'diagnoses'), diagnosis);
    const result = { ...diagnosis, id: ref.id };
    await cacheData('cachedDiagnoses', result);
    return result;
  }
}

export async function createEncounter(patientId: string, providerId: string, providerRole: string, encounterData: Partial<Encounter>) {
  const encounterId = uuidv4();
  const encounter: Encounter = {
    id: encounterId,
    patientId,
    providerId,
    providerRole,
    timestamp: Timestamp.now(),
    type: encounterData.type || 'consultation',
    soap: encounterData.soap || { subjective: '', objective: '', assessment: '', plan: '' },
    locked: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  if (!navigator.onLine) {
    await queueAction('encounters', encounterId, encounter, 'create');
    await cacheData('cachedEncounters', encounter);
    return encounter;
  } else {
    const ref = await addDoc(collection(db, 'encounters'), encounter);
    const result = { ...encounter, id: ref.id };
    await cacheData('cachedEncounters', result);
    return result;
  }
}

export async function updateAllergies(patientId: string, allergies: Allergy[]) {
  const updateData = {
    allergies,
    updatedAt: Timestamp.now(),
  };

  if (!navigator.onLine) {
    await queueAction('patients', patientId, updateData, 'update');
    await cacheData('cachedPatients', { id: patientId, ...updateData });
    return updateData;
  } else {
    const ref = doc(db, 'patients', patientId);
    await updateDoc(ref, updateData);
    const snap = await getDoc(ref);
    const result = { id: snap.id, ...snap.data() };
    await cacheData('cachedPatients', result);
    return result;
  }
}

export async function updateChronicConditions(patientId: string, conditions: ChronicCondition[]) {
  const updateData = {
    chronicConditions: conditions,
    updatedAt: Timestamp.now(),
  };

  if (!navigator.onLine) {
    await queueAction('patients', patientId, updateData, 'update');
    await cacheData('cachedPatients', { id: patientId, ...updateData });
    return updateData;
  } else {
    const ref = doc(db, 'patients', patientId);
    await updateDoc(ref, updateData);
    const snap = await getDoc(ref);
    const result = { id: snap.id, ...snap.data() };
    await cacheData('cachedPatients', result);
    return result;
  }
}

export async function getPatientTimeline(patientId: string): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];
  
  try {
    // Get cached data for offline support
    const [vitals, diagnoses, encounters, prescriptions, labRequests, dispensations, bills, triage] = await Promise.all([
      getCachedData('cachedVitals'),
      getCachedData('cachedDiagnoses'),
      getCachedData('cachedEncounters'),
      getCachedData('cachedPrescriptions'),
      getCachedData('cachedLabRequests'),
      getCachedData('cachedDispensations'),
      getCachedData('cachedBilling'),
      getCachedData('cachedTriage'),
    ]);

    // Add vitals to timeline
    (vitals as any[])?.filter(v => v.patientId === patientId).forEach(vital => {
      events.push({
        id: vital.id,
        patientId,
        type: 'vital',
        title: 'Vital Signs Recorded',
        description: `BP: ${vital.bloodPressure || 'N/A'}, Temp: ${vital.temperature || 'N/A'}°C`,
        timestamp: vital.createdAt,
        providerId: vital.nurseId,
        data: vital,
      });
    });

    // Add diagnoses to timeline
    (diagnoses as any[])?.filter(d => d.patientId === patientId).forEach(diagnosis => {
      events.push({
        id: diagnosis.id,
        patientId,
        type: 'diagnosis',
        title: `${diagnosis.type === 'final' ? 'Final' : 'Differential'} Diagnosis`,
        description: `${diagnosis.icd10Code}: ${diagnosis.description}`,
        timestamp: diagnosis.createdAt,
        providerId: diagnosis.providerId,
        data: diagnosis,
      });
    });

    // Add encounters to timeline
    (encounters as any[])?.filter(e => e.patientId === patientId).forEach(encounter => {
      events.push({
        id: encounter.id,
        patientId,
        type: 'encounter',
        title: `${encounter.type.charAt(0).toUpperCase() + encounter.type.slice(1)} Note`,
        description: encounter.soap?.assessment || 'Clinical encounter',
        timestamp: encounter.timestamp,
        providerId: encounter.providerId,
        data: encounter,
      });
    });

    // Add prescriptions to timeline
    (prescriptions as any[])?.filter(p => p.patientId === patientId).forEach(prescription => {
      events.push({
        id: prescription.id,
        patientId,
        type: 'prescription',
        title: 'Prescription Created',
        description: `${prescription.medications?.length || 0} medication(s)`,
        timestamp: prescription.createdAt,
        providerId: prescription.doctorId,
        data: prescription,
      });
    });

    // Add lab requests to timeline
    (labRequests as any[])?.filter(l => l.patientId === patientId).forEach(labRequest => {
      events.push({
        id: labRequest.id,
        patientId,
        type: 'lab',
        title: 'Lab Test Requested',
        description: `${labRequest.tests?.length || 0} test(s) - ${labRequest.status}`,
        timestamp: labRequest.createdAt,
        providerId: labRequest.doctorId,
        data: labRequest,
      });
    });

    // Add dispensations to timeline
    (dispensations as any[])?.filter(d => d.patientId === patientId).forEach(dispensation => {
      events.push({
        id: dispensation.id,
        patientId,
        type: 'prescription',
        title: 'Medication Dispensed',
        description: `${dispensation.medications?.length || 0} medication(s) dispensed`,
        timestamp: dispensation.dispensedAt,
        providerId: dispensation.pharmacistId,
        data: dispensation,
      });
    });

    // Add bills to timeline
    (bills as any[])?.filter(b => b.patientId === patientId).forEach(bill => {
      events.push({
        id: bill.id,
        patientId,
        type: 'billing',
        title: 'Bill Created',
        description: `$${bill.totalAmount?.toFixed(2)} - ${bill.status}`,
        timestamp: bill.createdAt,
        providerId: bill.createdBy,
        data: bill,
      });
    });

    // Add triage to timeline
    (triage as any[])?.filter(t => t.patientId === patientId).forEach(triageRecord => {
      events.push({
        id: triageRecord.id,
        patientId,
        type: 'triage',
        title: `Triage Assessment - ${triageRecord.triageLevel}`,
        description: triageRecord.complaint || 'Triage completed',
        timestamp: triageRecord.createdAt,
        providerId: triageRecord.nurseId,
        data: triageRecord,
      });
    });

    // Sort by timestamp (newest first)
    return events.sort((a, b) => {
      const aTime = a.timestamp?.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp).getTime();
      const bTime = b.timestamp?.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp).getTime();
      return bTime - aTime;
    });

  } catch (error) {
    console.error('Error loading patient timeline:', error);
    return [];
  }
}

export async function lockEncounter(encounterId: string, userId: string) {
  const updateData = {
    locked: true,
    lockedBy: userId,
    lockedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  if (!navigator.onLine) {
    await queueAction('encounters', encounterId, updateData, 'update');
    await cacheData('cachedEncounters', { id: encounterId, ...updateData });
    return { id: encounterId, ...updateData };
  } else {
    const ref = doc(db, 'encounters', encounterId);
    await updateDoc(ref, updateData);
    const snap = await getDoc(ref);
    const result = { id: snap.id, ...snap.data() };
    await cacheData('cachedEncounters', result);
    return result;
  }
}