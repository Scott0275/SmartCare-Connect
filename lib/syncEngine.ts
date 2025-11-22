import { db, auth } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs } from 'firebase/firestore';
import { initOfflineDB, addQueuedAction, getQueuedActions, removeQueuedAction, cacheData } from './offlineDb';
import { checkNetworkHealth, isOnline } from './networkService';
import { syncPendingActionsAWS, checkAWSHealth } from './sync-engine-aws';

const useAWS = process.env.NEXT_PUBLIC_USE_AWS === 'true';

export async function executeWithOnlineFirst<T>(
  operation: () => Promise<T>,
  fallbackData: {
    collection: string;
    docId: string;
    payload: any;
    type: 'create' | 'update' | 'delete';
  }
): Promise<T> {
  // Check if Firebase is available
  if (!db || !auth) {
    console.warn('Firebase not initialized, queuing for offline');
    await addQueuedAction(fallbackData);
    throw new Error('Firebase not available - operation queued for sync');
  }

  // Check if user is authenticated
  if (!auth.currentUser) {
    console.warn('User not authenticated, queuing for offline');
    await addQueuedAction(fallbackData);
    throw new Error('User not authenticated - operation queued for sync');
  }

  const online = await checkNetworkHealth();
  
  if (online) {
    try {
      console.log(`Attempting online operation: ${fallbackData.type} on ${fallbackData.collection}`);
      const result = await operation();
      console.log(`Online operation successful: ${fallbackData.type} on ${fallbackData.collection}`);
      return result;
    } catch (error) {
      console.error('Online operation failed:', error);
      console.warn('Falling back to offline queue');
    }
  }
  
  // Fallback to offline
  await addQueuedAction(fallbackData);
  throw new Error('Operation queued for sync when online');
}

export async function createDocument(collectionName: string, data: any) {
  return executeWithOnlineFirst(
    async () => {
      // Remove the custom id from data before sending to Firestore
      const { id, ...firestoreData } = data;
      const docRef = await addDoc(collection(db, collectionName), firestoreData);
      const finalData = { id: docRef.id, ...firestoreData };
      await cacheData(`cached${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)}` as any, finalData);
      return docRef.id;
    },
    {
      collection: collectionName,
      docId: data.id || `temp_${Date.now()}`,
      payload: data,
      type: 'create'
    }
  );
}

export async function updateDocument(collectionName: string, docId: string, data: any) {
  return executeWithOnlineFirst(
    async () => {
      await updateDoc(doc(db, collectionName, docId), data);
      await cacheData(`cached${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)}` as any, { id: docId, ...data });
      return true;
    },
    {
      collection: collectionName,
      docId,
      payload: data,
      type: 'update'
    }
  );
}

export async function deleteDocument(collectionName: string, docId: string) {
  return executeWithOnlineFirst(
    async () => {
      await deleteDoc(doc(db, collectionName, docId));
      return true;
    },
    {
      collection: collectionName,
      docId,
      payload: {},
      type: 'delete'
    }
  );
}

export async function syncPendingActions() {
  if (useAWS) {
    if (!await checkAWSHealth()) {
      throw new Error('No AWS connection');
    }
    return await syncPendingActionsAWS();
  } else {
    if (!await checkNetworkHealth()) {
      throw new Error('No network connection');
    }

    const actions = await getQueuedActions();
    const results = [];

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'create':
            if (action.docId.startsWith('temp_')) {
              const docRef = await addDoc(collection(db, action.collection), action.payload);
              await cacheData(`cached${action.collection.charAt(0).toUpperCase() + action.collection.slice(1)}` as any, { id: docRef.id, ...action.payload });
            } else {
              await updateDoc(doc(db, action.collection, action.docId), action.payload);
            }
            break;
          case 'update':
            await updateDoc(doc(db, action.collection, action.docId), action.payload);
            break;
          case 'delete':
            await deleteDoc(doc(db, action.collection, action.docId));
            break;
        }
        
        await removeQueuedAction(action.id);
        results.push({ success: true, action: action.id });
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        results.push({ success: false, action: action.id, error });
      }
    }

    return results;
  }
}