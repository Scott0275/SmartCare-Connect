"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import useRoleGuard from "@/hooks/useRoleGuard";
import { getCachedData } from "@/lib/offlineDb";
import { getVitalsForPatient } from "@/lib/vitalsService";
import { generatePatientQR } from "@/lib/qrService";
import Link from "next/link";

export default function NursePatientProfilePage() {
  const { loading } = useRoleGuard(["nurse"]);
  const { id } = useParams() as { id: string };
  const [patient, setPatient] = useState<any>(null);
  const [vitals, setVitals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("vitals");
  const [qrData, setQrData] = useState("");

  useEffect(() => {
    if (id) {
      loadPatientData();
      loadVitals();
      setQrData(generatePatientQR(id));
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

  const loadVitals = async () => {
    try {
      const vitalsData = await getVitalsForPatient(id);
      setVitals(vitalsData);
    } catch (error) {
      console.error("Error loading vitals:", error);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return "N/A";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!patient) return <div className="p-6">Patient not found</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold">
                {patient.firstName} {patient.lastName}
              </h1>
              <div className="text-gray-600">
                <div>ID: {patient.id}</div>
                <div>Age: {calculateAge(patient.dateOfBirth)}</div>
                <div>Gender: {patient.gender || "N/A"}</div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center mb-2">
              <span className="text-xs">QR Code</span>
            </div>
            <div className="text-xs text-gray-500">Patient QR</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 mb-6">
        <Link
          href={`/nurse/patients/${id}/vitals`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Record Vitals
        </Link>
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Add Visit Note
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {["vitals", "history", "visits", "allergies"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "vitals" && (
        <div className="bg-white rounded shadow">
          <div className="p-4 border-b">
            <h3 className="font-medium">Recent Vitals</h3>
          </div>
          {vitals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No vitals recorded yet
            </div>
          ) : (
            <div className="divide-y">
              {vitals.slice(0, 5).map((vital, index) => (
                <div key={vital.id || index} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-gray-500">
                      {new Date(vital.createdAt?.toDate ? vital.createdAt.toDate() : vital.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>BP: {vital.bloodPressure || "N/A"}</div>
                    <div>Weight: {vital.weight || "N/A"} kg</div>
                    <div>Temp: {vital.temperature || "N/A"}°C</div>
                    <div>Pulse: {vital.pulse || "N/A"} bpm</div>
                    <div>SpO₂: {vital.spO2 || "N/A"}%</div>
                    <div>RBS: {vital.rbs || "N/A"} mg/dL</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white rounded shadow p-6">
          <h3 className="font-medium mb-4">Medical History</h3>
          <p className="text-gray-500">No medical history available</p>
        </div>
      )}

      {activeTab === "visits" && (
        <div className="bg-white rounded shadow p-6">
          <h3 className="font-medium mb-4">Visit History</h3>
          <p className="text-gray-500">No visits recorded</p>
        </div>
      )}

      {activeTab === "allergies" && (
        <div className="bg-white rounded shadow p-6">
          <h3 className="font-medium mb-4">Allergies</h3>
          <p className="text-gray-500">No allergies recorded</p>
        </div>
      )}
    </div>
  );
}