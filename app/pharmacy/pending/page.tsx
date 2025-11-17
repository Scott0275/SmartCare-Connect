"use client";
import React, { useState, useEffect } from 'react';
import useRoleGuard from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { getPrescriptions, acceptPrescription, updatePrescriptionStatus } from '@/lib/pharmacyService';
import { getCachedData } from '@/lib/offlineDb';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function PendingPrescriptionsPage() {
  const { loading } = useRoleGuard(['pharmacy']);
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pendingPrescriptions, cachedPatients] = await Promise.all([
        getPrescriptions('pending'),
        getCachedData('cachedPatients')
      ]);
      setPrescriptions(pendingPrescriptions);
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

  const handleAccept = async (prescriptionId: string) => {
    if (!user) return;
    
    try {
      await acceptPrescription(prescriptionId, user.uid);
      toast.success(navigator.onLine ? 'Prescription accepted' : 'Prescription accepted offline - will sync when online');
      await loadData();
    } catch (error) {
      console.error('Error accepting prescription:', error);
      toast.error('Error accepting prescription');
    }
  };

  const handleDecline = async (prescriptionId: string) => {
    if (!user) return;
    
    try {
      await updatePrescriptionStatus(prescriptionId, 'declined', {
        pharmacistId: user.uid,
        declinedAt: new Date(),
      });
      toast.success(navigator.onLine ? 'Prescription declined' : 'Prescription declined offline - will sync when online');
      await loadData();
    } catch (error) {
      console.error('Error declining prescription:', error);
      toast.error('Error declining prescription');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Pending Prescriptions</h1>
        <button onClick={loadData} className="bg-green-600 text-white px-3 py-1 rounded text-sm">
          Refresh
        </button>
      </div>

      {loadingPrescriptions ? (
        <div className="text-center py-8">Loading prescriptions...</div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white rounded shadow p-8 text-center">
          <div className="text-gray-500 mb-4">
            <div className="text-4xl mb-2">💊</div>
            <div>No pending prescriptions</div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <div key={prescription.id} className="bg-white rounded shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-lg">{getPatientName(prescription.patientId)}</div>
                  <div className="text-sm text-gray-500">
                    Prescription #{prescription.id} • {new Date(prescription.createdAt?.toDate ? prescription.createdAt.toDate() : prescription.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <strong>Diagnosis:</strong> {prescription.diagnosis}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link
                    href={`/pharmacy/prescriptions/${prescription.id}`}
                    className="text-sm text-green-600 hover:text-green-800"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleAccept(prescription.id)}
                    className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(prescription.id)}
                    className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Decline
                  </button>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="text-sm font-medium mb-2">Medications:</div>
                <div className="space-y-1">
                  {prescription.medications?.map((med: any, idx: number) => (
                    <div key={idx} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      <span className="font-medium">{med.name}</span> - {med.dosage}, {med.frequency} for {med.duration}
                      {med.quantity && <span className="text-gray-500"> (Qty: {med.quantity})</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}