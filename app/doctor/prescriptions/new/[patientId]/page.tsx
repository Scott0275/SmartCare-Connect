"use client";
import React, { useState } from "react";
import useRoleGuard from "@/hooks/useRoleGuard";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createPrescription } from "@/lib/offlinePrescriptionService";
import AddMedicationModal from "@/components/prescriptions/AddMedicationModal";
import toast from "react-hot-toast";

export default function NewPrescriptionPage() {
  const { loading } = useRoleGuard(["doctor"]);
  const { user } = useAuth();
  const router = useRouter();
  const { patientId } = useParams() as { patientId: string };

  const [diagnosis, setDiagnosis] = useState("");
  const [medications, setMedications] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  if (loading) return <div className="p-6">Loading...</div>;

  const addMedication = (medication: any) => {
    if (editingIndex !== null) {
      setMedications(prev => prev.map((med, idx) => idx === editingIndex ? medication : med));
      setEditingIndex(null);
    } else {
      setMedications(prev => [...prev, medication]);
    }
  };

  const editMedication = (index: number) => {
    setEditingIndex(index);
    setShowModal(true);
  };

  const deleteMedication = (index: number) => {
    setMedications(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    if (!user) return toast.error("Not authenticated");
    if (!diagnosis.trim()) return toast.error("Diagnosis is required");
    if (medications.length === 0) return toast.error("Add at least one medication");

    try {
      await createPrescription(patientId, user.uid, { diagnosis, medications });
      toast.success(navigator.onLine ? "Prescription created successfully" : "Prescription saved offline - will sync when online");
      router.push(`/patient/${patientId}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Error creating prescription");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">New Prescription</h1>
        <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-3 py-1 rounded">
          Add Medication
        </button>
      </div>

      <div className="bg-white rounded shadow p-4 mb-4">
        <label className="block text-sm font-medium mb-2">Diagnosis</label>
        <textarea
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          className="w-full border rounded px-3 py-2"
          rows={3}
          placeholder="Enter diagnosis..."
          required
        />
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Medication</th>
              <th className="px-4 py-2 text-left">Dosage</th>
              <th className="px-4 py-2 text-left">Frequency</th>
              <th className="px-4 py-2 text-left">Duration</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {medications.map((med, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2">{med.name}</td>
                <td className="px-4 py-2">{med.dosage}</td>
                <td className="px-4 py-2">{med.frequency}</td>
                <td className="px-4 py-2">{med.duration}</td>
                <td className="px-4 py-2">
                  <button onClick={() => editMedication(idx)} className="text-sm text-indigo-600 mr-2">Edit</button>
                  <button onClick={() => deleteMedication(idx)} className="text-sm text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {medications.length === 0 && (
          <div className="text-center py-8 text-gray-500">No medications added yet</div>
        )}
      </div>

      <div className="mt-4 text-right">
        <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">
          Save Prescription
        </button>
      </div>

      {showModal && (
        <AddMedicationModal
          existingMedication={editingIndex !== null ? medications[editingIndex] : undefined}
          onSubmit={addMedication}
          onClose={() => {
            setShowModal(false);
            setEditingIndex(null);
          }}
        />
      )}
    </div>
  );
}