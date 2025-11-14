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

// Billing design: billing collection stores bill metadata.
// Each bill has a subcollection `items` for line items to avoid array concurrency issues.

export async function createBill(patientId: string, createdBy: string, items: any[]) {
  const totalAmount = items.reduce((s, it) => s + (it.total || it.cost * it.quantity || 0), 0);
  const payload = {
    patientId,
    createdBy,
    totalAmount,
    status: "unpaid",
    createdAt: Timestamp.now(),
  } as any;

  const billRef = await addDoc(collection(db, "billing"), payload);

  // add items to subcollection
  const itemsCol = collection(db, "billing", billRef.id, "items");
  const added: any[] = [];
  for (const it of items) {
    const itemPayload = { ...it, createdAt: Timestamp.now() };
    const r = await addDoc(itemsCol, itemPayload);
    added.push({ id: r.id, ...itemPayload });
  }

  return { id: billRef.id, ...payload, items: added };
}

export async function addItemToBill(billId: string, item: any) {
  const billRef = doc(db, "billing", billId);
  const billSnap = await getDoc(billRef);
  if (!billSnap.exists()) throw new Error("Bill not found");

  const itemsCol = collection(db, "billing", billId, "items");
  const itemPayload = { ...item, createdAt: Timestamp.now() };
  const r = await addDoc(itemsCol, itemPayload);

  // update totalAmount on bill
  const currentTotal = (billSnap.data() as any).totalAmount || 0;
  const addAmount = itemPayload.total || itemPayload.cost * itemPayload.quantity || 0;
  const newTotal = currentTotal + addAmount;
  await updateDoc(billRef, { totalAmount: newTotal });

  return { id: r.id, ...itemPayload, totalAmount: newTotal };
}

export async function updateBillItem(billId: string, itemId: string, updatedItem: any) {
  const itemRef = doc(db, "billing", billId, "items", itemId);
  const itemSnap = await getDoc(itemRef);
  if (!itemSnap.exists()) throw new Error("Item not found");

  await updateDoc(itemRef, { ...updatedItem });

  // recompute total
  const itemsSnap = await getDocs(collection(db, "billing", billId, "items"));
  const items = itemsSnap.docs.map((d) => d.data() as any);
  const totalAmount = items.reduce((s: number, it: any) => s + (it.total || it.cost * it.quantity || 0), 0);
  await updateDoc(doc(db, "billing", billId), { totalAmount });

  return { id: itemId, ...updatedItem, totalAmount };
}

export async function deleteBillItem(billId: string, itemId: string) {
  const itemRef = doc(db, "billing", billId, "items", itemId);
  const itemSnap = await getDoc(itemRef);
  if (!itemSnap.exists()) throw new Error("Item not found");
  await deleteDoc(itemRef);

  // recompute total
  const itemsSnap = await getDocs(collection(db, "billing", billId, "items"));
  const items = itemsSnap.docs.map((d) => d.data() as any);
  const totalAmount = items.reduce((s: number, it: any) => s + (it.total || it.cost * it.quantity || 0), 0);
  await updateDoc(doc(db, "billing", billId), { totalAmount });

  return { id: billId, totalAmount };
}

export async function markBillAsPaid(billId: string) {
  const ref = doc(db, "billing", billId);
  await updateDoc(ref, { status: "paid" });
  const snap = await getDoc(ref);
  return { id: billId, ...(snap.data() as any) };
}

export async function getBillsForPatient(patientId: string) {
  const q = query(collection(db, "billing"), where("patientId", "==", patientId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function getBillById(billId: string) {
  const ref = doc(db, "billing", billId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const bill = { id: snap.id, ...(snap.data() as any) };
  // load items
  const itemsSnap = await getDocs(query(collection(db, "billing", billId, "items"), orderBy("createdAt", "desc")));
  const items = itemsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  return { ...bill, items };
}
