"use client";

import { useState, useEffect } from 'react';
import useRoleGuard from '@/hooks/useRoleGuard';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface Appointment {
  id: string;
  date: string;
  time: string;
  reason: string;
  patientId: string;
}

export default function NurseDashboard() {
  const { loading } = useRoleGuard(['nurse']);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'appointments'), (querySnapshot) => {
      const newAppointments: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        newAppointments.push({ id: doc.id, ...doc.data() } as Appointment);
      });
      setAppointments(newAppointments);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-primary">Nurse Dashboard</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">All Appointments</h2>
          {appointments.length > 0 ? (
            <ul className="space-y-4">
              {appointments.map((apt) => (
                <li key={apt.id} className="p-4 border border-gray-200 rounded-md">
                  <p className="font-semibold">Patient ID: {apt.patientId}</p>
                  <p className="text-sm text-gray-600">Date: {new Date(apt.date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">Time: {apt.time}</p>
                  <p className="text-sm text-gray-500">Reason: {apt.reason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500">There are no upcoming appointments.</p>
          )}
        </div>
      </main>
    </div>
  );
}
