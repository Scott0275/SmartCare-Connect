"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useRoleGuard from "@/hooks/useRoleGuard";
import { useAuth } from "@/context/AuthContext";
import { getCachedData } from "@/lib/offlineDb";
import { getVitalsForPatient } from "@/lib/vitalsService";
import { createConsultation, updateConsultation } from "@/lib/consultationService";
import { searchICD10 } from "@/lib/icd10Data";
import { LAB_TESTS, createLabRequest } from "@/lib/labService";
import toast from "react-hot-toast";

export default function ConsultationPage() {
  const { loading } = useRoleGuard(["doctor"]);
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();
  
  const [patient, setPatient] = useState<any>(null);
  const [vitals, setVitals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("summary");
  const [consultationData, setConsultationData] = useState({
    chiefComplaint: "",
    historyOfPresentingIllness: "",
    reviewOfSystems: "",
    physicalExamination: "",
    impression: "",
    diagnoses: [] as any[],
    medications: [] as any[],
    labRequests: [] as any[],
    treatmentPlan: "",
  });
  
  const [diagnosisSearch, setDiagnosisSearch] = useState("");
  const [diagnosisResults, setDiagnosisResults] = useState<any[]>([]);
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadPatientData();
      loadVitals();
      // Auto-save every 10 seconds
      const interval = setInterval(autoSave, 10000);
      return () => clearInterval(interval);
    }
  }, [id]);

  useEffect(() => {
    if (diagnosisSearch.length > 1) {
      const results = searchICD10(diagnosisSearch);
      setDiagnosisResults(results);
    } else {
      setDiagnosisResults([]);
    }
  }, [diagnosisSearch]);

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

  const autoSave = async () => {
    if (!user || !consultationData.chiefComplaint) return;
    
    try {
      // Save draft to IndexedDB
      const draftKey = `consultation_draft_${id}`;
      localStorage.setItem(draftKey, JSON.stringify(consultationData));
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setConsultationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addDiagnosis = (diagnosis: any) => {
    setConsultationData(prev => ({
      ...prev,
      diagnoses: [...prev.diagnoses, { ...diagnosis, isPrimary: prev.diagnoses.length === 0 }]
    }));
    setDiagnosisSearch("");
    setDiagnosisResults([]);
  };

  const removeDiagnosis = (index: number) => {
    setConsultationData(prev => ({
      ...prev,
      diagnoses: prev.diagnoses.filter((_, i) => i !== index)
    }));
  };

  const addLabRequest = async () => {
    if (selectedLabTests.length === 0) return;
    
    try {
      const tests = LAB_TESTS.filter(test => selectedLabTests.includes(test.id));
      await createLabRequest(id, user!.uid, {
        tests,
        priority: 'normal',
        notes: 'Requested during consultation'
      });
      
      setConsultationData(prev => ({
        ...prev,
        labRequests: [...prev.labRequests, ...tests]
      }));
      
      setSelectedLabTests([]);
      toast.success("Lab requests added");
    } catch (error) {
      console.error("Error adding lab requests:", error);
      toast.error("Error adding lab requests");
    }
  };

  const saveConsultation = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      await createConsultation(id, user.uid, {
        ...consultationData,
        status: 'completed'
      });
      
      toast.success(navigator.onLine ? 
        "Consultation saved successfully" : 
        "Consultation saved offline - will sync when online"
      );
      
      // Clear draft
      localStorage.removeItem(`consultation_draft_${id}`);
      
      router.push(`/doctor/patients/${id}`);
    } catch (error) {
      console.error("Error saving consultation:", error);
      toast.error("Error saving consultation");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!patient) return <div className="p-6">Patient not found</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold">
              Consultation - {patient.firstName} {patient.lastName}
            </h1>
            <div className="text-gray-600">
              Patient ID: {patient.id} | Age: {patient.age || "N/A"}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={saveConsultation}
              disabled={saving}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Consultation"}
            </button>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {["summary", "consultation", "diagnosis", "labs"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Patient Summary Tab */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-medium mb-3">Latest Vitals</h3>
            {vitals.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>BP: {vitals[0].bloodPressure || "N/A"}</div>
                <div>Weight: {vitals[0].weight || "N/A"} kg</div>
                <div>Temp: {vitals[0].temperature || "N/A"}°C</div>
                <div>Pulse: {vitals[0].pulse || "N/A"} bpm</div>
                <div>SpO₂: {vitals[0].spO2 || "N/A"}%</div>
                <div>RBS: {vitals[0].rbs || "N/A"} mg/dL</div>
              </div>
            ) : (
              <p className="text-gray-500">No vitals recorded</p>
            )}
          </div>
          
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-medium mb-3">Patient Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Email: {patient.email}</div>
              <div>Phone: {patient.phone || "N/A"}</div>
              <div>Gender: {patient.gender || "N/A"}</div>
              <div>DOB: {patient.dateOfBirth || "N/A"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Consultation Tab */}
      {activeTab === "consultation" && (
        <div className="space-y-6">
          <div className="bg-white rounded shadow p-4">
            <label className="block text-sm font-medium mb-2">Chief Complaint</label>
            <textarea
              value={consultationData.chiefComplaint}
              onChange={(e) => handleInputChange("chiefComplaint", e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={3}
              placeholder="Patient's main concern..."
            />
          </div>
          
          <div className="bg-white rounded shadow p-4">
            <label className="block text-sm font-medium mb-2">History of Presenting Illness</label>
            <textarea
              value={consultationData.historyOfPresentingIllness}
              onChange={(e) => handleInputChange("historyOfPresentingIllness", e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={4}
              placeholder="Detailed history of current illness..."
            />
          </div>
          
          <div className="bg-white rounded shadow p-4">
            <label className="block text-sm font-medium mb-2">Physical Examination</label>
            <textarea
              value={consultationData.physicalExamination}
              onChange={(e) => handleInputChange("physicalExamination", e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={4}
              placeholder="Physical examination findings..."
            />
          </div>
          
          <div className="bg-white rounded shadow p-4">
            <label className="block text-sm font-medium mb-2">Treatment Plan</label>
            <textarea
              value={consultationData.treatmentPlan}
              onChange={(e) => handleInputChange("treatmentPlan", e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={4}
              placeholder="Treatment plan and instructions..."
            />
          </div>
        </div>
      )}

      {/* Diagnosis Tab */}
      {activeTab === "diagnosis" && (
        <div className="space-y-6">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-medium mb-3">Add Diagnosis</h3>
            <div className="relative">
              <input
                type="text"
                value={diagnosisSearch}
                onChange={(e) => setDiagnosisSearch(e.target.value)}
                placeholder="Search ICD-10 codes..."
                className="w-full border rounded px-3 py-2"
              />
              {diagnosisResults.length > 0 && (
                <div className="absolute z-10 w-full bg-white border rounded-b shadow-lg max-h-60 overflow-y-auto">
                  {diagnosisResults.map((diagnosis) => (
                    <button
                      key={diagnosis.code}
                      onClick={() => addDiagnosis(diagnosis)}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b"
                    >
                      <div className="font-medium">{diagnosis.code}</div>
                      <div className="text-sm text-gray-600">{diagnosis.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-medium mb-3">Selected Diagnoses</h3>
            {consultationData.diagnoses.length === 0 ? (
              <p className="text-gray-500">No diagnoses selected</p>
            ) : (
              <div className="space-y-2">
                {consultationData.diagnoses.map((diagnosis, index) => (
                  <div key={index} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <span className="font-medium">{diagnosis.code}</span>
                      {diagnosis.isPrimary && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Primary</span>}
                      <div className="text-sm text-gray-600">{diagnosis.description}</div>
                    </div>
                    <button
                      onClick={() => removeDiagnosis(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Labs Tab */}
      {activeTab === "labs" && (
        <div className="space-y-6">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-medium mb-3">Request Lab Tests</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {LAB_TESTS.map((test) => (
                <label key={test.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedLabTests.includes(test.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLabTests(prev => [...prev, test.id]);
                      } else {
                        setSelectedLabTests(prev => prev.filter(id => id !== test.id));
                      }
                    }}
                  />
                  <span className="text-sm">{test.name}</span>
                </label>
              ))}
            </div>
            <button
              onClick={addLabRequest}
              disabled={selectedLabTests.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Add Selected Tests
            </button>
          </div>
          
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-medium mb-3">Requested Tests</h3>
            {consultationData.labRequests.length === 0 ? (
              <p className="text-gray-500">No lab tests requested</p>
            ) : (
              <div className="space-y-2">
                {consultationData.labRequests.map((test, index) => (
                  <div key={index} className="p-2 border rounded">
                    <div className="font-medium">{test.name}</div>
                    <div className="text-sm text-gray-600">{test.category}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}