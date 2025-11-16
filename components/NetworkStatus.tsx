"use client";
import React, { useState, useEffect } from 'react';
import { getQueuedActions } from '@/lib/offlineDb';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    const updatePendingCount = async () => {
      try {
        const actions = await getQueuedActions();
        setPendingCount(actions.length);
      } catch (error) {
        console.error('Error getting queued actions:', error);
      }
    };

    // Initial status
    updateOnlineStatus();
    updatePendingCount();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Update pending count periodically
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && pendingCount === 0) {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-2">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-700">Synced</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-2">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">
            {isOnline ? `${pendingCount} pending sync items` : `Offline — ${pendingCount} pending sync items`}
          </p>
        </div>
      </div>
    </div>
  );
}