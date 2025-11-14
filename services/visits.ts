import { collection, addDoc, getDocs, query, orderBy, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function addVisit(visitData: any) {
  const col = collection(db, "visits");
  const data = { ...visitData, createdAt: Timestamp.now() };
  const ref = await addDoc(col, data);
  return { id: ref.id, ...data };
}

export async function getVisitsByPatient(patientId: string) {
  const col = collection(db, "visits");
  const q = query(col, where("patientId", "==", patientId), orderBy("createdAt", "desc"));
  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  } catch (err: any) {
    console.warn("Ordered visits query failed (may need index). Falling back to unindexed query.", err?.message || err);
    // If the ordered query fails (likely because a composite index is required),
    // fall back to a where-only query (no order) and sort client-side.
    try {
      const snap = await getDocs(query(col, where("patientId", "==", patientId)));
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      // sort by createdAt descending (handle Firestore Timestamp)
      items.sort((a: any, b: any) => {
        const aMs = a.createdAt && typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
        const bMs = b.createdAt && typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
        return bMs - aMs;
      });
      return items;
    } catch (innerErr: any) {
      console.error("Fallback unindexed visits query also failed:", innerErr);
      // Re-throw original error message so callers can show the index creation link
      throw new Error(err?.message || innerErr?.message || "Error querying visits");
    }
  }
}
