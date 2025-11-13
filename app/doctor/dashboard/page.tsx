'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface Appointment {
  id: string;
  date: string;
  time: string;
  reason: string;
  patientId: string;
}

interface MedicalRecord {
  id: string;
  type: string;
  date: string;
  url: string;
  patientId: string;
}

export default function DoctorDashboard() {
  const { user, role } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);

  useEffect(() => {
    const unsubscribeAppointments = onSnapshot(collection(db, 'appointments'), (querySnapshot) => {
      const newAppointments: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        newAppointments.push({ id: doc.id, ...doc.data() } as Appointment);
      });
      setAppointments(newAppointments);
    });

    const unsubscribeMedicalRecords = onSnapshot(collection(db, 'medical_records'), (querySnapshot) => {
      const newMedicalRecords: MedicalRecord[] = [];
      querySnapshot.forEach((doc) => {
        newMedicalRecords.push({ id: doc.id, ...doc.data() } as MedicalRecord);
      });
      setMedicalRecords(newMedicalRecords);
    });

    return () => {
      unsubscribeAppointments();
      unsubscribeMedicalRecords();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-primary">Doctor Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">All Medical Records</h2>
            {medicalRecords.length > 0 ? (
              <ul className="space-y-4">
                {medicalRecords.map((rec) => (
                  <li key={rec.id} className="p-4 border border-gray-200 rounded-md flex justify-between items-center">
                    <div>
                      <p className="font-semibold">Patient ID: {rec.patientId}</p>
                      <p className="text-sm text-gray-600">{rec.type}</p>
                      <p className="text-sm text-gray-500">{new Date(rec.date).toLocaleDateString()}</p>
                    </div>
                    <a
                      href={rec.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm font-medium text-white bg-primary rounded-md hover:bg-teal-600"
                    >
                      View
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500">There are no medical records.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
