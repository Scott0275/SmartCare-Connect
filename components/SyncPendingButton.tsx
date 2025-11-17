"use client";
import React, { useState, useEffect } from 'react';
import { syncPendingActions } from '@/lib/syncService';
import { getQueuedActions } from '@/lib/offlineDb';
import toast from 'react-hot-toast';

export default function SyncPendingButton() {
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadPendingCount();
    const interval = setInterval(loadPendingCount, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPendingCount = async () => {
    try {
      const actions = await getQueuedActions();
      // Only count offline actions
      const offlineActions = actions.filter(action => action.offline === true);
      setPendingCount(offlineActions.length);
    } catch (error) {
      console.error('Error loading pending count:', error);
    }
  };

  const handleSync = async () => {
    if (!navigator.onLine) {
      toast.error('Cannot sync while offline');
      return;
    }

    setSyncing(true);
    try {
      const result = await syncPendingActions();
      
      if (result.conflicts > 0) {
        toast.error(`⚠ ${result.conflicts} conflicts detected. Check admin panel.`);
      } else if (result.errors > 0) {
        toast.error(`❌ ${result.errors} sync errors occurred`);
      } else if (result.success > 0) {
        toast.success(`✔ Synced ${result.success} items successfully`);
        await loadPendingCount(); // Refresh count
      } else {
        toast.success('✔ No pending actions to sync');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('❌ Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  // Don't show button if no pending actions
  if (pendingCount === 0) {
    return null;
  }

  return (
    <button
      onClick={handleSync}
      disabled={syncing || !navigator.onLine}
      className="bg-orange-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50 flex items-center space-x-2"
    >
      <span>{syncing ? 'Syncing...' : 'Sync Pending Actions'}</span>
      {pendingCount > 0 && (
        <span className="bg-orange-800 text-white px-2 py-1 rounded-full text-xs">
          {pendingCount}
        </span>
      )}
    </button>
  );
}