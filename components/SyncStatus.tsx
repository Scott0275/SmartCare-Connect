'use client';

import { useEffect, useState } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

type SyncState = 'connecting' | 'synced' | 'offline';

const SyncStatus = () => {
  const [syncState, setSyncState] = useState<SyncState>('connecting');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'meta', 'heartbeat'), {
      next: (snap) => {
        setSyncState(snap.metadata.fromCache ? 'offline' : 'synced');
      },
      error: (err) => {
        console.error("Firestore connection error:", err);
        setSyncState('offline');
      }
    });

    return () => unsub();
  }, []);

  const statusConfig = {
    connecting: {
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      dotColor: 'bg-yellow-500',
      text: 'Connecting...',
    },
    synced: {
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      dotColor: 'bg-green-500',
      text: 'Real-time sync active',
    },
    offline: {
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      dotColor: 'bg-red-500',
      text: 'Offline mode',
    },
  };

  const { bgColor, textColor, dotColor, text } = statusConfig[syncState];

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center ${bgColor} ${textColor} text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full`}>
      <span className={`w-3 h-3 ${dotColor} rounded-full mr-1.5`}></span>
      {text}
    </div>
  );
};

export default SyncStatus;
