'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import useRoleGuard from '../../../hooks/useRoleGuard';
import DashboardLayout from '../../../components/DashboardLayout';
import Link from 'next/link';

interface Patient {
  id: string;
  name: string;
  dob: string;
  gender: string;
}

const MyPatientsPage = () => {
  const { loading } = useRoleGuard(['doctor']);
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const fetchPatients = async () => {
      const querySnapshot = await getDocs(collection(db, 'patients'));
      const patientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
      setPatients(patientsData);
    };

    fetchPatients();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">My Patients</h1>
      <div className="bg-white p-8 rounded-lg shadow-md">
        <ul className="space-y-4">
          {patients.map(patient => (
            <li key={patient.id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <Link href={`/doctor/patient/${patient.id}`}>
                <div className="font-semibold text-teal-600 hover:underline">{patient.name}</div>
                <div className="text-sm text-gray-600">DOB: {patient.dob} | Gender: {patient.gender}</div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </DashboardLayout>
  );
};

export default MyPatientsPage;
