"use client";
import React, { useState } from 'react';
import { updateAllergies } from '@/lib/emrService';
import toast from 'react-hot-toast';

interface AllergiesEditorProps {
  patientId: string;
  patient: any;
  canEdit: boolean;
  onUpdate: () => void;
}

export default function AllergiesEditor({ patientId, patient, canEdit, onUpdate }: AllergiesEditorProps) {
  const [allergies, setAllergies] = useState(patient?.allergies || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAllergy, setNewAllergy] = useState({
    type: 'drug' as 'drug' | 'food' | 'environmental',
    allergen: '',
    severity: 'mild' as 'mild' | 'moderate' | 'severe',
    reaction: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleAddAllergy = () => {
    if (!newAllergy.allergen || !newAllergy.reaction) {
      toast.error('Please fill in allergen and reaction');
      return;
    }

    const allergy = {
      id: Date.now().toString(),
      ...newAllergy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setAllergies((prev: any) => [...prev, allergy]);
    setNewAllergy({
      type: 'drug',
      allergen: '',
      severity: 'mild',
      reaction: '',
      notes: '',
    });
    setShowAddForm(false);
  };

  const handleRemoveAllergy = (index: number) => {
    setAllergies((prev: any) => prev.filter((_: any, i: number) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAllergies(patientId, allergies);
      toast.success(navigator.onLine ? 'Allergies updated successfully' : 'Allergies saved offline - will sync when online');
      onUpdate();
    } catch (error) {
      console.error('Error updating allergies:', error);
      toast.error('Error updating allergies');
    } finally {
      setSaving(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-100 text-red-800';
      case 'moderate': return 'bg-orange-100 text-orange-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Allergies & Adverse Reactions</h3>
        {canEdit && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Add Allergy
            </button>
            {allergies.length > 0 && (
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

      {/* Add Allergy Form */}
      {showAddForm && (
        <div className="bg-red-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium mb-4">Add New Allergy</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={newAllergy.type}
                onChange={(e) => setNewAllergy(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="drug">Drug</option>
                <option value="food">Food</option>
                <option value="environmental">Environmental</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Allergen</label>
              <input
                type="text"
                value={newAllergy.allergen}
                onChange={(e) => setNewAllergy(prev => ({ ...prev, allergen: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., Penicillin, Peanuts, Pollen"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Severity</label>
              <select
                value={newAllergy.severity}
                onChange={(e) => setNewAllergy(prev => ({ ...prev, severity: e.target.value as any }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reaction</label>
              <input
                type="text"
                value={newAllergy.reaction}
                onChange={(e) => setNewAllergy(prev => ({ ...prev, reaction: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., Rash, Swelling, Anaphylaxis"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={newAllergy.notes}
              onChange={(e) => setNewAllergy(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              rows={2}
              placeholder="Additional notes..."
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
              onClick={handleAddAllergy}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Add Allergy
            </button>
          </div>
        </div>
      )}

      {/* Allergies List */}
      {allergies.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">⚠️</div>
          <div>No known allergies</div>
        </div>
      ) : (
        <div className="space-y-3">
          {allergies.map((allergy: any, index: number) => (
            <div key={allergy.id || index} className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-red-800">{allergy.allergen}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(allergy.severity)}`}>
                      {allergy.severity.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                      {allergy.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-red-700">
                    <strong>Reaction:</strong> {allergy.reaction}
                  </div>
                  {allergy.notes && (
                    <div className="text-sm text-red-600 mt-1">
                      <strong>Notes:</strong> {allergy.notes}
                    </div>
                  )}
                </div>
                {canEdit && (
                  <button
                    onClick={() => handleRemoveAllergy(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}