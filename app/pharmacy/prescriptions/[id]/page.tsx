"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useRoleGuard from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { getPrescriptions, updatePrescriptionStatus, dispensePrescription } from '@/lib/pharmacyService';
import { getCachedData } from '@/lib/offlineDb';
import toast from 'react-hot-toast';

export default function PrescriptionDetailsPage() {
  const { loading } = useRoleGuard(['pharmacy']);
  const { user } = useAuth();
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [prescription, setPrescription] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [medications, setMedications] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadPrescriptionData();
    }
  }, [id]);

  const loadPrescriptionData = async () => {
    try {
      const [allPrescriptions, cachedPatients] = await Promise.all([
        getPrescriptions(),
        getCachedData('cachedPatients')
      ]);
      
      const prescriptionData = allPrescriptions.find(p => p.id === id);
      setPrescription(prescriptionData);
      
      if (prescriptionData) {
        const patientData = (cachedPatients as any[])?.find(p => p.id === (prescriptionData as any).patientId);
        setPatient(patientData);
        
        // Initialize medications with dispensation data
        const initialMedications = (prescriptionData as any).medications?.map((med: any) => ({
          ...med,
          quantityToDispense: med.quantity || 0,
          available: true,
          substitution: '',
          notes: '',
        })) || [];
        setMedications(initialMedications);
      }
    } catch (error) {
      console.error('Error loading prescription data:', error);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!user) return;
    
    setSaving(true);
    try {
      const additionalData: any = { pharmacistId: user.uid };
      if (newStatus === 'in_progress') {
        additionalData.startedAt = new Date();
      } else if (newStatus === 'ready_for_pickup') {
        additionalData.readyAt = new Date();
      }
      
      await updatePrescriptionStatus(id, newStatus, additionalData);
      toast.success(navigator.onLine ? 'Status updated' : 'Status updated offline - will sync when online');
      await loadPrescriptionData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    } finally {
      setSaving(false);
    }
  };

  const handleMedicationChange = (index: number, field: string, value: any) => {
    setMedications(prev => prev.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    ));
  };

  const handleDispense = async () => {
    if (!user || !prescription) return;
    
    setSaving(true);
    try {
      const dispensationData = {
        patientId: prescription.patientId,
        medications: medications.map(med => ({
          medicationId: med.id || med.name,
          name: med.name,
          quantityDispensed: med.quantityToDispense,
          quantityPrescribed: med.quantity,
          notes: med.notes,
          substitution: med.substitution,
        })),
        notes,
      };
      
      await dispensePrescription(id, user.uid, dispensationData);
      toast.success(navigator.onLine ? 'Prescription dispensed successfully' : 'Prescription dispensed offline - will sync when online');
      router.push('/pharmacy/dashboard');
    } catch (error) {
      console.error('Error dispensing prescription:', error);
      toast.error('Error dispensing prescription');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'ready_for_pickup': return 'bg-green-100 text-green-800';
      case 'dispensed': return 'bg-gray-100 text-gray-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!prescription) return <div className="p-6">Prescription not found</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Prescription Details</h1>
          <p className="text-gray-600">Prescription #{prescription.id}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>

      {/* Status and Actions */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(prescription.status)}`}>
              {prescription.status?.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-sm text-gray-600">
              Created: {new Date(prescription.createdAt?.toDate ? prescription.createdAt.toDate() : prescription.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex space-x-2">
            {prescription.status === 'pending' && (
              <button
                onClick={() => handleStatusUpdate('accepted')}
                disabled={saving}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Accept
              </button>
            )}
            {prescription.status === 'accepted' && (
              <button
                onClick={() => handleStatusUpdate('in_progress')}
                disabled={saving}
                className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
              >
                Start Processing
              </button>
            )}
            {prescription.status === 'in_progress' && (
              <button
                onClick={() => handleStatusUpdate('ready_for_pickup')}
                disabled={saving}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                Mark Ready
              </button>
            )}
            {prescription.status === 'ready_for_pickup' && (
              <button
                onClick={handleDispense}
                disabled={saving}
                className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
              >
                Dispense
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <h3 className="font-medium mb-3">Patient Information</h3>
        {patient ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Name: {patient.firstName} {patient.lastName}</div>
            <div>Email: {patient.email}</div>
            <div>Phone: {patient.phone || 'N/A'}</div>
            <div>Age: {patient.age || 'N/A'}</div>
          </div>
        ) : (
          <p className="text-gray-500">Patient information not available</p>
        )}
        <div className="mt-3 text-sm">
          <strong>Diagnosis:</strong> {prescription.diagnosis}
        </div>
      </div>

      {/* Medications */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <h3 className="font-medium mb-4">Medications</h3>
        <div className="space-y-4">
          {medications.map((med, index) => (
            <div key={index} className="border rounded p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="font-medium text-lg">{med.name}</div>
                  <div className="text-sm text-gray-600">
                    {med.dosage} • {med.frequency} • {med.duration}
                  </div>
                  <div className="text-sm text-gray-600">
                    Prescribed Quantity: {med.quantity}
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity to Dispense</label>
                    <input
                      type="number"
                      value={med.quantityToDispense}
                      onChange={(e) => handleMedicationChange(index, 'quantityToDispense', parseInt(e.target.value) || 0)}
                      className="w-full border rounded px-3 py-2"
                      max={med.quantity}
                    />
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={med.available}
                        onChange={(e) => handleMedicationChange(index, 'available', e.target.checked)}
                        className="mr-2"
                      />
                      Available in stock
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Substitution (if any)</label>
                  <input
                    type="text"
                    value={med.substitution}
                    onChange={(e) => handleMedicationChange(index, 'substitution', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Alternative medication"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <input
                    type="text"
                    value={med.notes}
                    onChange={(e) => handleMedicationChange(index, 'notes', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Special instructions"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* General Notes */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <h3 className="font-medium mb-3">Dispensation Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border rounded px-3 py-2"
          rows={3}
          placeholder="General notes about this dispensation..."
        />
      </div>
    </div>
  );
}