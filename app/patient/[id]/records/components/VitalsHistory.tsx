"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createVitals } from '@/lib/vitalsService';
import { getCachedData } from '@/lib/offlineDb';
import toast from 'react-hot-toast';

interface VitalsHistoryProps {
  patientId: string;
  canAdd: boolean;
}

export default function VitalsHistory({ patientId, canAdd }: VitalsHistoryProps) {
  const { user } = useAuth();
  const [vitals, setVitals] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    bloodPressure: '',
    weight: '',
    temperature: '',
    pulse: '',
    spO2: '',
    rbs: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadVitals();
  }, [patientId]);

  const loadVitals = async () => {
    try {
      const cachedVitals = await getCachedData('cachedVitals') as any[];
      const patientVitals = cachedVitals?.filter(v => v.patientId === patientId) || [];
      setVitals(patientVitals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading vitals:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await createVitals(patientId, formData, user.uid);
      toast.success(navigator.onLine ? 'Vitals recorded successfully' : 'Vitals saved offline - will sync when online');
      setFormData({
        bloodPressure: '',
        weight: '',
        temperature: '',
        pulse: '',
        spO2: '',
        rbs: '',
        notes: '',
      });
      setShowAddForm(false);
      await loadVitals();
    } catch (error) {
      console.error('Error recording vitals:', error);
      toast.error('Error recording vitals');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Vital Signs History</h3>
        {canAdd && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
          >
            Record Vitals
          </button>
        )}
      </div>

      {/* Add Vitals Form */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium mb-4">Record New Vitals</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Blood Pressure (mmHg)</label>
                <input
                  type="text"
                  value={formData.bloodPressure}
                  onChange={(e) => setFormData(prev => ({ ...prev, bloodPressure: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="120/80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Temperature (°C)</label>
                <input
                  type="number"
                  value={formData.temperature}
                  onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pulse (bpm)</label>
                <input
                  type="number"
                  value={formData.pulse}
                  onChange={(e) => setFormData(prev => ({ ...prev, pulse: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SpO₂ (%)</label>
                <input
                  type="number"
                  value={formData.spO2}
                  onChange={(e) => setFormData(prev => ({ ...prev, spO2: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">RBS (mg/dL)</label>
                <input
                  type="number"
                  value={formData.rbs}
                  onChange={(e) => setFormData(prev => ({ ...prev, rbs: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                rows={2}
                placeholder="Additional observations..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? 'Recording...' : 'Record Vitals'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vitals History */}
      {vitals.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">💓</div>
          <div>No vital signs recorded</div>
        </div>
      ) : (
        <div className="space-y-4">
          {vitals.map((vital) => (
            <div key={vital.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="text-sm text-gray-600">
                  {new Date(vital.createdAt?.toDate ? vital.createdAt.toDate() : vital.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                {vital.bloodPressure && (
                  <div>
                    <div className="font-medium text-gray-700">Blood Pressure</div>
                    <div>{vital.bloodPressure} mmHg</div>
                  </div>
                )}
                {vital.weight && (
                  <div>
                    <div className="font-medium text-gray-700">Weight</div>
                    <div>{vital.weight} kg</div>
                  </div>
                )}
                {vital.temperature && (
                  <div>
                    <div className="font-medium text-gray-700">Temperature</div>
                    <div>{vital.temperature}°C</div>
                  </div>
                )}
                {vital.pulse && (
                  <div>
                    <div className="font-medium text-gray-700">Pulse</div>
                    <div>{vital.pulse} bpm</div>
                  </div>
                )}
                {vital.spO2 && (
                  <div>
                    <div className="font-medium text-gray-700">SpO₂</div>
                    <div>{vital.spO2}%</div>
                  </div>
                )}
                {vital.rbs && (
                  <div>
                    <div className="font-medium text-gray-700">RBS</div>
                    <div>{vital.rbs} mg/dL</div>
                  </div>
                )}
              </div>
              {vital.notes && (
                <div className="mt-3 text-sm text-gray-600">
                  <strong>Notes:</strong> {vital.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}