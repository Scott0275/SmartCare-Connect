"use client";
import React, { useState } from 'react';
import { syncPendingActions } from '@/lib/syncEngine';
import { checkNetworkHealth } from '@/lib/networkService';
import toast from 'react-hot-toast';

export default function SyncNowButton() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    const online = await checkNetworkHealth();
    if (!online) {
      toast.error('Cannot sync while offline');
      return;
    }

    setSyncing(true);
    try {
      const results = await syncPendingActions();
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      if (failed > 0) {
        toast.error(`❌ ${failed} sync errors occurred`);
      } else if (successful > 0) {
        toast.success(`✔ Synced ${successful} items successfully`);
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
      disabled={syncing}
      className="bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
    >
      {syncing ? 'Syncing...' : 'Sync Now'}
    </button>
  );
}