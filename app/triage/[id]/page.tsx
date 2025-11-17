"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useRoleGuard from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { getTriageById, updateTriageStatus } from '@/lib/triageService';
import { getCachedData } from '@/lib/offlineDb';
import { createEncounter } from '@/lib/emrService';
import UrgencyBadge from '@/components/triage/UrgencyBadge';
import toast from 'react-hot-toast';

export default function TriageDetailsPage() {
  const { loading } = useRoleGuard(['nurse', 'doctor']);
  const { user, role } = useAuth();
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [triage, setTriage] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      loadTriageData();
    }
  }, [id]);

  const loadTriageData = async () => {
    try {
      const [triageData, patients] = await Promise.all([
        getTriageById(id),
        getCachedData('cachedPatients')
      ]);
      
      setTriage(triageData);
      
      if (triageData) {
        const patientData = (patients as any[] || []).find(p => p.id === triageData.patientId);
        setPatient(patientData);
      }
    } catch (error) {
      console.error('Error loading triage data:', error);
    }
  };

  const handleStatusUpdate = async (newStatus: any) => {
    if (!user || !triage) return;
    
    setUpdating(true);
    try {
      await updateTriageStatus(id, newStatus);
      toast.success(navigator.onLine ? 'Status updated' : 'Status updated offline - will sync when online');
      await loadTriageData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  const handleStartEncounter = async () => {
    if (!user || !triage) return;
    
    setUpdating(true);
    try {
      const encounterId = await createEncounter(triage.patientId, user.uid, 'doctor', {
        type: 'consultation',
        soap: {
          subjective: triage.complaint,
          objective: `Triage vitals: ${JSON.stringify(triage.vitals)}`,
          assessment: '',
          plan: '',
        },
      });
      
      await updateTriageStatus(id, 'doctor_started');
      toast.success('Encounter started successfully');
      router.push(`/doctor/patients/${triage.patientId}/consultation`);
    } catch (error) {
      console.error('Error starting encounter:', error);
      toast.error('Error starting encounter');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'doctor_started': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!triage) return <div className="p-6">Triage record not found</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Triage Details</h1>
          <p className="text-gray-600">Triage ID: {triage.id}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Triage Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status and Priority */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-4">
                <UrgencyBadge level={triage.triageLevel} size="lg" />
                <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(triage.status)}`}>
                  {triage.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Created: {new Date(triage.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              {role === 'nurse' && triage.status === 'pending' && (
                <button
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={updating}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Mark Complete
                </button>
              )}
              {role === 'doctor' && triage.status === 'completed' && (
                <button
                  onClick={handleStartEncounter}
                  disabled={updating}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Start Encounter
                </button>
              )}
              {triage.status !== 'closed' && (
                <button
                  onClick={() => handleStatusUpdate('closed')}
                  disabled={updating}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  Close Triage
                </button>
              )}
            </div>
          </div>

          {/* Chief Complaint */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3">Chief Complaint</h3>
            <p className="text-gray-700">{triage.complaint || 'No complaint recorded'}</p>
          </div>

          {/* Vital Signs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Vital Signs</h3>
            {triage.vitals && Object.keys(triage.vitals).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {triage.vitals.temperature && (
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Temperature</div>
                    <div className="font-semibold">{triage.vitals.temperature}°F</div>
                  </div>
                )}
                {triage.vitals.bloodPressure && (
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Blood Pressure</div>
                    <div className="font-semibold">{triage.vitals.bloodPressure}</div>
                  </div>
                )}
                {triage.vitals.heartRate && (
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Heart Rate</div>
                    <div className="font-semibold">{triage.vitals.heartRate} bpm</div>
                  </div>
                )}
                {triage.vitals.respiratoryRate && (
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Respiratory Rate</div>
                    <div className="font-semibold">{triage.vitals.respiratoryRate}</div>
                  </div>
                )}
                {triage.vitals.oxygenSaturation && (
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Oxygen Saturation</div>
                    <div className="font-semibold">{triage.vitals.oxygenSaturation}%</div>
                  </div>
                )}
                {triage.vitals.weight && (
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Weight</div>
                    <div className="font-semibold">{triage.vitals.weight} lbs</div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No vital signs recorded</p>
            )}
          </div>

          {/* Notes */}
          {triage.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Additional Notes</h3>
              <p className="text-gray-700">{triage.notes}</p>
            </div>
          )}
        </div>

        {/* Patient Information Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
            {patient ? (
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Name</div>
                  <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div>{patient.email}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Phone</div>
                  <div>{patient.phone || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Age</div>
                  <div>{patient.age || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Gender</div>
                  <div>{patient.gender || 'N/A'}</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Patient information not available</p>
            )}
          </div>

          {/* Appointment Link */}
          {triage.appointmentId && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Related Appointment</h3>
              <p className="text-sm text-gray-600 mb-2">Appointment ID:</p>
              <p className="font-mono text-sm">{triage.appointmentId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}