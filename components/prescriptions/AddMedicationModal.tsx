"use client";
import React, { useState, useEffect } from "react";

export default function AddMedicationModal({
  onSubmit,
  existingMedication,
  onClose,
}: {
  onSubmit: (medication: any) => void;
  existingMedication?: any;
  onClose: () => void;
}) {
  const [name, setName] = useState(existingMedication?.name || "");
  const [dosage, setDosage] = useState(existingMedication?.dosage || "");
  const [frequency, setFrequency] = useState(existingMedication?.frequency || "");
  const [duration, setDuration] = useState(existingMedication?.duration || "");
  const [notes, setNotes] = useState(existingMedication?.notes || "");

  useEffect(() => {
    if (existingMedication) {
      setName(existingMedication.name || "");
      setDosage(existingMedication.dosage || "");
      setFrequency(existingMedication.frequency || "");
      setDuration(existingMedication.duration || "");
      setNotes(existingMedication.notes || "");
    }
  }, [existingMedication]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dosage || !frequency || !duration) return;
    onSubmit({ name, dosage, frequency, duration, notes });
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">{existingMedication ? "Edit Medication" : "Add Medication"}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Medication Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full border rounded px-3 py-2"
              placeholder="e.g., Amoxicillin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Dosage</label>
            <input
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              required
              className="mt-1 block w-full border rounded px-3 py-2"
              placeholder="e.g., 500mg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Frequency</label>
            <input
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              required
              className="mt-1 block w-full border rounded px-3 py-2"
              placeholder="e.g., 2x daily"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Duration</label>
            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              className="mt-1 block w-full border rounded px-3 py-2"
              placeholder="e.g., 5 days"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2"
              rows={2}
              placeholder="Additional instructions..."
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-3 py-1 rounded border">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}