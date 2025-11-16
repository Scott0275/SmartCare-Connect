"use client";
import React, { useState, useEffect } from "react";
import useRoleGuard from "@/hooks/useRoleGuard";
import { searchPatientsOffline, getRecentPatients } from "@/lib/offlinePatientService";
import Link from "next/link";

export default function DoctorSearchPatientsPage() {
  const { loading } = useRoleGuard(["doctor"]);
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showRecent, setShowRecent] = useState(true);

  useEffect(() => {
    if (!query.trim()) {
      loadRecentPatients();
      setShowRecent(true);
    } else {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [query]);

  const loadRecentPatients = async () => {
    try {
      const recent = await getRecentPatients();
      setPatients(recent);
    } catch (error) {
      console.error("Error loading recent patients:", error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setSearching(true);
    setShowRecent(false);
    try {
      const results = await searchPatientsOffline(query);
      setPatients(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Search Patients</h1>
        <Link
          href="/doctor/consultations/start"
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Start Consultation
        </Link>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or patient ID..."
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Results */}
      <div className="bg-white rounded shadow">
        <div className="p-4 border-b">
          <h3 className="font-medium">
            {showRecent ? "Recent Patients" : `Search Results (${patients.length})`}
            {searching && <span className="ml-2 text-gray-500">Searching...</span>}
          </h3>
        </div>
        
        {patients.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {showRecent ? "No recent patients" : "No patients found"}
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
                  <div className="flex space-x-2">
                    <Link
                      href={`/doctor/patients/${patient.id}`}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      View Profile
                    </Link>
                    <Link
                      href={`/doctor/patients/${patient.id}/consultation`}
                      className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                    >
                      Consult
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}