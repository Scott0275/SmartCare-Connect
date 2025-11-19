import { createDocument, updateDocument } from './syncEngine';
import { cacheData, getCachedData } from './offlineDb';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { checkNetworkHealth } from './networkService';

export async function createAppointment(appointmentData: any, userId: string) {
  const data = {
    ...appointmentData,
    createdBy: userId,
    createdAt: new Date(),
    status: 'scheduled',
    id: `appointment_${Date.now()}`
  };

  try {
    const docId = await createDocument('appointments', data);
    return docId;
  } catch (error) {
    await cacheData('cachedAppointments', data);
    throw error;
  }
}

export async function getDoctorsList() {
  const online = await checkNetworkHealth();
  
  if (online) {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'doctor'));
      const snapshot = await getDocs(q);
      const doctors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Cache for offline use
      for (const doctor of doctors) {
        await cacheData('cachedUsers', doctor);
      }
      
      return doctors;
    } catch (error) {
      console.error('Error fetching doctors online:', error);
    }
  }
  
  // Fallback to cached data
  try {
    const cached = await getCachedData('cachedUsers') as any[];
    return cached?.filter(user => user.role === 'doctor') || [];
  } catch (error) {
    console.error('Error getting cached doctors:', error);
    return [];
  }
}