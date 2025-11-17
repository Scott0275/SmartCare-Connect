import { queueAction } from './syncService';
import { cacheData, getCachedData } from './offlineDb';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp, collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  reason: string;
  type: 'consultation' | 'follow-up' | 'emergency' | 'telemedicine';
  status: 'pending' | 'approved' | 'cancelled' | 'completed' | 'no-show';
  scheduledFor: any;
  duration: number; // minutes
  notes?: string;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

export interface DoctorAvailability {
  id: string;
  doctorId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isAvailable: boolean;
  createdAt: any;
  updatedAt: any;
}

export async function createAppointment(appointmentData: Partial<Appointment>) {
  const appointmentId = uuidv4();
  const appointment: Appointment = {
    id: appointmentId,
    patientId: appointmentData.patientId || '',
    doctorId: appointmentData.doctorId || '',
    reason: appointmentData.reason || '',
    type: appointmentData.type || 'consultation',
    status: 'pending',
    scheduledFor: appointmentData.scheduledFor || Timestamp.now(),
    duration: appointmentData.duration || 30,
    notes: appointmentData.notes,
    createdBy: appointmentData.createdBy || '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  if (!navigator.onLine) {
    await queueAction('appointments', appointmentId, appointment, 'create');
    await cacheData('cachedAppointments', appointment);
    return appointment;
  } else {
    const ref = await addDoc(collection(db, 'appointments'), appointment);
    const result = { ...appointment, id: ref.id };
    await cacheData('cachedAppointments', result);
    return result;
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: string, additionalData?: any) {
  const updateData = {
    status,
    updatedAt: Timestamp.now(),
    ...additionalData,
  };

  if (!navigator.onLine) {
    await queueAction('appointments', appointmentId, updateData, 'update');
    await cacheData('cachedAppointments', { id: appointmentId, ...updateData });
    return { id: appointmentId, ...updateData };
  } else {
    const ref = doc(db, 'appointments', appointmentId);
    await updateDoc(ref, updateData);
    const snap = await getDoc(ref);
    const result = { id: snap.id, ...snap.data() };
    await cacheData('cachedAppointments', result);
    return result;
  }
}

export async function getAppointments(filters?: { doctorId?: string; patientId?: string; status?: string; date?: Date }) {
  if (navigator.onLine) {
    try {
      let q = query(collection(db, 'appointments'), orderBy('scheduledFor', 'asc'));
      
      if (filters?.doctorId) {
        q = query(collection(db, 'appointments'), where('doctorId', '==', filters.doctorId), orderBy('scheduledFor', 'asc'));
      }
      if (filters?.patientId) {
        q = query(collection(db, 'appointments'), where('patientId', '==', filters.patientId), orderBy('scheduledFor', 'asc'));
      }
      
      const snap = await getDocs(q);
      const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      for (const appointment of results) {
        await cacheData('cachedAppointments', appointment);
      }
      return results;
    } catch (error) {
      console.error('Online appointments fetch failed, using cache:', error);
    }
  }
  
  const cached = await getCachedData('cachedAppointments') as Appointment[];
  if (!cached) return [];
  
  let filtered = cached;
  if (filters?.doctorId) filtered = filtered.filter(a => a.doctorId === filters.doctorId);
  if (filters?.patientId) filtered = filtered.filter(a => a.patientId === filters.patientId);
  if (filters?.status) filtered = filtered.filter(a => a.status === filters.status);
  
  return filtered.sort((a, b) => {
    const aTime = a.scheduledFor?.toMillis ? a.scheduledFor.toMillis() : new Date(a.scheduledFor).getTime();
    const bTime = b.scheduledFor?.toMillis ? b.scheduledFor.toMillis() : new Date(b.scheduledFor).getTime();
    return aTime - bTime;
  });
}

export async function setDoctorAvailability(doctorId: string, availability: Partial<DoctorAvailability>[]) {
  const availabilityData = availability.map(slot => ({
    id: uuidv4(),
    doctorId,
    ...slot,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }));

  if (!navigator.onLine) {
    for (const slot of availabilityData) {
      await queueAction('doctorAvailability', slot.id, slot, 'create');
      await cacheData('cachedAvailability', slot);
    }
    return availabilityData;
  } else {
    const results = [];
    for (const slot of availabilityData) {
      const ref = await addDoc(collection(db, 'doctorAvailability'), slot);
      const result = { ...slot, id: ref.id };
      await cacheData('cachedAvailability', result);
      results.push(result);
    }
    return results;
  }
}

export async function getDoctorAvailability(doctorId: string) {
  if (navigator.onLine) {
    try {
      const q = query(
        collection(db, 'doctorAvailability'),
        where('doctorId', '==', doctorId),
        where('isAvailable', '==', true)
      );
      const snap = await getDocs(q);
      const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      for (const availability of results) {
        await cacheData('cachedAvailability', availability);
      }
      return results;
    } catch (error) {
      console.error('Online availability fetch failed, using cache:', error);
    }
  }
  
  const cached = await getCachedData('cachedAvailability') as DoctorAvailability[];
  return cached?.filter(a => a.doctorId === doctorId && a.isAvailable) || [];
}

export async function rescheduleAppointment(appointmentId: string, newDateTime: Date, reason?: string) {
  const updateData = {
    scheduledFor: Timestamp.fromDate(newDateTime),
    rescheduleReason: reason,
    updatedAt: Timestamp.now(),
  };

  if (!navigator.onLine) {
    await queueAction('appointments', appointmentId, updateData, 'update');
    await cacheData('cachedAppointments', { id: appointmentId, ...updateData });
    return { id: appointmentId, ...updateData };
  } else {
    const ref = doc(db, 'appointments', appointmentId);
    await updateDoc(ref, updateData);
    const snap = await getDoc(ref);
    const result = { id: snap.id, ...snap.data() };
    await cacheData('cachedAppointments', result);
    return result;
  }
}