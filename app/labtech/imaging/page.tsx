"use client";
import React, { useState, useEffect } from 'react';
import useRoleGuard from '@/hooks/useRoleGuard';
import { getLabRequests } from '@/lib/labTechService';
import { getCachedData } from '@/lib/offlineDb';
import Link from 'next/link';

export default function ImagingPage() {
  const { loading } = useRoleGuard(['labtech']);
  const [requests, setRequests] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allRequests, cachedPatients] = await Promise.all([
        getLabRequests(),
        getCachedData('cachedPatients')
      ]);
      
      // Filter for imaging requests
      const imagingRequests = allRequests.filter((r: any) => 
        r.tests?.some((test: any) => 
          ['ultrasound', 'xray', 'ct', 'mri'].includes(test.id?.toLowerCase()) ||
          test.category?.toLowerCase().includes('radiology') ||
          test.category?.toLowerCase().includes('imaging')
        )
      );
      
      setRequests(imagingRequests);
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
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = filter === 'all' ? requests : requests.filter((r: any) => r.status === filter);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Imaging & Radiology</h1>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={loadData} className="bg-teal-600 text-white px-3 py-1 rounded text-sm">
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-2xl text-blue-600 mb-2">🩻</div>
          <div className="text-lg font-bold">{requests.filter((r: any) => r.tests?.some((t: any) => t.name?.toLowerCase().includes('x-ray'))).length}</div>
          <div className="text-sm text-gray-600">X-Ray</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-2xl text-purple-600 mb-2">🔍</div>
          <div className="text-lg font-bold">{requests.filter((r: any) => r.tests?.some((t: any) => t.name?.toLowerCase().includes('ultrasound'))).length}</div>
          <div className="text-sm text-gray-600">Ultrasound</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-2xl text-green-600 mb-2">💿</div>
          <div className="text-lg font-bold">{requests.filter((r: any) => r.tests?.some((t: any) => t.name?.toLowerCase().includes('ct'))).length}</div>
          <div className="text-sm text-gray-600">CT Scan</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-2xl text-red-600 mb-2">🧲</div>
          <div className="text-lg font-bold">{requests.filter((r: any) => r.tests?.some((t: any) => t.name?.toLowerCase().includes('mri'))).length}</div>
          <div className="text-sm text-gray-600">MRI</div>
        </div>
      </div>

      {loadingRequests ? (
        <div className="text-center py-8">Loading imaging requests...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded shadow p-8 text-center">
          <div className="text-gray-500 mb-4">
            <div className="text-4xl mb-2">📷</div>
            <div>No imaging requests found</div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Patient</th>
                <th className="px-4 py-2 text-left">Imaging Type</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Priority</th>
                <th className="px-4 py-2 text-left">Requested</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id} className="border-t">
                  <td className="px-4 py-2">
                    <div className="font-medium">{getPatientName(request.patientId)}</div>
                    <div className="text-sm text-gray-500">ID: {request.patientId}</div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-sm">
                      {request.tests?.map((test: any, idx: number) => (
                        <div key={idx} className="flex items-center">
                          <span className="mr-2">
                            {test.name?.toLowerCase().includes('x-ray') ? '🩻' :
                             test.name?.toLowerCase().includes('ultrasound') ? '🔍' :
                             test.name?.toLowerCase().includes('ct') ? '💿' :
                             test.name?.toLowerCase().includes('mri') ? '🧲' : '📷'}
                          </span>
                          {test.name}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      request.priority === 'stat' ? 'bg-red-100 text-red-800' :
                      request.priority === 'urgent' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {request.priority?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {new Date(request.createdAt?.toDate ? request.createdAt.toDate() : request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/labtech/request/${request.id}`}
                      className="text-sm bg-teal-600 text-white px-2 py-1 rounded hover:bg-teal-700"
                    >
                      {request.status === 'pending' ? 'Accept' : 'View'}
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