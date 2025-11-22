import { patientServiceAWS } from './patient-service-aws';
import { db } from './firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where } from 'firebase/firestore';

const useAWS = process.env.NEXT_PUBLIC_USE_AWS === 'true';

export class UnifiedPatientService {
  async createPatient(patientData: any): Promise<string> {
    if (useAWS) {
      return await patientServiceAWS.createPatient(patientData);
    } else {
      // Firebase implementation
      const docRef = await addDoc(collection(db, 'patients'), patientData);
      return docRef.id;
    }
  }

  async getPatient(patientId: string): Promise<any> {
    if (useAWS) {
      return await patientServiceAWS.getPatient(patientId);
    } else {
      // Firebase implementation
      const docRef = doc(db, 'patients', patientId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    }
  }

  async updatePatient(patientId: string, updates: any): Promise<void> {
    if (useAWS) {
      await patientServiceAWS.updatePatient(patientId, updates);
    } else {
      // Firebase implementation
      const docRef = doc(db, 'patients', patientId);
      await updateDoc(docRef, updates);
    }
  }

  async deletePatient(patientId: string): Promise<void> {
    if (useAWS) {
      await patientServiceAWS.deletePatient(patientId);
    } else {
      // Firebase implementation
      const docRef = doc(db, 'patients', patientId);
      await deleteDoc(docRef);
    }
  }

  async getAllPatients(): Promise<any[]> {
    if (useAWS) {
      return await patientServiceAWS.getAllPatients();
    } else {
      // Firebase implementation
      const querySnapshot = await getDocs(collection(db, 'patients'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  }

  async getPatientsByDoctor(doctorId: string): Promise<any[]> {
    if (useAWS) {
      return await patientServiceAWS.getPatientsByDoctor(doctorId);
    } else {
      // Firebase implementation
      const q = query(collection(db, 'patients'), where('doctorId', '==', doctorId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  }

  async searchPatients(searchQuery: string): Promise<any[]> {
    if (useAWS) {
      return await patientServiceAWS.searchPatients(searchQuery);
    } else {
      // Firebase implementation - basic search
      const allPatients = await this.getAllPatients();
      return allPatients.filter(patient => 
        patient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  }
}

export const unifiedPatientService = new UnifiedPatientService();