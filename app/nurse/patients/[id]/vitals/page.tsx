"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useRoleGuard from "@/hooks/useRoleGuard";
import { useAuth } from "@/context/AuthContext";
import { createVitals } from "@/lib/vitalsService";
import { getCachedData } from "@/lib/offlineDb";
import toast from "react-hot-toast";

export default function VitalsEntryPage() {
  const { loading } = useRoleGuard(["nurse"]);
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [vitalsData, setVitalsData] = useState({
    bloodPressure: "",
    weight: "",
    temperature: "",
    pulse: "",
    spO2: "",
    rbs: "",
    notes: "",
  });

  useEffect(() => {
    if (id) {
      loadPatientData();
    }
  }, [id]);

  const loadPatientData = async () => {
    try {
      const cached = await getCachedData('cachedPatients') as any[];
      const patientData = cached?.find(p => p.id === id);
      setPatient(patientData);
    } catch (error) {
      console.error("Error loading patient:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setVitalsData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    setSubmitting(true);
    try {
      await createVitals(id, vitalsData, user.uid);
      
      toast.success(navigator.onLine ? 
        "Vitals recorded successfully" : 
        "Vitals saved offline - will sync when online"
      );
      
      router.push(`/nurse/patients/${id}`);
    } catch (error) {
      console.error("Error recording vitals:", error);
      toast.error("Error recording vitals");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!patient) return <div className="p-6">Patient not found</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Record Vitals</h1>
          <p className="text-gray-600">
            Patient: {patient.firstName} {patient.lastName}
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Blood Pressure (mmHg)
            </label>
            <input
              type="text"
              name="bloodPressure"
              value={vitalsData.bloodPressure}
              onChange={handleChange}
              placeholder="120/80"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Weight (kg)
            </label>
            <input
              type="number"
              name="weight"
              value={vitalsData.weight}
              onChange={handleChange}
              step="0.1"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Temperature (°C)
            </label>
            <input
              type="number"
              name="temperature"
              value={vitalsData.temperature}
              onChange={handleChange}
              step="0.1"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Pulse (bpm)
            </label>
            <input
              type="number"
              name="pulse"
              value={vitalsData.pulse}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              SpO₂ (%)
            </label>
            <input
              type="number"
              name="spO2"
              value={vitalsData.spO2}
              onChange={handleChange}
              min="0"
              max="100"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              RBS (mg/dL)
            </label>
            <input
              type="number"
              name="rbs"
              value={vitalsData.rbs}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={vitalsData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded px-3 py-2"
              placeholder="Additional observations..."
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Recording..." : "Record Vitals"}
          </button>
        </div>
      </form>
    </div>
  );
}