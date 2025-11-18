import { addQueuedAction, getQueuedActions, removeQueuedAction, cacheData } from './offlineDb';
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { isOnline } from './networkService';

export async function queueAction(
  collectionName: string,
  docId: string,
  payload: any,
  type: 'create' | 'update' | 'delete'
) {
  const online = await isOnline();
  if (!online) {
    return await addQueuedAction({
      type,
      collection: collectionName,
      docId,
      payload,
      offline: true,
    });
  }
  return null;
}

export async function syncPendingActions(): Promise<{ success: number; conflicts: number; errors: number }> {
  const actions = await getQueuedActions();
  // Only process actions marked as offline
  const offlineActions = actions.filter(action => action.offline === true);
  let success = 0;
  let conflicts = 0;
  let errors = 0;

  for (const action of offlineActions) {
    try {
      const docRef = doc(db, action.collection, action.docId);
      
      if (action.type === 'create') {
        if (action.docId === 'auto') {
          // For auto-generated IDs
          await addDoc(collection(db, action.collection), action.payload);
        } else {
          await setDoc(docRef, action.payload);
        }
        success++;
      } else if (action.type === 'update') {
        const serverDoc = await getDoc(docRef);
        if (serverDoc.exists()) {
          const serverData = serverDoc.data();
          const serverTimestamp = serverData.updatedAt?.toMillis() || 0;
          const offlineTimestamp = action.timestamp;
          
          if (serverTimestamp > offlineTimestamp) {
            // Conflict detected - server data is newer
            await createConflict(action, serverData);
            conflicts++;
          } else {
            await updateDoc(docRef, { ...action.payload, updatedAt: Timestamp.now() });
            success++;
          }
        } else {
          await setDoc(docRef, action.payload);
          success++;
        }
      } else if (action.type === 'delete') {
        await deleteDoc(docRef);
        success++;
      }
      
      // Remove immediately after successful sync
      await removeQueuedAction(action.id);
    } catch (error) {
      console.error('Sync error for action:', action, error);
      errors++;
    }
  }

  return { success, conflicts, errors };
}

async function createConflict(action: any, serverData: any) {
  let conflictCollection = 'conflicts';
  
  if (['inventory', 'prescriptions', 'dispensations'].includes(action.collection)) {
    conflictCollection = 'conflicts/pharmacy';
  } else if (['diagnoses', 'encounters', 'allergies', 'chronicConditions'].includes(action.collection)) {
    conflictCollection = 'conflicts/emr';
  } else if (['appointments', 'doctorAvailability'].includes(action.collection)) {
    conflictCollection = 'conflicts/appointments';
  } else if (['triage'].includes(action.collection)) {
    conflictCollection = 'conflicts/triage';
  } else if (['analytics'].includes(action.collection)) {
    conflictCollection = 'conflicts/analytics';
  }
    
  const conflictRef = doc(collection(db, conflictCollection));
  await setDoc(conflictRef, {
    collection: action.collection,
    docId: action.docId,
    userId: action.userId || 'unknown',
    username: action.username,
    serverData,
    offlineData: action.payload,
    attempts: 1,
    status: 'pending',
    createdAt: Timestamp.now(),
  });
}

export async function executeWithOfflineSupport<T>(
  onlineAction: () => Promise<T>,
  offlineAction: () => Promise<T>
): Promise<T> {
  const online = await isOnline();
  if (online) {
    try {
      const result = await onlineAction();
      return result;
    } catch (error) {
      console.warn('Online action failed, falling back to offline:', error);
      return await offlineAction();
    }
  } else {
    return await offlineAction();
  }
}