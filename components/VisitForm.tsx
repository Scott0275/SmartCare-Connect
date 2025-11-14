"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { addVisit } from "@/services/visits";
import toast from "react-hot-toast";

type Mode = "doctor" | "nurse";

export default function VisitForm({
  mode,
  patientId,
  onSubmit,
}: {
  mode: Mode;
  patientId: string;
  onSubmit?: () => void;
}) {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { patientId };
      if (mode === "nurse") {
        payload.nurseId = user?.uid || null;
        payload.symptoms = symptoms;
        payload.notes = notes;
      } else {
        payload.doctorId = user?.uid || null;
        payload.diagnosis = diagnosis;
        payload.notes = notes;
      }

      await addVisit(payload);
      toast.success("Visit saved");
      setSymptoms("");
      setDiagnosis("");
      setNotes("");
      onSubmit && onSubmit();
    } catch (err) {
      console.error(err);
      toast.error("Error saving visit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "nurse" && (
        <div>
          <label className="block text-sm font-medium">Symptoms</label>
          <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
        </div>
      )}

      {mode === "doctor" && (
        <div>
          <label className="block text-sm font-medium">Diagnosis</label>
          <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded">
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
