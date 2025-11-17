"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useRoleGuard from '@/hooks/useRoleGuard';
import { getCachedData } from '@/lib/offlineDb';
import TriageForm from '@/components/triage/TriageForm';

export default function NewTriagePage() {
  const { loading } = useRoleGuard(['nurse']);
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const cachedPatients = await getCachedData('cachedPatients') as any[] || [];
      setPatients(cachedPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);
    setShowForm(true);
  };

  const handleTriageSuccess = (triageId: string) => {
    router.push(`/triage/${triageId}`);
  };

  const handleCancel = () => {
    if (showForm) {
      setShowForm(false);
      setSelectedPatientId('');
    } else {
      router.back();
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">New Triage Assessment</h1>
          <p className="text-gray-600">Start triage for walk-in patient</p>
        </div>
        <button
          onClick={handleCancel}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>

      {!showForm ? (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Select Patient</h2>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search patients by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredPatients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No patients found matching your search' : 'No patients available'}
                </div>
              ) : (
                filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient.id)}
                    className="p-3 border rounded cursor-pointer hover:bg-gray-50"
                  >
                    <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                    <div className="text-sm text-gray-600">{patient.email}</div>
                    <div className="text-sm text-gray-500">
                      Age: {patient.age || 'N/A'} • Phone: {patient.phone || 'N/A'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <TriageForm
            patientId={selectedPatientId}
            onSuccess={handleTriageSuccess}
            onCancel={handleCancel}
          />
        </div>
      )}
    </div>
  );
}