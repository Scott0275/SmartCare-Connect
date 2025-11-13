'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useAuth } from '../../../../context/AuthContext';
import useRoleGuard from '../../../../hooks/useRoleGuard';
import DashboardLayout from '../../../../components/DashboardLayout';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';

const NewVitalsPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  const { loading } = useRoleGuard(['nurse']);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    temperature: '',
    bloodPressure: '',
    heartRate: '',
    respiratoryRate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !patientId) {
      toast.error('Missing user or patient ID.');
      return;
    }

    const newVitals = {
      ...formData,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
    };

    try {
      await addDoc(collection(db, 'patients', patientId, 'vitals'), newVitals);
      toast.success('Vitals recorded successfully!');
      router.push(`/nurse/patient/${patientId}`);
    } catch (error) {
      console.error("Error recording vitals:", error);
      toast.error('Failed to record vitals.');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Record New Vitals</h1>
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form fields for vitals */}
          <div>
            <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">Temperature (°C)</label>
            <input type="number" name="temperature" id="temperature" required value={formData.temperature} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="bloodPressure" className="block text-sm font-medium text-gray-700">Blood Pressure (e.g., 120/80)</label>
            <input type="text" name="bloodPressure" id="bloodPressure" required value={formData.bloodPressure} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="heartRate" className="block text-sm font-medium text-gray-700">Heart Rate (bpm)</label>
            <input type="number" name="heartRate" id="heartRate" required value={formData.heartRate} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="respiratoryRate" className="block text-sm font-medium text-gray-700">Respiratory Rate (breaths/min)</label>
            <input type="number" name="respiratoryRate" id="respiratoryRate" required value={formData.respiratoryRate} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700">
            Save Vitals
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default NewVitalsPage;
