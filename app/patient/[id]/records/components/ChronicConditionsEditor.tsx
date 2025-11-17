"use client";
import React, { useState } from 'react';
import { updateChronicConditions } from '@/lib/emrService';
import toast from 'react-hot-toast';

interface ChronicConditionsEditorProps {
  patientId: string;
  patient: any;
  canEdit: boolean;
  onUpdate: () => void;
}

const COMMON_CONDITIONS = [
  'Diabetes Type 1',
  'Diabetes Type 2',
  'Hypertension',
  'Asthma',
  'COPD',
  'Heart Disease',
  'Kidney Disease',
  'Liver Disease',
  'HIV/AIDS',
  'Sickle Cell Disease',
  'Epilepsy',
  'Depression',
  'Anxiety',
  'Arthritis',
  'Osteoporosis',
];

export default function ChronicConditionsEditor({ patientId, patient, canEdit, onUpdate }: ChronicConditionsEditorProps) {
  const [conditions, setConditions] = useState(patient?.chronicConditions || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCondition, setNewCondition] = useState({
    condition: '',
    diagnosedDate: '',
    status: 'active' as 'active' | 'inactive' | 'resolved',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleAddCondition = () => {
    if (!newCondition.condition) {
      toast.error('Please select or enter a condition');
      return;
    }

    const condition = {
      id: Date.now().toString(),
      ...newCondition,
      diagnosedDate: newCondition.diagnosedDate ? new Date(newCondition.diagnosedDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setConditions((prev: any) => [...prev, condition]);
    setNewCondition({
      condition: '',
      diagnosedDate: '',
      status: 'active',
      notes: '',
    });
    setShowAddForm(false);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions((prev: any) => prev.filter((_: any, i: number) => i !== index));
  };

  const handleUpdateStatus = (index: number, status: string) => {
    setConditions((prev: any) => prev.map((condition: any, i: number) => 
      i === index ? { ...condition, status, updatedAt: new Date() } : condition
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateChronicConditions(patientId, conditions);
      toast.success(navigator.onLine ? 'Chronic conditions updated successfully' : 'Chronic conditions saved offline - will sync when online');
      onUpdate();
    } catch (error) {
      console.error('Error updating chronic conditions:', error);
      toast.error('Error updating chronic conditions');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Chronic Conditions</h3>
        {canEdit && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Add Condition
            </button>
            {conditions.length > 0 && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Condition Form */}
      {showAddForm && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium mb-4">Add Chronic Condition</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Condition</label>
              <select
                value={newCondition.condition}
                onChange={(e) => setNewCondition(prev => ({ ...prev, condition: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select a condition</option>
                {COMMON_CONDITIONS.map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
                <option value="other">Other (specify in notes)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Diagnosed Date</label>
              <input
                type="date"
                value={newCondition.diagnosedDate}
                onChange={(e) => setNewCondition(prev => ({ ...prev, diagnosedDate: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={newCondition.status}
                onChange={(e) => setNewCondition(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={newCondition.notes}
              onChange={(e) => setNewCondition(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              rows={2}
              placeholder="Additional notes about this condition..."
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCondition}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Condition
            </button>
          </div>
        </div>
      )}

      {/* Conditions List */}
      {conditions.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">📋</div>
          <div>No chronic conditions recorded</div>
        </div>
      ) : (
        <div className="space-y-3">
          {conditions.map((condition: any, index: number) => (
            <div key={condition.id || index} className="bg-gray-50 border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-800">{condition.condition}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(condition.status)}`}>
                      {condition.status.toUpperCase()}
                    </span>
                  </div>
                  {condition.diagnosedDate && (
                    <div className="text-sm text-gray-600">
                      <strong>Diagnosed:</strong> {new Date(condition.diagnosedDate).toLocaleDateString()}
                    </div>
                  )}
                  {condition.notes && (
                    <div className="text-sm text-gray-600 mt-1">
                      <strong>Notes:</strong> {condition.notes}
                    </div>
                  )}
                </div>
                {canEdit && (
                  <div className="flex items-center space-x-2">
                    <select
                      value={condition.status}
                      onChange={(e) => handleUpdateStatus(index, e.target.value)}
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <button
                      onClick={() => handleRemoveCondition(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}