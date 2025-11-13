'use client';

import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import useRoleGuard from '../../../hooks/useRoleGuard';
import DashboardLayout from '../../../components/DashboardLayout';
import Link from 'next/link';

interface Patient {
  id: string;
  name: string;
  dob: string;
  gender: string;
}

const SearchPatientsPage = () => {
  const { loading } = useRoleGuard(['nurse']);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    const q = query(collection(db, 'patients'), where('name', '>=', searchTerm), where('name', '<=', searchTerm + '\uf8ff'));
    const querySnapshot = await getDocs(q);
    const patients = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
    setResults(patients);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Search Patients</h1>
      <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
        <form onSubmit={handleSearch} className="flex mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter patient name..."
            className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          />
          <button type="submit" className="px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700">
            Search
          </button>
        </form>

        <div>
          {searched && results.length === 0 && <p>No patients found.</p>}
          <ul className="space-y-4">
            {results.map(patient => (
              <li key={patient.id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <Link href={`/nurse/patient/${patient.id}`}>
                  <div className="font-semibold text-teal-600 hover:underline">{patient.name}</div>
                  <div className="text-sm text-gray-600">DOB: {patient.dob} | Gender: {patient.gender}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SearchPatientsPage;
