import { dynamoService } from './dynamodb-service';
import { initOfflineDB, addQueuedAction, getQueuedActions, removeQueuedAction, cacheData } from './offlineDb';

export async function executeWithOnlineFirstAWS<T>(
  operation: () => Promise<T>,
  fallbackData: {
    collection: string;
    docId: string;
    payload: any;
    type: 'create' | 'update' | 'delete';
  }
): Promise<T> {
  try {
    console.log(`Attempting AWS operation: ${fallbackData.type} on ${fallbackData.collection}`);
    const result = await operation();
    console.log(`AWS operation successful: ${fallbackData.type} on ${fallbackData.collection}`);
    return result;
  } catch (error) {
    console.error('AWS operation failed:', error);
    console.warn('Falling back to offline queue');
    
    // Fallback to offline
    await addQueuedAction(fallbackData);
    throw new Error('Operation queued for sync when online');
  }
}

export async function createDocumentAWS(collection: string, data: any) {
  return executeWithOnlineFirstAWS(
    async () => {
      const id = await dynamoService.createDocument(collection, data);
      const finalData = { id, ...data };
      await cacheData(`cached${collection.charAt(0).toUpperCase() + collection.slice(1)}` as any, finalData);
      return id;
    },
    {
      collection,
      docId: data.id || `temp_${Date.now()}`,
      payload: data,
      type: 'create'
    }
  );
}

export async function updateDocumentAWS(collection: string, docId: string, data: any) {
  return executeWithOnlineFirstAWS(
    async () => {
      await dynamoService.updateDocument(collection, docId, data);
      await cacheData(`cached${collection.charAt(0).toUpperCase() + collection.slice(1)}` as any, { id: docId, ...data });
      return true;
    },
    {
      collection,
      docId,
      payload: data,
      type: 'update'
    }
  );
}

export async function deleteDocumentAWS(collection: string, docId: string) {
  return executeWithOnlineFirstAWS(
    async () => {
      await dynamoService.deleteDocument(collection, docId);
      return true;
    },
    {
      collection,
      docId,
      payload: {},
      type: 'delete'
    }
  );
}

export async function syncPendingActionsAWS() {
  const actions = await getQueuedActions();
  const results = [];

  for (const action of actions) {
    try {
      switch (action.type) {
        case 'create':
          if (action.docId.startsWith('temp_')) {
            const id = await dynamoService.createDocument(action.collection, action.payload);
            await cacheData(`cached${action.collection.charAt(0).toUpperCase() + action.collection.slice(1)}` as any, { id, ...action.payload });
          } else {
            await dynamoService.updateDocument(action.collection, action.docId, action.payload);
          }
          break;
        case 'update':
          await dynamoService.updateDocument(action.collection, action.docId, action.payload);
          break;
        case 'delete':
          await dynamoService.deleteDocument(action.collection, action.docId);
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

// Network health check for AWS services
export async function checkAWSHealth(): Promise<boolean> {
  try {
    // Simple health check by trying to get a non-existent item
    await dynamoService.getDocument('patients', 'health-check');
    return true;
  } catch (error) {
    // If we get a network error, we're offline
    // If we get a "not found" error, we're online
    return !error.message.includes('NetworkingError');
  }
}