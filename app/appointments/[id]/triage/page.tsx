"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useRoleGuard from '@/hooks/useRoleGuard';
import { getAppointments, updateAppointmentStatus } from '@/lib/appointmentService';
import { getCachedData } from '@/lib/offlineDb';
import TriageForm from '@/components/triage/TriageForm';
import toast from 'react-hot-toast';

export default function AppointmentTriagePage() {
  const { loading } = useRoleGuard(['nurse']);
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [appointment, setAppointment] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadAppointmentData();
    }
  }, [id]);

  const loadAppointmentData = async () => {
    try {
      const [appointments, patients] = await Promise.all([
        getAppointments(),
        getCachedData('cachedPatients')
      ]);
      
      const appointmentData = appointments.find((a: any) => a.id === id);
      setAppointment(appointmentData);
      
      if (appointmentData) {
        const patientData = (patients as any[] || []).find(p => p.id === (appointmentData as any).patientId);
        setPatient(patientData);
      }
    } catch (error) {
      console.error('Error loading appointment data:', error);
    }
  };

  const handleTriageSuccess = async (triageId: string) => {
    try {
      // Update appointment status to checked-in
      await updateAppointmentStatus(id, 'checked-in', {
        triageId,
        checkedInAt: new Date(),
      });
      
      toast.success('Patient checked in and triage completed');
      router.push(`/triage/${triageId}`);
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Error updating appointment status');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!appointment) return <div className="p-6">Appointment not found</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Check-in & Start Triage</h1>
          <p className="text-gray-600">Appointment for {patient?.firstName} {patient?.lastName}</p>
        </div>
        <button
          onClick={handleCancel}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>

      {/* Appointment Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Appointment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Patient</div>
            <div className="font-medium">{patient?.firstName} {patient?.lastName}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Scheduled Time</div>
            <div className="font-medium">
              {new Date(appointment.scheduledFor?.toDate ? appointment.scheduledFor.toDate() : appointment.scheduledFor).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Type</div>
            <div className="font-medium">{appointment.type}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Reason</div>
            <div className="font-medium">{appointment.reason}</div>
          </div>
        </div>
      </div>

      {/* Triage Form */}
      <div className="max-w-4xl mx-auto">
        <TriageForm
          patientId={(appointment as any).patientId}
          appointmentId={id}
          onSuccess={handleTriageSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}