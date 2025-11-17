"use client";
import React, { useState, useEffect } from 'react';
import useRoleGuard from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { getLabRequests, acceptLabRequest } from '@/lib/labTechService';
import { getCachedData } from '@/lib/offlineDb';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function PendingLabRequestsPage() {
  const { loading } = useRoleGuard(['labtech']);
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [labRequests, cachedPatients] = await Promise.all([
        getLabRequests('pending'),
        getCachedData('cachedPatients')
      ]);
      setRequests(labRequests);
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

  const handleAccept = async (requestId: string) => {
    if (!user) return;
    
    try {
      await acceptLabRequest(requestId, user.uid);
      toast.success(navigator.onLine ? 'Request accepted' : 'Request accepted offline - will sync when online');
      await loadData();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Error accepting request');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat': return 'bg-red-100 text-red-800';
      case 'urgent': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Pending Lab Requests</h1>
        <button onClick={loadData} className="bg-teal-600 text-white px-3 py-1 rounded text-sm">
          Refresh
        </button>
      </div>

      {loadingRequests ? (
        <div className="text-center py-8">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded shadow p-8 text-center">
          <div className="text-gray-500 mb-4">
            <div className="text-4xl mb-2">📋</div>
            <div>No pending lab requests</div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Patient</th>
                <th className="px-4 py-2 text-left">Tests</th>
                <th className="px-4 py-2 text-left">Priority</th>
                <th className="px-4 py-2 text-left">Requested</th>
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
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(request.priority)}`}>
                      {request.priority?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {new Date(request.createdAt?.toDate ? request.createdAt.toDate() : request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex space-x-2">
                      <Link
                        href={`/labtech/request/${request.id}`}
                        className="text-sm text-teal-600 hover:text-teal-800"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleAccept(request.id)}
                        className="text-sm bg-teal-600 text-white px-2 py-1 rounded hover:bg-teal-700"
                      >
                        Accept
                      </button>
                    </div>
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