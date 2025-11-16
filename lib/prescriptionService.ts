import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function createPrescription(patientId: string, doctorId: string, data: any) {
  const payload = {
    patientId,
    doctorId,
    diagnosis: data.diagnosis,
    medications: data.medications,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const ref = await addDoc(collection(db, "prescriptions"), payload);
  return { id: ref.id, ...payload };
}

export async function getPrescriptionById(prescriptionId: string) {
  const ref = doc(db, "prescriptions", prescriptionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getPrescriptionsForPatient(patientId: string) {
  const q = query(
    collection(db, "prescriptions"),
    where("patientId", "==", patientId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updatePrescription(prescriptionId: string, updatedData: any) {
  const ref = doc(db, "prescriptions", prescriptionId);
  const payload = { ...updatedData, updatedAt: Timestamp.now() };
  await updateDoc(ref, payload);
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() };
}

export async function deletePrescription(prescriptionId: string) {
  const ref = doc(db, "prescriptions", prescriptionId);
  await deleteDoc(ref);
  return { id: prescriptionId };
}