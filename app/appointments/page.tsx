"use client";
import React, { useState, useEffect } from 'react';
import useRoleGuard from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { getAppointments } from '@/lib/appointmentService';
import { getCachedData } from '@/lib/offlineDb';
import Calendar from '@/components/Calendar';
import Link from 'next/link';

export default function AppointmentsPage() {
  const { loading } = useRoleGuard(['doctor', 'nurse', 'admin']);
  const { user, role } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    loadAppointments();
    loadDoctors();
  }, [selectedDoctor]);

  const loadAppointments = async () => {
    try {
      const filters: any = {};
      if (selectedDoctor !== 'all') {
        filters.doctorId = selectedDoctor;
      }
      
      const appointmentData = await getAppointments(filters);
      setAppointments(appointmentData);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const loadDoctors = async () => {
    try {
      const cachedUsers = await getCachedData('cachedUsers') as any[];
      const doctorUsers = cachedUsers?.filter(u => u.role === 'doctor') || [];
      setDoctors(doctorUsers);
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const handleAppointmentClick = (appointment: any) => {
    // Navigate to appointment details or show modal
    console.log('Appointment clicked:', appointment);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Appointments</h1>
        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['day', 'week', 'month'] as const).map((viewType) => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`px-3 py-1 rounded text-sm capitalize ${
                  view === viewType ? 'bg-white shadow' : 'hover:bg-gray-200'
                }`}
              >
                {viewType}
              </button>
            ))}
          </div>

          {/* Doctor Filter */}
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="all">All Doctors</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                Dr. {doctor.firstName} {doctor.lastName}
              </option>
            ))}
          </select>

          <Link
            href="/appointments/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            New Appointment
          </Link>
        </div>
      </div>

      {/* Calendar */}
      <Calendar
        appointments={appointments}
        onDateSelect={setSelectedDate}
        onAppointmentClick={handleAppointmentClick}
        view={view}
        selectedDate={selectedDate}
      />

      {/* Appointment Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">
            {appointments.filter(a => a.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {appointments.filter(a => a.status === 'approved').length}
          </div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">
            {appointments.filter(a => a.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">
            {appointments.filter(a => a.status === 'cancelled').length}
          </div>
          <div className="text-sm text-gray-600">Cancelled</div>
        </div>
      </div>
    </div>
  );
}