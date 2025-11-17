import { getQueuedActions } from './offlineDb';

export async function hasPendingSyncItems(): Promise<boolean> {
  try {
    const actions = await getQueuedActions();
    // Only count offline actions
    const offlineActions = actions.filter(action => action.offline === true);
    return offlineActions.length > 0;
  } catch (error) {
    console.error('Error checking pending sync items:', error);
    return false;
  }
}

export async function getPendingSyncCount(): Promise<number> {
  try {
    const actions = await getQueuedActions();
    // Only count offline actions
    const offlineActions = actions.filter(action => action.offline === true);
    return offlineActions.length;
  } catch (error) {
    console.error('Error getting pending sync count:', error);
    return 0;
  }
}