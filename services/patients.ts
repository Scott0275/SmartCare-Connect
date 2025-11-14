import { collection, addDoc, getDocs, query, orderBy, doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function addPatient(patientData: any) {
  const col = collection(db, "patients");
  const data = { ...patientData, createdAt: Timestamp.now() };
  const ref = await addDoc(col, data);
  return { id: ref.id, ...data };
}

export async function getPatients() {
  const col = collection(db, "patients");
  const q = query(col, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function getPatientById(id: string) {
  const ref = doc(db, "patients", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) };
}
