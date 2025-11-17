"use client";
import React, { useState, useEffect } from 'react';
import useRoleGuard from '@/hooks/useRoleGuard';
import { searchPatientsOffline } from '@/lib/offlinePatientService';
import Link from 'next/link';

export default function NurseRecordsPage() {
  const { loading } = useRoleGuard(['nurse']);
  const [query, setQuery] = useState('');
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
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Patient Medical Records</h1>
      </div>

      {/* Search Patient */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <label className="block text-sm font-medium mb-2">Search Patient Records</label>
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
              {searching ? 'Searching...' : 'No patients found'}
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
                      {patient.chronicConditions && patient.chronicConditions.length > 0 && (
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-sm font-medium text-blue-600">CONDITIONS:</span>
                          {patient.chronicConditions.filter((c: any) => c.status === 'active').slice(0, 2).map((condition: any, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {condition.condition}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/patient/${patient.id}/records?tab=vitals`}
                        className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                      >
                        Add Vitals
                      </Link>
                      <Link
                        href={`/patient/${patient.id}/records`}
                        className="bg-teal-600 text-white px-3 py-1 rounded text-sm hover:bg-teal-700"
                      >
                        View Records
                      </Link>
                    </div>
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
            <div className="text-4xl mb-2">📋</div>
            <div>Search for a patient to view or update their medical records</div>
            <div className="text-sm mt-2">You can add vitals, encounter notes, and manage chronic conditions</div>
          </div>
        </div>
      )}
    </div>
  );
}