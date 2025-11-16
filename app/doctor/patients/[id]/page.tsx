"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import useRoleGuard from "@/hooks/useRoleGuard";
import { getCachedData } from "@/lib/offlineDb";
import { getVitalsForPatient } from "@/lib/vitalsService";
import { getConsultationsForPatient } from "@/lib/consultationService";
import { getLabRequestsForPatient } from "@/lib/labService";
import { getPrescriptionsForPatient } from "@/lib/prescriptionService";
import Link from "next/link";

export default function DoctorPatientProfilePage() {
  const { loading } = useRoleGuard(["doctor"]);
  const { id } = useParams() as { id: string };
  const [patient, setPatient] = useState<any>(null);
  const [vitals, setVitals] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [labRequests, setLabRequests] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (id) {
      loadPatientData();
      loadVitals();
      loadConsultations();
      loadLabRequests();
      loadPrescriptions();
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

  const loadConsultations = async () => {
    try {
      const consultationsData = await getConsultationsForPatient(id);
      setConsultations(consultationsData);
    } catch (error) {
      console.error("Error loading consultations:", error);
    }
  };

  const loadLabRequests = async () => {
    try {
      const labData = await getLabRequestsForPatient(id);
      setLabRequests(labData);
    } catch (error) {
      console.error("Error loading lab requests:", error);
    }
  };

  const loadPrescriptions = async () => {
    try {
      const prescriptionsData = await getPrescriptionsForPatient(id);
      setPrescriptions(prescriptionsData);
    } catch (error) {
      console.error("Error loading prescriptions:", error);
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
          <div className="flex space-x-2">
            <Link
              href={`/doctor/patients/${id}/consultation`}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Start Consultation
            </Link>
            <Link
              href={`/doctor/prescriptions/new/${id}`}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              New Prescription
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {["overview", "consultations", "vitals", "labs", "prescriptions"].map((tab) => (
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

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-medium mb-3">Latest Vitals</h3>
            {vitals.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm text-gray-500">
                  {new Date(vitals[0].createdAt?.toDate ? vitals[0].createdAt.toDate() : vitals[0].createdAt).toLocaleString()}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>BP: {vitals[0].bloodPressure || "N/A"}</div>
                  <div>Weight: {vitals[0].weight || "N/A"} kg</div>
                  <div>Temp: {vitals[0].temperature || "N/A"}°C</div>
                  <div>Pulse: {vitals[0].pulse || "N/A"} bpm</div>
                  <div>SpO₂: {vitals[0].spO2 || "N/A"}%</div>
                  <div>RBS: {vitals[0].rbs || "N/A"} mg/dL</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No vitals recorded</p>
            )}
          </div>
          
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-medium mb-3">Recent Activity</h3>
            <div className="space-y-2 text-sm">
              {consultations.length > 0 && (
                <div>Last consultation: {new Date(consultations[0].createdAt?.toDate ? consultations[0].createdAt.toDate() : consultations[0].createdAt).toLocaleDateString()}</div>
              )}
              {prescriptions.length > 0 && (
                <div>Last prescription: {new Date(prescriptions[0].createdAt?.toDate ? prescriptions[0].createdAt.toDate() : prescriptions[0].createdAt).toLocaleDateString()}</div>
              )}
              {labRequests.length > 0 && (
                <div>Pending lab requests: {labRequests.filter(l => l.status === 'pending').length}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Consultations Tab */}
      {activeTab === "consultations" && (
        <div className="bg-white rounded shadow">
          <div className="p-4 border-b">
            <h3 className="font-medium">Consultation History</h3>
          </div>
          {consultations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No consultations recorded
            </div>
          ) : (
            <div className="divide-y">
              {consultations.map((consultation) => (
                <div key={consultation.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-gray-500">
                      {new Date(consultation.createdAt?.toDate ? consultation.createdAt.toDate() : consultation.createdAt).toLocaleString()}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      consultation.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {consultation.status}
                    </span>
                  </div>
                  <div className="text-sm">
                    <div><strong>Chief Complaint:</strong> {consultation.chiefComplaint || "N/A"}</div>
                    {consultation.diagnoses?.length > 0 && (
                      <div><strong>Diagnoses:</strong> {consultation.diagnoses.map((d: any) => d.description).join(", ")}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vitals Tab */}
      {activeTab === "vitals" && (
        <div className="bg-white rounded shadow">
          <div className="p-4 border-b">
            <h3 className="font-medium">Vitals History</h3>
          </div>
          {vitals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No vitals recorded
            </div>
          ) : (
            <div className="divide-y">
              {vitals.map((vital, index) => (
                <div key={vital.id || index} className="p-4">
                  <div className="text-sm text-gray-500 mb-2">
                    {new Date(vital.createdAt?.toDate ? vital.createdAt.toDate() : vital.createdAt).toLocaleString()}
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

      {/* Labs Tab */}
      {activeTab === "labs" && (
        <div className="bg-white rounded shadow">
          <div className="p-4 border-b">
            <h3 className="font-medium">Lab Requests</h3>
          </div>
          {labRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No lab requests
            </div>
          ) : (
            <div className="divide-y">
              {labRequests.map((request) => (
                <div key={request.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-gray-500">
                      {new Date(request.createdAt?.toDate ? request.createdAt.toDate() : request.createdAt).toLocaleString()}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      request.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="text-sm">
                    <strong>Tests:</strong> {request.tests?.map((t: any) => t.name).join(", ") || "N/A"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === "prescriptions" && (
        <div className="bg-white rounded shadow">
          <div className="p-4 border-b">
            <h3 className="font-medium">Prescriptions</h3>
          </div>
          {prescriptions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No prescriptions
            </div>
          ) : (
            <div className="divide-y">
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className="p-4">
                  <div className="text-sm text-gray-500 mb-2">
                    {new Date(prescription.createdAt?.toDate ? prescription.createdAt.toDate() : prescription.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm">
                    <div><strong>Diagnosis:</strong> {prescription.diagnosis}</div>
                    <div><strong>Medications:</strong> {prescription.medications?.length || 0} items</div>
                  </div>
                  <Link
                    href={`/doctor/prescriptions/${prescription.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}