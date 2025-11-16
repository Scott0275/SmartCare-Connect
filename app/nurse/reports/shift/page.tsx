"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import useRoleGuard from "@/hooks/useRoleGuard";
import { useAuth } from "@/context/AuthContext";
import { queueAction, executeWithOfflineSupport } from "@/lib/syncService";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

export default function ShiftReportPage() {
  const { loading } = useRoleGuard(["nurse"]);
  const { user } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [reportData, setReportData] = useState({
    patientsAttended: "",
    criticalCases: "",
    handoverNotes: "",
    shiftStart: "",
    shiftEnd: "",
    totalPatients: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value;
    setReportData(prev => ({
      ...prev,
      [e.target.name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    if (!reportData.patientsAttended || !reportData.shiftStart || !reportData.shiftEnd) {
      toast.error("Please fill in required fields");
      return;
    }

    setSubmitting(true);
    try {
      const reportId = uuidv4();
      const report = {
        ...reportData,
        nurseId: user.uid,
        nurseEmail: user.email,
        createdAt: Timestamp.now(),
        id: reportId,
      };

      await executeWithOfflineSupport(
        async () => {
          const ref = await addDoc(collection(db, 'shiftReports'), report);
          return { ...report, id: ref.id };
        },
        async () => {
          await queueAction('shiftReports', reportId, report, 'create');
          return report;
        }
      );
      
      toast.success(navigator.onLine ? 
        "Shift report submitted successfully" : 
        "Shift report saved offline - will sync when online"
      );
      
      router.push("/nurse/dashboard");
    } catch (error) {
      console.error("Error submitting shift report:", error);
      toast.error("Error submitting shift report");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">End of Shift Report</h1>
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
              Shift Start Time *
            </label>
            <input
              type="datetime-local"
              name="shiftStart"
              value={reportData.shiftStart}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Shift End Time *
            </label>
            <input
              type="datetime-local"
              name="shiftEnd"
              value={reportData.shiftEnd}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Total Patients Attended *
            </label>
            <input
              type="number"
              name="totalPatients"
              value={reportData.totalPatients}
              onChange={handleChange}
              min="0"
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Patients Attended (Details) *
            </label>
            <textarea
              name="patientsAttended"
              value={reportData.patientsAttended}
              onChange={handleChange}
              rows={4}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="List patient names/IDs and brief notes about care provided..."
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Critical Cases & Notes
            </label>
            <textarea
              name="criticalCases"
              value={reportData.criticalCases}
              onChange={handleChange}
              rows={4}
              className="w-full border rounded px-3 py-2"
              placeholder="Describe any critical cases, emergencies, or important observations..."
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Handover to Next Nurse
            </label>
            <textarea
              name="handoverNotes"
              value={reportData.handoverNotes}
              onChange={handleChange}
              rows={4}
              className="w-full border rounded px-3 py-2"
              placeholder="Important information for the next shift nurse..."
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
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </form>
    </div>
  );
}