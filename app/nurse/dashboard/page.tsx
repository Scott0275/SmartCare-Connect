"use client";

import React, { useState, useEffect } from "react";
import useRoleGuard from "@/hooks/useRoleGuard";
import { useAuth } from "@/context/AuthContext";
import { getRecentPatients } from "@/lib/offlinePatientService";
import SyncNowButton from "@/components/SyncNowButton";
import SyncPendingButton from "@/components/SyncPendingButton";
import Link from "next/link";

export default function NurseDashboardPage() {
  const { loading } = useRoleGuard(["nurse"]);
  const { user } = useAuth();
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadRecentPatients();
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

  const loadRecentPatients = async () => {
    try {
      const patients = await getRecentPatients();
      setRecentPatients(patients);
    } catch (error) {
      console.error('Error loading recent patients:', error);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-primary">Nurse Dashboard</h1>
            <div className="flex space-x-2">
              <SyncPendingButton />
              <SyncNowButton />
              <a href="/sync-status" className="bg-gray-600 text-white px-3 py-1 rounded text-sm">Sync Status</a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-2">Welcome, {user?.email}</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Role: Nurse</span>
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

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Link href="/nurse/patients/search" className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700">
            <div className="text-2xl mb-2">🔍</div>
            <div>Search Patients</div>
          </Link>
          <Link href="/nurse/patients/register" className="bg-green-600 text-white p-4 rounded-lg text-center hover:bg-green-700">
            <div className="text-2xl mb-2">➕</div>
            <div>Register New Patient</div>
          </Link>
          <Link href="/nurse/reports/shift" className="bg-purple-600 text-white p-4 rounded-lg text-center hover:bg-purple-700">
            <div className="text-2xl mb-2">📋</div>
            <div>Daily Report</div>
          </Link>
          <Link href="/nurse/scan" className="bg-orange-600 text-white p-4 rounded-lg text-center hover:bg-orange-700">
            <div className="text-2xl mb-2">📱</div>
            <div>Scan QR</div>
          </Link>
        </div>

        {/* Recent Patients */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Recent Patients</h3>
          {recentPatients.length > 0 ? (
            <div className="space-y-3">
              {recentPatients.map((patient) => (
                <Link
                  key={patient.id}
                  href={`/nurse/patients/${patient.id}`}
                  className="block p-3 border rounded hover:bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                      <div className="text-sm text-gray-500">ID: {patient.id}</div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(patient.updatedAt?.toDate ? patient.updatedAt.toDate() : patient.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No recent patients</p>
          )}
        </div>
      </main>
    </div>
  );
}
