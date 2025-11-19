"use client";
import React, { useState, useEffect } from 'react';
import { getQueuedActions } from '@/lib/offlineDb';
import { checkNetworkHealth, isOnline } from '@/lib/networkService';

export default function NetworkStatus() {
  const [networkOnline, setNetworkOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const updateNetworkStatus = async () => {
      const online = await checkNetworkHealth();
      setNetworkOnline(online);
    };
    
    const updatePendingCount = async () => {
      try {
        const actions = await getQueuedActions();
        setPendingCount(actions.length);
      } catch (error) {
        console.error('Error getting queued actions:', error);
      }
    };

    // Initial status
    updateNetworkStatus();
    updatePendingCount();

    // Listen for online/offline events
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', () => setNetworkOnline(false));

    // Update status periodically
    const interval = setInterval(() => {
      updateNetworkStatus();
      updatePendingCount();
    }, 5000);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', () => setNetworkOnline(false));
      clearInterval(interval);
    };
  }, []);

  if (networkOnline && pendingCount === 0) {
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
            {networkOnline ? `${pendingCount} pending sync items` : `Offline — ${pendingCount} pending sync items`}
          </p>
        </div>
      </div>
    </div>
  );
}