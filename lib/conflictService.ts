import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getConflicts(filters: {
  status?: string;
  collection?: string;
  limit?: number;
  cursor?: any;
}) {
  let q = query(collection(db, "conflicts"));
  
  if (filters.status) {
    q = query(q, where("status", "==", filters.status));
  }
  if (filters.collection) {
    q = query(q, where("collection", "==", filters.collection));
  }
  
  q = query(q, orderBy("createdAt", "desc"));
  
  if (filters.limit) {
    q = query(q, limit(filters.limit));
  }
  if (filters.cursor) {
    q = query(q, startAfter(filters.cursor));
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getConflictById(conflictId: string) {
  const ref = doc(db, "conflicts", conflictId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function resolveConflict(
  conflictId: string,
  resolutionType: "apply" | "merge" | "ignore",
  mergedData?: any,
  note?: string,
  adminId?: string
) {
  const conflictRef = doc(db, "conflicts", conflictId);
  const conflictSnap = await getDoc(conflictRef);
  
  if (!conflictSnap.exists()) {
    throw new Error("Conflict not found");
  }
  
  const conflict = conflictSnap.data();
  
  // Update target document if applying changes
  if (resolutionType === "apply" || resolutionType === "merge") {
    const targetRef = doc(db, conflict.collection, conflict.docId);
    const dataToApply = resolutionType === "merge" ? mergedData : conflict.offlineData;
    await updateDoc(targetRef, { ...dataToApply, updatedAt: Timestamp.now() });
  }
  
  // Update conflict status
  await updateDoc(conflictRef, {
    status: "resolved",
    resolvedBy: adminId,
    resolvedAt: Timestamp.now(),
    resolutionNote: note,
  });
  
  // Create audit log
  await addDoc(collection(db, "auditLogs"), {
    action: `conflict-${resolutionType}`,
    actorId: adminId,
    targetCollection: conflict.collection,
    targetDocId: conflict.docId,
    before: conflict.serverData,
    after: resolutionType === "ignore" ? conflict.serverData : (mergedData || conflict.offlineData),
    note,
    createdAt: Timestamp.now(),
  });
  
  // Create notification for user
  if (conflict.userId) {
    await addDoc(collection(db, "notifications", conflict.userId, "items"), {
      title: "Conflict Resolved",
      body: `Your offline changes to ${conflict.collection} have been ${resolutionType === "ignore" ? "reviewed" : "applied"}.`,
      read: false,
      data: { conflictId, type: "conflict-resolved" },
      createdAt: Timestamp.now(),
    });
  }
  
  return { success: true };
}