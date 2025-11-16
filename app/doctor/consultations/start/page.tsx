"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useRoleGuard from "@/hooks/useRoleGuard";
import { searchPatientsOffline } from "@/lib/offlinePatientService";

export default function StartConsultationPage() {
  const { loading } = useRoleGuard(["doctor"]);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.trim()) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setPatients([]);
    }
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setSearching(true);
    try {
      const results = await searchPatientsOffline(query);
      setPatients(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const startConsultation = (patientId: string) => {
    router.push(`/doctor/patients/${patientId}/consultation`);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Start Consultation</h1>
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>

      {/* Search Patient */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <label className="block text-sm font-medium mb-2">Search Patient</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or patient ID..."
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Patient Results */}
      {query && (
        <div className="bg-white rounded shadow">
          <div className="p-4 border-b">
            <h3 className="font-medium">
              Search Results ({patients.length})
              {searching && <span className="ml-2 text-gray-500">Searching...</span>}
            </h3>
          </div>
          
          {patients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searching ? "Searching..." : "No patients found"}
            </div>
          ) : (
            <div className="divide-y">
              {patients.map((patient) => (
                <div key={patient.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-lg">
                        {patient.firstName} {patient.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        ID: {patient.id}
                      </div>
                      <div className="text-sm text-gray-600">
                        Email: {patient.email}
                      </div>
                      {patient.phone && (
                        <div className="text-sm text-gray-600">
                          Phone: {patient.phone}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => startConsultation(patient.id)}
                      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                    >
                      Start Consultation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!query && (
        <div className="bg-white rounded shadow p-8 text-center">
          <div className="text-gray-500 mb-4">
            <div className="text-4xl mb-2">🔍</div>
            <div>Search for a patient to start consultation</div>
          </div>
        </div>
      )}
    </div>
  );
}