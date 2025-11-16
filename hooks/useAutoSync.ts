"use client";
import { useEffect } from 'react';
import { syncPendingActions } from '@/lib/syncService';

export default function useAutoSync() {
  useEffect(() => {
    const handleOnline = async () => {
      try {
        await syncPendingActions();
        localStorage.setItem('lastSyncTime', Date.now().toString());
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    };

    // Sync when coming online
    window.addEventListener('online', handleOnline);

    // Initial sync if online
    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);
}