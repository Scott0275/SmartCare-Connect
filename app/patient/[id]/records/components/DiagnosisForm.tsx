"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createDiagnosis } from '@/lib/emrService';
import { searchICD10 } from '@/lib/icd10Data';
import toast from 'react-hot-toast';

interface DiagnosisFormProps {
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DiagnosisForm({ patientId, onClose, onSuccess }: DiagnosisFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    icd10Code: '',
    description: '',
    type: 'differential' as 'differential' | 'final',
    notes: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const results = searchICD10(searchQuery);
      setSearchResults(results.slice(0, 10));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.icd10Code || !formData.description) {
      toast.error('Please select an ICD-10 code and description');
      return;
    }

    setSaving(true);
    try {
      await createDiagnosis(patientId, user.uid, formData);
      toast.success(navigator.onLine ? 'Diagnosis added successfully' : 'Diagnosis saved offline - will sync when online');
      onSuccess();
    } catch (error) {
      console.error('Error creating diagnosis:', error);
      toast.error('Error creating diagnosis');
    } finally {
      setSaving(false);
    }
  };

  const selectDiagnosis = (diagnosis: any) => {
    setFormData(prev => ({
      ...prev,
      icd10Code: diagnosis.code,
      description: diagnosis.description,
    }));
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Add Diagnosis</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* ICD-10 Search */}
          <div>
            <label className="block text-sm font-medium mb-1">Search ICD-10 Codes</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Search for diagnosis codes..."
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full bg-white border rounded-b shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.code}
                      type="button"
                      onClick={() => selectDiagnosis(result)}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b"
                    >
                      <div className="font-medium">{result.code}</div>
                      <div className="text-sm text-gray-600">{result.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Diagnosis */}
          {formData.icd10Code && (
            <div className="p-3 bg-blue-50 rounded">
              <div className="font-medium text-blue-800">{formData.icd10Code}</div>
              <div className="text-sm text-blue-600">{formData.description}</div>
            </div>
          )}

          {/* Diagnosis Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'differential' | 'final' }))}
              className="w-full border rounded px-3 py-2"
            >
              <option value="differential">Differential Diagnosis</option>
              <option value="final">Final Diagnosis</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              rows={3}
              placeholder="Additional notes about this diagnosis..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.icd10Code}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Diagnosis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}