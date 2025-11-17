"use client";
import React, { useState, useEffect } from 'react';
import useRoleGuard from '@/hooks/useRoleGuard';
import { getLabRequests } from '@/lib/labTechService';
import { getCachedData } from '@/lib/offlineDb';
import Link from 'next/link';

export default function InProgressLabRequestsPage() {
  const { loading } = useRoleGuard(['labtech']);
  const [requests, setRequests] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allRequests, cachedPatients] = await Promise.all([
        getLabRequests(),
        getCachedData('cachedPatients')
      ]);
      
      // Filter for in-progress statuses
      const inProgressRequests = allRequests.filter((r: any) => 
        ['accepted', 'sample_collected', 'in_progress'].includes(r.status)
      );
      
      setRequests(inProgressRequests);
      setPatients(cachedPatients as any[] || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'sample_collected': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">In Progress Lab Requests</h1>
        <button onClick={loadData} className="bg-teal-600 text-white px-3 py-1 rounded text-sm">
          Refresh
        </button>
      </div>

      {loadingRequests ? (
        <div className="text-center py-8">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded shadow p-8 text-center">
          <div className="text-gray-500 mb-4">
            <div className="text-4xl mb-2">🔄</div>
            <div>No requests in progress</div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Patient</th>
                <th className="px-4 py-2 text-left">Tests</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Started</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-t">
                  <td className="px-4 py-2">
                    <div className="font-medium">{getPatientName(request.patientId)}</div>
                    <div className="text-sm text-gray-500">ID: {request.patientId}</div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-sm">
                      {request.tests?.map((test: any, idx: number) => (
                        <div key={idx}>{test.name}</div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {request.acceptedAt ? 
                      new Date(request.acceptedAt?.toDate ? request.acceptedAt.toDate() : request.acceptedAt).toLocaleDateString() :
                      'N/A'
                    }
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/labtech/request/${request.id}`}
                      className="text-sm bg-teal-600 text-white px-2 py-1 rounded hover:bg-teal-700"
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