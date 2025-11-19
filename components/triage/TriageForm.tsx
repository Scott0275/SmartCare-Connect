import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createTriage } from '@/lib/triageService';

import toast from 'react-hot-toast';

interface TriageFormProps {
  patientId: string;
  appointmentId?: string;
  onSuccess: (triageId: string) => void;
  onCancel: () => void;
}

export default function TriageForm({ patientId, appointmentId, onSuccess, onCancel }: TriageFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    complaint: '',
    triageLevel: 'non-urgent',
    notes: '',
    vitals: {
      temperature: '',
      bloodPressure: '',
      heartRate: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      weight: '',
      height: '',
    },
  });
  const [saving, setSaving] = useState(false);

  const handleVitalChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.complaint.trim()) {
      toast.error('Chief complaint is required');
      return;
    }

    setSaving(true);
    try {
      const vitalsData: any = {};
      Object.entries(formData.vitals).forEach(([key, value]) => {
        if (value) {
          if (['temperature', 'heartRate', 'respiratoryRate', 'oxygenSaturation', 'weight', 'height'].includes(key)) {
            vitalsData[key] = parseFloat(value) || 0;
          } else {
            vitalsData[key] = value;
          }
        }
      });

      const triageId = await createTriage({
        patientId,
        complaint: formData.complaint,
        triageLevel: formData.triageLevel,
        notes: formData.notes,
        vitals: vitalsData,
        appointmentId
      }, user.uid);

      toast.success(navigator.onLine ? 'Triage completed successfully' : 'Triage saved offline - will sync when online');
      onSuccess(triageId);
    } catch (error) {
      console.error('Error creating triage:', error);
      toast.error('Error creating triage record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Triage Assessment</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Chief Complaint */}
        <div>
          <label className="block text-sm font-medium mb-2">Chief Complaint *</label>
          <textarea
            value={formData.complaint}
            onChange={(e) => setFormData(prev => ({ ...prev, complaint: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            rows={3}
            placeholder="Patient's main concern or reason for visit"
            required
          />
        </div>

        {/* Triage Level */}
        <div>
          <label className="block text-sm font-medium mb-2">Triage Level *</label>
          <select
            value={formData.triageLevel}
            onChange={(e) => setFormData(prev => ({ ...prev, triageLevel: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="emergency">🚨 Emergency (Red) - Immediate attention</option>
            <option value="urgent">⚠️ Urgent (Orange) - 10-30 minutes</option>
            <option value="semi-urgent">⏰ Semi-Urgent (Yellow) - Within 1 hour</option>
            <option value="non-urgent">✅ Non-Urgent (Green) - Within 2 hours</option>
          </select>
        </div>

        {/* Vitals */}
        <div>
          <h3 className="text-lg font-medium mb-3">Vital Signs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Temperature (°F)</label>
              <input
                type="number"
                step="0.1"
                value={formData.vitals.temperature}
                onChange={(e) => handleVitalChange('temperature', e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="98.6"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Blood Pressure</label>
              <input
                type="text"
                value={formData.vitals.bloodPressure}
                onChange={(e) => handleVitalChange('bloodPressure', e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="120/80"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Heart Rate (bpm)</label>
              <input
                type="number"
                value={formData.vitals.heartRate}
                onChange={(e) => handleVitalChange('heartRate', e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="72"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Respiratory Rate</label>
              <input
                type="number"
                value={formData.vitals.respiratoryRate}
                onChange={(e) => handleVitalChange('respiratoryRate', e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="16"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Oxygen Saturation (%)</label>
              <input
                type="number"
                value={formData.vitals.oxygenSaturation}
                onChange={(e) => handleVitalChange('oxygenSaturation', e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="98"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Weight (lbs)</label>
              <input
                type="number"
                step="0.1"
                value={formData.vitals.weight}
                onChange={(e) => handleVitalChange('weight', e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="150"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">Additional Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full border rounded px-3 py-2"
            rows={3}
            placeholder="Any additional observations or notes"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Complete Triage'}
          </button>
        </div>
      </form>
    </div>
  );
}