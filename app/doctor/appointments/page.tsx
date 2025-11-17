"use client";
import React, { useState, useEffect } from 'react';
import useRoleGuard from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { getAppointments, updateAppointmentStatus, rescheduleAppointment } from '@/lib/appointmentService';
import { getCachedData } from '@/lib/offlineDb';
import { createEncounter } from '@/lib/emrService';
import Calendar from '@/components/Calendar';
import toast from 'react-hot-toast';

export default function DoctorAppointmentsPage() {
  const { loading } = useRoleGuard(['doctor']);
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadAppointments();
      loadPatients();
    }
  }, [user]);

  const loadAppointments = async () => {
    if (!user) return;
    
    try {
      const appointmentData = await getAppointments({ doctorId: user.uid });
      setAppointments(appointmentData);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const loadPatients = async () => {
    try {
      const cachedPatients = await getCachedData('cachedPatients') as any[];
      setPatients(cachedPatients || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  };

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
  };

  const handleStatusUpdate = async (appointmentId: string, status: string) => {
    try {
      await updateAppointmentStatus(appointmentId, status);
      toast.success(navigator.onLine ? 'Status updated' : 'Status updated offline - will sync when online');
      await loadAppointments();
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    }
  };

  const handleCompleteAppointment = async (appointment: any) => {
    if (!user) return;
    
    try {
      // Mark appointment as completed
      await updateAppointmentStatus(appointment.id, 'completed', {
        completedAt: new Date(),
      });
      
      // Create encounter draft
      await createEncounter(appointment.patientId, user.uid, 'doctor', {
        type: appointment.type === 'follow-up' ? 'follow-up' : 'consultation',
        soap: {
          subjective: '',
          objective: '',
          assessment: '',
          plan: '',
        },
      });
      
      toast.success('Appointment completed and encounter created');
      await loadAppointments();
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error completing appointment:', error);
      toast.error('Error completing appointment');
    }
  };

  const getTodaysAppointments = () => {
    const today = new Date();
    return appointments.filter(apt => {
      const aptDate = apt.scheduledFor?.toDate ? apt.scheduledFor.toDate() : new Date(apt.scheduledFor);
      return aptDate.toDateString() === today.toDateString();
    });
  };

  const getUpcomingAppointments = () => {
    const now = new Date();
    return appointments.filter(apt => {
      const aptDate = apt.scheduledFor?.toDate ? apt.scheduledFor.toDate() : new Date(apt.scheduledFor);
      return aptDate > now && apt.status !== 'cancelled';
    }).slice(0, 5);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Appointments</h1>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Calendar
            appointments={appointments}
            onDateSelect={setSelectedDate}
            onAppointmentClick={handleAppointmentClick}
            view={view}
            selectedDate={selectedDate}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Appointments */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-3">Today&apos;s Appointments</h3>
            {getTodaysAppointments().length === 0 ? (
              <p className="text-gray-500 text-sm">No appointments today</p>
            ) : (
              <div className="space-y-2">
                {getTodaysAppointments().map((appointment) => (
                  <div
                    key={appointment.id}
                    onClick={() => handleAppointmentClick(appointment)}
                    className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                  >
                    <div className="text-sm font-medium">
                      {new Date(appointment.scheduledFor?.toDate ? appointment.scheduledFor.toDate() : appointment.scheduledFor).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-sm text-gray-600">
                      {getPatientName(appointment.patientId)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {appointment.reason}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-3">Upcoming</h3>
            {getUpcomingAppointments().length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming appointments</p>
            ) : (
              <div className="space-y-2">
                {getUpcomingAppointments().map((appointment) => (
                  <div key={appointment.id} className="p-2 border rounded">
                    <div className="text-sm font-medium">
                      {new Date(appointment.scheduledFor?.toDate ? appointment.scheduledFor.toDate() : appointment.scheduledFor).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {getPatientName(appointment.patientId)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Appointment Details</h3>
            
            <div className="space-y-3 mb-6">
              <div>
                <span className="font-medium">Patient:</span> {getPatientName(selectedAppointment.patientId)}
              </div>
              <div>
                <span className="font-medium">Date:</span> {new Date(selectedAppointment.scheduledFor?.toDate ? selectedAppointment.scheduledFor.toDate() : selectedAppointment.scheduledFor).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Type:</span> {selectedAppointment.type}
              </div>
              <div>
                <span className="font-medium">Reason:</span> {selectedAppointment.reason}
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  selectedAppointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  selectedAppointment.status === 'approved' ? 'bg-green-100 text-green-800' :
                  selectedAppointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedAppointment.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-3 py-1 border rounded hover:bg-gray-50"
              >
                Close
              </button>
              
              {selectedAppointment.status === 'pending' && (
                <button
                  onClick={() => handleStatusUpdate(selectedAppointment.id, 'approved')}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Approve
                </button>
              )}
              
              {selectedAppointment.status === 'approved' && (
                <button
                  onClick={() => handleCompleteAppointment(selectedAppointment)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Complete
                </button>
              )}
              
              {['pending', 'approved'].includes(selectedAppointment.status) && (
                <button
                  onClick={() => handleStatusUpdate(selectedAppointment.id, 'cancelled')}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}