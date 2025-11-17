"use client";
import React, { useState, useEffect } from 'react';
import useRoleGuard from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { getAppointments, updateAppointmentStatus, createAppointment } from '@/lib/appointmentService';
import { getCachedData } from '@/lib/offlineDb';
import toast from 'react-hot-toast';

export default function PatientAppointmentsPage() {
  const { loading } = useRoleGuard(['patient']);
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    doctorId: '',
    reason: '',
    type: 'consultation' as 'consultation' | 'follow-up',
    preferredDate: '',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      loadAppointments();
      loadDoctors();
    }
  }, [user]);

  const loadAppointments = async () => {
    if (!user) return;
    
    try {
      const appointmentData = await getAppointments({ patientId: user.uid });
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

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Unknown Doctor';
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await updateAppointmentStatus(appointmentId, 'cancelled', {
        cancelledAt: new Date(),
        cancelledBy: user?.uid,
      });
      toast.success(navigator.onLine ? 'Appointment cancelled' : 'Appointment cancelled offline - will sync when online');
      await loadAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Error cancelling appointment');
    }
  };

  const handleRequestAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!requestForm.doctorId || !requestForm.reason || !requestForm.preferredDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createAppointment({
        patientId: user.uid,
        doctorId: requestForm.doctorId,
        reason: requestForm.reason,
        type: requestForm.type,
        scheduledFor: new Date(requestForm.preferredDate),
        notes: requestForm.notes,
        createdBy: user.uid,
      });
      
      toast.success(navigator.onLine ? 'Appointment request submitted' : 'Appointment request saved offline - will sync when online');
      setShowRequestForm(false);
      setRequestForm({
        doctorId: '',
        reason: '',
        type: 'consultation',
        preferredDate: '',
        notes: '',
      });
      await loadAppointments();
    } catch (error) {
      console.error('Error requesting appointment:', error);
      toast.error('Error requesting appointment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'no-show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUpcomingAppointments = () => {
    const now = new Date();
    return appointments.filter(apt => {
      const aptDate = apt.scheduledFor?.toDate ? apt.scheduledFor.toDate() : new Date(apt.scheduledFor);
      return aptDate > now && apt.status !== 'cancelled';
    });
  };

  const getPastAppointments = () => {
    const now = new Date();
    return appointments.filter(apt => {
      const aptDate = apt.scheduledFor?.toDate ? apt.scheduledFor.toDate() : new Date(apt.scheduledFor);
      return aptDate <= now || apt.status === 'completed' || apt.status === 'cancelled';
    });
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setDate(now.getDate() + 1); // Minimum tomorrow
    return now.toISOString().slice(0, 16);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Appointments</h1>
        <button
          onClick={() => setShowRequestForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Request Appointment
        </button>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Upcoming Appointments</h2>
        </div>
        <div className="p-6">
          {getUpcomingAppointments().length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📅</div>
              <div>No upcoming appointments</div>
            </div>
          ) : (
            <div className="space-y-4">
              {getUpcomingAppointments().map((appointment) => (
                <div key={appointment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-lg">
                        {getDoctorName(appointment.doctorId)}
                      </div>
                      <div className="text-gray-600">
                        {new Date(appointment.scheduledFor?.toDate ? appointment.scheduledFor.toDate() : appointment.scheduledFor).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <strong>Type:</strong> {appointment.type} • <strong>Reason:</strong> {appointment.reason}
                      </div>
                      {appointment.notes && (
                        <div className="text-sm text-gray-600 mt-1">
                          <strong>Notes:</strong> {appointment.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status.toUpperCase()}
                      </span>
                      {appointment.status === 'pending' && (
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Past Appointments */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Past Appointments</h2>
        </div>
        <div className="p-6">
          {getPastAppointments().length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div>No past appointments</div>
            </div>
          ) : (
            <div className="space-y-4">
              {getPastAppointments().slice(0, 10).map((appointment) => (
                <div key={appointment.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {getDoctorName(appointment.doctorId)}
                      </div>
                      <div className="text-gray-600">
                        {new Date(appointment.scheduledFor?.toDate ? appointment.scheduledFor.toDate() : appointment.scheduledFor).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {appointment.reason}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Request Appointment Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Request Appointment</h3>
            
            <form onSubmit={handleRequestAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Doctor *</label>
                <select
                  value={requestForm.doctorId}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, doctorId: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.firstName} {doctor.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={requestForm.type}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Preferred Date & Time *</label>
                <input
                  type="datetime-local"
                  value={requestForm.preferredDate}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, preferredDate: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  min={getMinDateTime()}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reason for Visit *</label>
                <textarea
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="Describe your symptoms or reason for visit..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Additional Notes</label>
                <textarea
                  value={requestForm.notes}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                  placeholder="Any additional information..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}