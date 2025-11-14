"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import useRoleGuard from '@/hooks/useRoleGuard';
import { db, storage } from '../../../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';

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

export default function PatientDashboard() {
  const { user } = useAuth();
  const { loading } = useRoleGuard(['patient']);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [recordType, setRecordType] = useState('');
  const [recordDate, setRecordDate] = useState('');
  const [recordFile, setRecordFile] = useState<File | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);

  useEffect(() => {
    if (user) {
      const qAppointments = query(collection(db, 'appointments'), where('patientId', '==', user.uid));
      const unsubscribeAppointments = onSnapshot(qAppointments, (querySnapshot) => {
        const newAppointments: Appointment[] = [];
        querySnapshot.forEach((doc) => {
          newAppointments.push({ id: doc.id, ...doc.data() } as Appointment);
        });
        setAppointments(newAppointments);
      });

      const qMedicalRecords = query(collection(db, 'medical_records'), where('patientId', '==', user.uid));
      const unsubscribeMedicalRecords = onSnapshot(qMedicalRecords, (querySnapshot) => {
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
    }
  }, [user]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const toastId = toast.loading('Booking appointment...');
    try {
      await addDoc(collection(db, 'appointments'), {
        patientId: user.uid,
        date,
        time,
        reason,
        status: 'scheduled',
      });
      toast.success('Appointment booked successfully!', { id: toastId });
      setDate('');
      setTime('');
      setReason('');
    } catch (error) {
      toast.error(`Error: ${(error as Error).message}`, { id: toastId });
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    const toastId = toast.loading('Cancelling appointment...');
    try {
      await deleteDoc(doc(db, 'appointments', appointmentId));
      toast.success('Appointment cancelled successfully!', { id: toastId });
    } catch (error) {
      toast.error(`Error: ${(error as Error).message}`, { id: toastId });
    }
  };

  const handleAddMedicalRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !recordFile) return;

    const toastId = toast.loading('Adding medical record...');
    try {
      const storageRef = ref(storage, `medical_records/${user.uid}/${recordFile.name}`);
      await uploadBytes(storageRef, recordFile);
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'medical_records'), {
        patientId: user.uid,
        type: recordType,
        date: recordDate,
        url: downloadURL,
      });

      toast.success('Medical record added successfully!', { id: toastId });
      setRecordType('');
      setRecordDate('');
      setRecordFile(null);
    } catch (error) {
      toast.error(`Error: ${(error as Error).message}`, { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-primary">Patient Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Appointments */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Upcoming Appointments</h2>
              {appointments.length > 0 ? (
                <ul className="space-y-4">
                  {appointments.map((apt) => (
                    <li key={apt.id} className="p-4 border border-gray-200 rounded-md flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{new Date(apt.date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">{apt.time}</p>
                        <p className="text-sm text-gray-500">{apt.reason}</p>
                      </div>
                      <button
                        onClick={() => handleCancelAppointment(apt.id)}
                        className="px-3 py-1 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
                      >
                        Cancel
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500">You have no upcoming appointments.</p>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Medical Records</h2>
              {medicalRecords.length > 0 ? (
                <ul className="space-y-4">
                  {medicalRecords.map((rec) => (
                    <li key={rec.id} className="p-4 border border-gray-200 rounded-md flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{rec.type}</p>
                        <p className="text-sm text-gray-600">{new Date(rec.date).toLocaleDateString()}</p>
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
                <p className="text-center text-gray-500">You have no medical records.</p>
              )}
            </div>
          </div>

          {/* Right Column: Forms */}
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Book a New Appointment</h2>
              <form onSubmit={handleBookAppointment} className="space-y-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700">Time</label>
                  <input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason for Visit</label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 font-bold text-white bg-primary rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Book Appointment
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Add a New Medical Record</h2>
              <form onSubmit={handleAddMedicalRecord} className="space-y-4">
                <div>
                  <label htmlFor="recordType" className="block text-sm font-medium text-gray-700">Record Type</label>
                  <input
                    id="recordType"
                    type="text"
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value)}
                    required
                    className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="recordDate" className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    id="recordDate"
                    type="date"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="recordFile" className="block text-sm font-medium text-gray-700">File</label>
                  <input
                    id="recordFile"
                    type="file"
                    onChange={(e) => setRecordFile(e.target.files ? e.target.files[0] : null)}
                    required
                    className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 font-bold text-white bg-primary rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Add Record
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
