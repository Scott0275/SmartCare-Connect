"use client";
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createEncounter } from '@/lib/emrService';
import toast from 'react-hot-toast';

interface EncounterFormProps {
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EncounterForm({ patientId, onClose, onSuccess }: EncounterFormProps) {
  const { user, role } = useAuth();
  const [formData, setFormData] = useState({
    type: 'consultation' as 'consultation' | 'follow-up' | 'emergency',
    soap: {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
    },
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.soap.subjective && !formData.soap.objective && !formData.soap.assessment && !formData.soap.plan) {
      toast.error('Please fill in at least one SOAP section');
      return;
    }

    setSaving(true);
    try {
      await createEncounter(patientId, user.uid, role || 'unknown', formData);
      toast.success(navigator.onLine ? 'Encounter note saved successfully' : 'Encounter note saved offline - will sync when online');
      onSuccess();
    } catch (error) {
      console.error('Error creating encounter:', error);
      toast.error('Error creating encounter note');
    } finally {
      setSaving(false);
    }
  };

  const handleSoapChange = (section: keyof typeof formData.soap, value: string) => {
    setFormData(prev => ({
      ...prev,
      soap: {
        ...prev.soap,
        [section]: value,
      },
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Add Encounter Note</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Encounter Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Encounter Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full border rounded px-3 py-2"
            >
              <option value="consultation">Consultation</option>
              <option value="follow-up">Follow-up</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          {/* SOAP Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subjective */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Subjective <span className="text-gray-500">(Patient&apos;s complaints)</span>
              </label>
              <textarea
                value={formData.soap.subjective}
                onChange={(e) => handleSoapChange('subjective', e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows={4}
                placeholder="Patient reports..."
              />
            </div>

            {/* Objective */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Objective <span className="text-gray-500">(Clinical findings)</span>
              </label>
              <textarea
                value={formData.soap.objective}
                onChange={(e) => handleSoapChange('objective', e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows={4}
                placeholder="Physical examination findings..."
              />
            </div>

            {/* Assessment */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Assessment <span className="text-gray-500">(Clinical impression)</span>
              </label>
              <textarea
                value={formData.soap.assessment}
                onChange={(e) => handleSoapChange('assessment', e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows={4}
                placeholder="Clinical assessment and diagnosis..."
              />
            </div>

            {/* Plan */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Plan <span className="text-gray-500">(Treatment plan)</span>
              </label>
              <textarea
                value={formData.soap.plan}
                onChange={(e) => handleSoapChange('plan', e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows={4}
                placeholder="Treatment plan and follow-up..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Encounter Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}