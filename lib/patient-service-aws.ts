import { dynamoService } from './dynamodb-service';
import { cacheData, getCachedData } from './offlineDb';

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  doctorId?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory?: string[];
  allergies?: string[];
  chronicConditions?: string[];
  createdAt: string;
  updatedAt: string;
}

export class PatientServiceAWS {
  async createPatient(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = await dynamoService.createDocument('patients', patientData);
      
      // Cache for offline access
      await cacheData('cachedPatients', { id, ...patientData });
      
      return id;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  }

  async getPatient(patientId: string): Promise<Patient | null> {
    try {
      // Try DynamoDB first
      const patient = await dynamoService.getDocument('patients', patientId);
      
      if (patient) {
        // Cache for offline access
        await cacheData('cachedPatients', patient);
        return patient;
      }
      
      // Fallback to cache if offline
      const cachedPatient = await getCachedData('cachedPatients', patientId);
      return cachedPatient || null;
    } catch (error) {
      console.error('Error getting patient:', error);
      
      // Fallback to cache
      const cachedPatient = await getCachedData('cachedPatients', patientId);
      return cachedPatient || null;
    }
  }

  async updatePatient(patientId: string, updates: Partial<Patient>): Promise<void> {
    try {
      await dynamoService.updateDocument('patients', patientId, updates);
      
      // Update cache
      const cachedPatient = await getCachedData('cachedPatients', patientId);
      if (cachedPatient) {
        await cacheData('cachedPatients', { ...cachedPatient, ...updates });
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }

  async deletePatient(patientId: string): Promise<void> {
    try {
      await dynamoService.deleteDocument('patients', patientId);
      
      // Remove from cache
      // Note: IndexedDB doesn't have a direct delete by ID for cached data
      // This would need to be implemented in the offlineDb service
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  }

  async getAllPatients(): Promise<Patient[]> {
    try {
      const patients = await dynamoService.getAllDocuments('patients');
      
      // Cache all patients
      for (const patient of patients) {
        await cacheData('cachedPatients', patient);
      }
      
      return patients;
    } catch (error) {
      console.error('Error getting all patients:', error);
      
      // Fallback to cache
      const cachedPatients = await getCachedData('cachedPatients');
      return Array.isArray(cachedPatients) ? cachedPatients : [];
    }
  }

  async getPatientsByDoctor(doctorId: string): Promise<Patient[]> {
    try {
      const patients = await dynamoService.getPatientsByDoctor(doctorId);
      
      // Cache patients
      for (const patient of patients) {
        await cacheData('cachedPatients', patient);
      }
      
      return patients;
    } catch (error) {
      console.error('Error getting patients by doctor:', error);
      
      // Fallback to cache - filter by doctorId
      const cachedPatients = await getCachedData('cachedPatients');
      if (Array.isArray(cachedPatients)) {
        return cachedPatients.filter(p => p.doctorId === doctorId);
      }
      return [];
    }
  }

  async searchPatients(query: string): Promise<Patient[]> {
    try {
      const allPatients = await this.getAllPatients();
      
      // Simple search implementation
      return allPatients.filter(patient => 
        patient.name.toLowerCase().includes(query.toLowerCase()) ||
        patient.email.toLowerCase().includes(query.toLowerCase()) ||
        (patient.phone && patient.phone.includes(query))
      );
    } catch (error) {
      console.error('Error searching patients:', error);
      return [];
    }
  }
}

export const patientServiceAWS = new PatientServiceAWS();