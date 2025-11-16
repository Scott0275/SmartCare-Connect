"use client";

import React, { useState, useEffect } from 'react';
import useRoleGuard from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { getCachedData } from '@/lib/offlineDb';
import SyncNowButton from '@/components/SyncNowButton';
import Link from 'next/link';

export default function DoctorDashboardPage() {
  const { loading } = useRoleGuard(['doctor']);
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingLabResults: 0,
    patientsAwaitingReview: 0,
    draftConsultations: 0,
  });
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadDashboardStats();
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

  const loadDashboardStats = async () => {
    try {
      const consultations = await getCachedData('cachedConsultations') as any[];
      const labRequests = await getCachedData('cachedLabRequests') as any[];
      
      setStats({
        todayAppointments: 5,
        pendingLabResults: labRequests?.filter(l => l.status === 'pending').length || 0,
        patientsAwaitingReview: 3,
        draftConsultations: consultations?.filter(c => c.status === 'draft').length || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-primary">Doctor Dashboard</h1>
            <div className="flex space-x-2">
              <SyncNowButton />
              <a href="/sync-status" className="bg-gray-600 text-white px-3 py-1 rounded text-sm">Sync Status</a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-2">Welcome, Dr. {user?.email}</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Role: Doctor</span>
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

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-blue-600 mr-4">📅</div>
              <div>
                <div className="text-2xl font-bold">{stats.todayAppointments}</div>
                <div className="text-sm text-gray-600">Today&apos;s Appointments</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-yellow-600 mr-4">🧪</div>
              <div>
                <div className="text-2xl font-bold">{stats.pendingLabResults}</div>
                <div className="text-sm text-gray-600">Pending Lab Results</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-red-600 mr-4">👥</div>
              <div>
                <div className="text-2xl font-bold">{stats.patientsAwaitingReview}</div>
                <div className="text-sm text-gray-600">Awaiting Review</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-purple-600 mr-4">📝</div>
              <div>
                <div className="text-2xl font-bold">{stats.draftConsultations}</div>
                <div className="text-sm text-gray-600">Draft Consultations</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link href="/doctor/patients/search" className="bg-blue-600 text-white p-6 rounded-lg text-center hover:bg-blue-700">
            <div className="text-3xl mb-2">🔍</div>
            <div className="text-lg font-medium">Search Patients</div>
            <div className="text-sm opacity-90">Find and view patient records</div>
          </Link>
          
          <Link href="/doctor/scan" className="bg-green-600 text-white p-6 rounded-lg text-center hover:bg-green-700">
            <div className="text-3xl mb-2">📱</div>
            <div className="text-lg font-medium">Scan QR Code</div>
            <div className="text-sm opacity-90">Quick patient identification</div>
          </Link>
          
          <Link href="/doctor/consultations/start" className="bg-purple-600 text-white p-6 rounded-lg text-center hover:bg-purple-700">
            <div className="text-3xl mb-2">🩺</div>
            <div className="text-lg font-medium">Start Consultation</div>
            <div className="text-sm opacity-90">Begin new patient consultation</div>
          </Link>
        </div>

        {/* Recent Activity */}
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
