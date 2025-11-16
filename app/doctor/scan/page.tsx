"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import useRoleGuard from "@/hooks/useRoleGuard";
import { parsePatientQR } from "@/lib/qrService";
import { getCachedData } from "@/lib/offlineDb";
import toast from "react-hot-toast";

export default function DoctorQRScanPage() {
  const { loading } = useRoleGuard(["doctor"]);
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState("");

  const handleScan = async (data: string | null) => {
    if (!data) return;
    
    try {
      const result = parsePatientQR(data);
      if (result) {
        const cached = await getCachedData('cachedPatients') as any[];
        const patient = cached?.find(p => p.id === result.patientId);
        
        if (patient) {
          toast.success(`Patient found: ${patient.firstName} ${patient.lastName}`);
          router.push(`/doctor/patients/${result.patientId}`);
        } else {
          toast.error("Patient record not available offline");
        }
      } else {
        toast.error("Invalid QR code");
      }
    } catch (error) {
      console.error("QR scan error:", error);
      toast.error("Error processing QR code");
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    
    try {
      let patientId = manualInput.trim();
      const qrResult = parsePatientQR(manualInput);
      if (qrResult) {
        patientId = qrResult.patientId;
      }
      
      const cached = await getCachedData('cachedPatients') as any[];
      const patient = cached?.find(p => p.id === patientId);
      
      if (patient) {
        toast.success(`Patient found: ${patient.firstName} ${patient.lastName}`);
        router.push(`/doctor/patients/${patientId}`);
      } else {
        toast.error("Patient not found in offline records");
      }
    } catch (error) {
      console.error("Manual input error:", error);
      toast.error("Patient not found");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Scan Patient QR Code</h1>
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>

      {/* QR Scanner */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h3 className="font-medium mb-4">Camera Scanner</h3>
        
        {!scanning ? (
          <div className="text-center">
            <div className="w-64 h-64 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4">
              <div className="text-center">
                <div className="text-4xl mb-2">📷</div>
                <div className="text-gray-500">Camera Scanner</div>
              </div>
            </div>
            <button
              onClick={() => setScanning(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Start Camera
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-64 h-64 mx-auto bg-gray-900 rounded-lg flex items-center justify-center mb-4">
              <div className="text-white">Camera Active</div>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => setScanning(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Stop Camera
              </button>
              <button
                onClick={() => handleScan('{"type":"patient","id":"test-patient-123","timestamp":1234567890}')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Simulate Scan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Input */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h3 className="font-medium mb-4">Manual Entry</h3>
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Patient ID or QR Code Data
            </label>
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter patient ID or paste QR code data"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
          >
            Find Patient
          </button>
        </form>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded shadow p-6">
        <h3 className="font-medium mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/doctor/patients/search')}
            className="bg-blue-600 text-white p-4 rounded hover:bg-blue-700 text-left"
          >
            <div className="font-medium">Search Patients</div>
            <div className="text-sm opacity-90">Find patients by name or ID</div>
          </button>
          <button
            onClick={() => router.push('/doctor/consultations/start')}
            className="bg-purple-600 text-white p-4 rounded hover:bg-purple-700 text-left"
          >
            <div className="font-medium">Start Consultation</div>
            <div className="text-sm opacity-90">Begin new patient consultation</div>
          </button>
        </div>
      </div>

      {/* Offline Notice */}
      {!navigator.onLine && (
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="text-sm text-yellow-700">
            <strong>Offline Mode:</strong> Only patients in your local cache can be accessed.
            Connect to internet to access all patient records.
          </div>
        </div>
      )}
    </div>
  );
}