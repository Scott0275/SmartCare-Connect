'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useAuth } from '../../../../context/AuthContext';
import useRoleGuard from '../../../../hooks/useRoleGuard';
import DashboardLayout from '../../../../components/DashboardLayout';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';

const NewPrescriptionPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  const { loading } = useRoleGuard(['doctor']);
  const [formData, setFormData] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !patientId) {
      toast.error('Missing user or patient ID.');
      return;
    }

    const newPrescription = {
      ...formData,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
    };

    try {
      await addDoc(collection(db, 'patients', patientId, 'prescriptions'), newPrescription);
      toast.success('Prescription created successfully!');
      router.push(`/doctor/patient/${patientId}`);
    } catch (error) {
      console.error("Error creating prescription:", error);
      toast.error('Failed to create prescription.');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">New Prescription</h1>
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="medication" className="block text-sm font-medium text-gray-700">Medication</label>
            <input type="text" name="medication" id="medication" required value={formData.medication} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="dosage" className="block text-sm font-medium text-gray-700">Dosage</label>
            <input type="text" name="dosage" id="dosage" required value={formData.dosage} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">Frequency</label>
            <input type="text" name="frequency" id="frequency" required value={formData.frequency} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea name="notes" id="notes" rows={4} value={formData.notes} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"></textarea>
          </div>
          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700">
            Save Prescription
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default NewPrescriptionPage;
