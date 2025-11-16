import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  startAfter,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getAuditLogs(filters: {
  action?: string;
  actorId?: string;
  limit?: number;
  cursor?: any;
}) {
  let q = query(collection(db, "auditLogs"));
  
  if (filters.action) {
    q = query(q, where("action", "==", filters.action));
  }
  if (filters.actorId) {
    q = query(q, where("actorId", "==", filters.actorId));
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