import { unifiedPatientService } from '@/lib/unified-patient-service';

export async function addPatient(patientData: any) {
  const id = await unifiedPatientService.createPatient(patientData);
  return { id, ...patientData };
}

export async function getPatients() {
  return await unifiedPatientService.getAllPatients();
}

export async function getPatientById(id: string) {
  return await unifiedPatientService.getPatient(id);
}
