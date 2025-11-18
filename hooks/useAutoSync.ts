"use client";
import { useEffect } from 'react';
import { syncPendingActions } from '@/lib/syncService';
import { isOnline, resetHealthCheckFailures } from '@/lib/networkService';

export default function useAutoSync() {
  useEffect(() => {
    const handleOnline = async () => {
      try {
        resetHealthCheckFailures();
        await syncPendingActions();
        localStorage.setItem('lastSyncTime', Date.now().toString());
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    };

    const checkAndSync = async () => {
      if (await isOnline()) {
        await handleOnline();
      }
    };

    window.addEventListener('online', handleOnline);
    checkAndSync();

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);
}