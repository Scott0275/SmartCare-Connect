"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useRoleGuard from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { createAppointment, getDoctorAvailability } from '@/lib/appointmentService';
import { searchPatientsOffline } from '@/lib/offlinePatientService';
import { getCachedData } from '@/lib/offlineDb';
import toast from 'react-hot-toast';

export default function NewAppointmentPage() {
  const { loading } = useRoleGuard(['doctor', 'nurse', 'admin']);
  const { user } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    reason: '',
    type: 'consultation' as 'consultation' | 'follow-up' | 'emergency' | 'telemedicine',
    scheduledFor: '',
    duration: 30,
    notes: '',
  });
  
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [availability, setAvailability] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (patientSearch.length > 2) {
      searchPatients();
    } else {
      setPatients([]);
    }
  }, [patientSearch]);

  useEffect(() => {
    if (formData.doctorId) {
      loadDoctorAvailability();
    }
  }, [formData.doctorId]);

  const loadDoctors = async () => {
    try {
      const cachedUsers = await getCachedData('cachedUsers') as any[];
      const doctorUsers = cachedUsers?.filter(u => u.role === 'doctor') || [];
      setDoctors(doctorUsers);
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const searchPatients = async () => {
    try {
      const results = await searchPatientsOffline(patientSearch);
      setPatients(results.slice(0, 10));
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  };

  const loadDoctorAvailability = async () => {
    try {
      const availabilityData = await getDoctorAvailability(formData.doctorId);
      setAvailability(availabilityData);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.patientId || !formData.doctorId || !formData.reason || !formData.scheduledFor) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await createAppointment({
        ...formData,
        scheduledFor: new Date(formData.scheduledFor),
        createdBy: (user as any)?.uid ?? (user as any)?.username ?? (user as any)?.email ?? 'unknown',
      });
      
      toast.success(navigator.onLine ? 'Appointment created successfully' : 'Appointment saved offline - will sync when online');
      router.push('/appointments');
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Error creating appointment');
    } finally {
      setSaving(false);
    }
  };

  const selectPatient = (patient: any) => {
    setFormData(prev => ({ ...prev, patientId: patient.id }));
    setPatientSearch(`${patient.firstName} ${patient.lastName}`);
    setPatients([]);
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // Minimum 30 minutes from now
    return now.toISOString().slice(0, 16);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">New Appointment</h1>
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-6">
          {/* Patient Search */}
          <div>
            <label className="block text-sm font-medium mb-1">Patient *</label>
            <div className="relative">
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Search patient by name or ID..."
                required
              />
              {patients.length > 0 && (
                <div className="absolute z-10 w-full bg-white border rounded-b shadow-lg max-h-60 overflow-y-auto">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => selectPatient(patient)}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b"
                    >
                      <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                      <div className="text-sm text-gray-600">ID: {patient.id}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Doctor Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Doctor *</label>
            <select
              value={formData.doctorId}
              onChange={(e) => setFormData(prev => ({ ...prev, doctorId: e.target.value }))}
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

          {/* Appointment Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full border rounded px-3 py-2"
            >
              <option value="consultation">Consultation</option>
              <option value="follow-up">Follow-up</option>
              <option value="emergency">Emergency</option>
              <option value="telemedicine">Telemedicine</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium mb-1">Reason for Visit *</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              rows={3}
              placeholder="Describe the reason for this appointment..."
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date & Time *</label>
              <input
                type="datetime-local"
                value={formData.scheduledFor}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledFor: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                min={getMinDateTime()}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              rows={2}
              placeholder="Additional notes..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Appointment'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}