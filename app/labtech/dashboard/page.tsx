"use client";
import React, { useState, useEffect } from 'react';
import useRoleGuard from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { getLabRequests } from '@/lib/labTechService';
import SyncPendingButton from '@/components/SyncPendingButton';
import Link from 'next/link';

export default function LabTechDashboardPage() {
  const { loading } = useRoleGuard(['labtech']);
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    urgent: 0,
  });
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadStats();
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadStats = async () => {
    try {
      const allRequests = await getLabRequests();
      setStats({
        pending: allRequests.filter((r: any) => r.status === 'pending').length,
        inProgress: allRequests.filter((r: any) => r.status === 'in_progress' || r.status === 'accepted' || r.status === 'sample_collected').length,
        completed: allRequests.filter((r: any) => r.status === 'completed').length,
        urgent: allRequests.filter((r: any) => r.priority === 'urgent' || r.priority === 'stat').length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-teal-600">Lab Technician Dashboard</h1>
            <div className="flex space-x-2">
              <SyncPendingButton />
              <a href="/sync-status" className="bg-gray-600 text-white px-3 py-1 rounded text-sm">Sync Status</a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-2">Welcome, {user?.email}</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Role: Lab Technician</span>
            <span>Last Login: {new Date().toLocaleDateString()}</span>
            <div className={`flex items-center space-x-1 ${
              isOnline ? 'text-green-600' : 'text-red-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-orange-600 mr-4">⏳</div>
              <div>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <div className="text-sm text-gray-600">Pending Requests</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-blue-600 mr-4">🔄</div>
              <div>
                <div className="text-2xl font-bold">{stats.inProgress}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-green-600 mr-4">✅</div>
              <div>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <div className="text-sm text-gray-600">Completed Today</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-red-600 mr-4">🚨</div>
              <div>
                <div className="text-2xl font-bold">{stats.urgent}</div>
                <div className="text-sm text-gray-600">Urgent/STAT</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link href="/labtech/pending" className="bg-orange-600 text-white p-6 rounded-lg text-center hover:bg-orange-700">
            <div className="text-3xl mb-2">⏳</div>
            <div className="text-lg font-medium">Pending Requests</div>
            <div className="text-sm opacity-90">Review and accept new requests</div>
          </Link>
          
          <Link href="/labtech/in-progress" className="bg-blue-600 text-white p-6 rounded-lg text-center hover:bg-blue-700">
            <div className="text-3xl mb-2">🔄</div>
            <div className="text-lg font-medium">In Progress</div>
            <div className="text-sm opacity-90">Continue working on samples</div>
          </Link>
          
          <Link href="/labtech/imaging" className="bg-purple-600 text-white p-6 rounded-lg text-center hover:bg-purple-700">
            <div className="text-3xl mb-2">📷</div>
            <div className="text-lg font-medium">Imaging</div>
            <div className="text-sm opacity-90">Radiology and imaging results</div>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              No recent activity
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}