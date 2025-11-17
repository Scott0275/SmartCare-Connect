"use client";
import React, { useState, useEffect } from 'react';
import { getQueuedActions } from '@/lib/offlineDb';
import { syncPendingActions } from '@/lib/syncService';
import SyncNowButton from '@/components/SyncNowButton';
import useRoleGuard from '@/hooks/useRoleGuard';

export default function SyncStatusPage() {
  const { loading } = useRoleGuard(['nurse', 'doctor', 'admin']);
  const [queuedActions, setQueuedActions] = useState<any[]>([]);
  const [lastSync, setLastSync] = useState<string>('Never');

  useEffect(() => {
    loadQueuedActions();
    const lastSyncTime = localStorage.getItem('lastSyncTime');
    if (lastSyncTime) {
      setLastSync(new Date(parseInt(lastSyncTime)).toLocaleString());
    }
  }, []);

  const loadQueuedActions = async () => {
    try {
      const actions = await getQueuedActions();
      // Only show actions marked as offline
      const offlineActions = actions.filter(action => action.offline === true);
      setQueuedActions(offlineActions);
    } catch (error) {
      console.error('Error loading queued actions:', error);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Sync Status</h1>
        <SyncNowButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium text-gray-900">Offline Pending Actions</h3>
          <p className="text-2xl font-bold text-indigo-600">{queuedActions.length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium text-gray-900">Last Sync</h3>
          <p className="text-sm text-gray-600">{lastSync}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium text-gray-900">Status</h3>
          <p className={`text-sm font-medium ${navigator.onLine ? 'text-green-600' : 'text-red-600'}`}>
            {navigator.onLine ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <h3 className="font-medium p-4 border-b">Offline Queued Actions</h3>
        {queuedActions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No offline pending actions</div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Collection</th>
                <th className="px-4 py-2 text-left">Document ID</th>
                <th className="px-4 py-2 text-left">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {queuedActions.map((action) => (
                <tr key={action.id} className="border-t">
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      action.type === 'create' ? 'bg-green-100 text-green-800' :
                      action.type === 'update' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {action.type}
                    </span>
                  </td>
                  <td className="px-4 py-2">{action.collection}</td>
                  <td className="px-4 py-2 font-mono text-sm">{action.docId}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {new Date(action.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}