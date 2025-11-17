"use client";
import React, { useState } from 'react';
import { syncPendingActions } from '@/lib/syncService';
import toast from 'react-hot-toast';

export default function SyncNowButton() {
  const [syncing, setSyncing] = useState(false);

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
      } else {
        toast.success('✔ No offline actions to sync');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('❌ Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={syncing || !navigator.onLine}
      className="bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
    >
      {syncing ? 'Syncing...' : 'Sync Now'}
    </button>
  );
}