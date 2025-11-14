"use client";
import React, { useEffect, useState } from "react";
import useRoleGuard from "@/hooks/useRoleGuard";
import { getPatients } from "@/services/patients";

export default function DoctorPatientsPage() {
  const { loading } = useRoleGuard(["doctor"]);
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const data = await getPatients();
      setPatients(data);
    }
    load();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Patients</h1>

      <div className="overflow-auto bg-white rounded shadow">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">DOB</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Phone</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y">
            {patients.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => (window.location.href = `/patient/${p.id}`)}>
                <td className="px-6 py-4">{p.firstName} {p.lastName}</td>
                <td className="px-6 py-4">{p.dateOfBirth}</td>
                <td className="px-6 py-4">{p.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
