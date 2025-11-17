"use client";
import React, { useState, useEffect } from 'react';
import useRoleGuard from '@/hooks/useRoleGuard';
import { getPrescriptions } from '@/lib/pharmacyService';
import { getCachedData } from '@/lib/offlineDb';
import Link from 'next/link';

export default function InProgressPrescriptionsPage() {
  const { loading } = useRoleGuard(['pharmacy']);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allPrescriptions, cachedPatients] = await Promise.all([
        getPrescriptions(),
        getCachedData('cachedPatients')
      ]);
      
      const inProgressPrescriptions = allPrescriptions.filter((p: any) => 
        ['accepted', 'in_progress', 'ready_for_pickup'].includes(p.status)
      );
      
      setPrescriptions(inProgressPrescriptions);
      setPatients(cachedPatients as any[] || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'ready_for_pickup': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">In Progress Prescriptions</h1>
        <button onClick={loadData} className="bg-green-600 text-white px-3 py-1 rounded text-sm">
          Refresh
        </button>
      </div>

      {loadingPrescriptions ? (
        <div className="text-center py-8">Loading prescriptions...</div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white rounded shadow p-8 text-center">
          <div className="text-gray-500 mb-4">
            <div className="text-4xl mb-2">🔄</div>
            <div>No prescriptions in progress</div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Patient</th>
                <th className="px-4 py-2 text-left">Medications</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Started</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((prescription) => (
                <tr key={prescription.id} className="border-t">
                  <td className="px-4 py-2">
                    <div className="font-medium">{getPatientName(prescription.patientId)}</div>
                    <div className="text-sm text-gray-500">#{prescription.id}</div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-sm">
                      {prescription.medications?.slice(0, 2).map((med: any, idx: number) => (
                        <div key={idx}>{med.name}</div>
                      ))}
                      {prescription.medications?.length > 2 && (
                        <div className="text-gray-500">+{prescription.medications.length - 2} more</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(prescription.status)}`}>
                      {prescription.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {prescription.acceptedAt ? 
                      new Date(prescription.acceptedAt?.toDate ? prescription.acceptedAt.toDate() : prescription.acceptedAt).toLocaleDateString() :
                      'N/A'
                    }
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/pharmacy/prescriptions/${prescription.id}`}
                      className="text-sm bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                    >
                      Continue
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}