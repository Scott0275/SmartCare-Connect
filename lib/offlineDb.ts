import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  queuedActions: {
    key: string;
    value: {
      id: string;
      type: 'create' | 'update' | 'delete';
      collection: string;
      docId: string;
      payload: any;
      timestamp: number;
    };
  };
  cachedPatients: {
    key: string;
    value: any;
  };
  cachedVitals: {
    key: string;
    value: any;
  };
  cachedPrescriptions: {
    key: string;
    value: any;
  };
  cachedBilling: {
    key: string;
    value: any;
  };
  cachedConsultations: {
    key: string;
    value: any;
  };
  cachedLabRequests: {
    key: string;
    value: any;
  };
}

let db: IDBPDatabase<OfflineDB>;

export async function initOfflineDB() {
  if (db) return db;
  
  db = await openDB<OfflineDB>('smartcare-offline', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('queuedActions')) {
        db.createObjectStore('queuedActions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cachedPatients')) {
        db.createObjectStore('cachedPatients', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cachedVitals')) {
        db.createObjectStore('cachedVitals', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cachedPrescriptions')) {
        db.createObjectStore('cachedPrescriptions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cachedBilling')) {
        db.createObjectStore('cachedBilling', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cachedConsultations')) {
        db.createObjectStore('cachedConsultations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cachedLabRequests')) {
        db.createObjectStore('cachedLabRequests', { keyPath: 'id' });
      }
    },
  });
  
  return db;
}

export async function addQueuedAction(action: {
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId: string;
  payload: any;
}) {
  const database = await initOfflineDB();
  const id = `${action.collection}_${action.docId}_${Date.now()}`;
  await database.add('queuedActions', {
    id,
    ...action,
    timestamp: Date.now(),
  });
  return id;
}

export async function getQueuedActions() {
  const database = await initOfflineDB();
  return await database.getAll('queuedActions');
}

export async function removeQueuedAction(id: string) {
  const database = await initOfflineDB();
  await database.delete('queuedActions', id);
}

export async function cacheData(store: keyof OfflineDB, data: any) {
  const database = await initOfflineDB();
  await database.put(store as any, data);
}

export async function getCachedData(store: keyof OfflineDB, id?: string) {
  const database = await initOfflineDB();
  if (id) {
    return await database.get(store as any, id);
  }
  return await database.getAll(store as any);
}

export async function clearCache(store: keyof OfflineDB) {
  const database = await initOfflineDB();
  await database.clear(store as any);
}