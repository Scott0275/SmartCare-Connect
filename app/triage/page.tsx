"use client";
import React, { useState, useEffect } from 'react';
import useRoleGuard from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { getTriageRecords, updateTriageStatus } from '@/lib/triageService';
import { getCachedData } from '@/lib/offlineDb';
import { createEncounter } from '@/lib/emrService';
import TriageQueue from '@/components/triage/TriageQueue';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function TriageDashboardPage() {
  const { loading } = useRoleGuard(['nurse', 'doctor']);
  const { user, role } = useAuth();
  const [triageRecords, setTriageRecords] = useState<any[]>([]);
  const [patientNames, setPatientNames] = useState<{ [key: string]: string }>({});
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadTriageData();
  }, []);

  const loadTriageData = async () => {
    try {
      const [records, patients] = await Promise.all([
        getTriageRecords(),
        getCachedData('cachedPatients')
      ]);

      setTriageRecords(records);
      
      const nameMap: { [key: string]: string } = {};
      (patients as any[] || []).forEach(patient => {
        nameMap[patient.id] = `${patient.firstName} ${patient.lastName}`;
      });
      setPatientNames(nameMap);
    } catch (error) {
      console.error('Error loading triage data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleStatusUpdate = async (triageId: string, status: any) => {
    if (!user) return;

    try {
      if (status === 'doctor_started') {
        const triage = triageRecords.find(t => t.id === triageId);
        if (triage) {
          await createEncounter(triage.patientId, user.uid, 'doctor', {
            type: 'consultation',
            soap: {
              subjective: triage.complaint,
              objective: `Triage vitals: ${JSON.stringify(triage.vitals)}`,
              assessment: '',
              plan: '',
            },
          });
        }
      }

      await updateTriageStatus(triageId, status, 'user');
      toast.success(navigator.onLine ? 'Status updated' : 'Status updated offline - will sync when online');
      await loadTriageData();
    } catch (error) {
      console.error('Error updating triage status:', error);
      toast.error('Error updating status');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Triage Dashboard</h1>
          <p className="text-gray-600">Manage patient triage queue</p>
        </div>
        <div className="flex space-x-2">
          {role === 'nurse' && (
            <Link
              href="/triage/new"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              New Triage
            </Link>
          )}
          <button
            onClick={loadTriageData}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {loadingData ? (
        <div className="text-center py-8">Loading triage queue...</div>
      ) : (
        <TriageQueue
          triageRecords={triageRecords}
          patientNames={patientNames}
          onStatusUpdate={role === 'doctor' ? handleStatusUpdate : undefined}
        />
      )}
    </div>
  );
}