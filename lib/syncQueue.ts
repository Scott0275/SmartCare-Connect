import { getCachedData, cacheData } from './offlineDb';

export interface SyncQueueItem {
  id: string;
  type: string;
  data: any;
  tempId?: string;
  timestamp: number;
  retries?: number;
}

export const addToSyncQueue = async (item: Omit<SyncQueueItem, 'id' | 'retries'>): Promise<void> => {
  const queue = await getCachedData('syncQueue') as SyncQueueItem[] || [];
  const queueItem: SyncQueueItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    retries: 0,
    ...item,
  };
  await cacheData('syncQueue', queueItem);
};

export const getSyncQueue = async (): Promise<SyncQueueItem[]> => {
  return await getCachedData('syncQueue') as SyncQueueItem[] || [];
};

export const removeSyncQueueItem = async (itemId: string): Promise<void> => {
  // Implementation would need to be handled differently with individual cache items
  console.log('Remove sync queue item:', itemId);
};

export const updateSyncQueueItem = async (itemId: string, updates: Partial<SyncQueueItem>): Promise<void> => {
  const queue = await getCachedData('syncQueue') as SyncQueueItem[] || [];
  const item = queue.find(i => i.id === itemId);
  if (item) {
    await cacheData('syncQueue', { ...item, ...updates });
  }
};