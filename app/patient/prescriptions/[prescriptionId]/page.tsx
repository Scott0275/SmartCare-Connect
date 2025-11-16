"use client";
import React, { useEffect, useState } from "react";
import useRoleGuard from "@/hooks/useRoleGuard";
import { useParams } from "next/navigation";
import { getPrescriptionById } from "@/lib/prescriptionService";

export default function PatientPrescriptionView() {
  const { loading } = useRoleGuard(["patient", "nurse", "doctor", "admin"]);
  const { prescriptionId } = useParams() as { prescriptionId: string };
  const [prescription, setPrescription] = useState<any | null>(null);

  useEffect(() => {
    if (!prescriptionId) return;
    async function load() {
      const p = await getPrescriptionById(prescriptionId);
      setPrescription(p);
    }
    load();
  }, [prescriptionId]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!prescription) return <div className="p-6">Prescription not found</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">My Prescription</h1>
      
      <div className="bg-white rounded shadow p-4 mb-4">
        <div className="mb-2"><strong>Prescribed:</strong> {new Date(prescription.createdAt?.toDate ? prescription.createdAt.toDate() : prescription.createdAt).toLocaleString()}</div>
        <div className="mb-2"><strong>Doctor ID:</strong> {prescription.doctorId}</div>
      </div>

      <div className="bg-white rounded shadow p-4 mb-4">
        <h3 className="font-medium mb-2">Diagnosis</h3>
        <p>{prescription.diagnosis}</p>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <h3 className="font-medium p-4 border-b">Medications</h3>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Medication</th>
              <th className="px-4 py-2 text-left">Dosage</th>
              <th className="px-4 py-2 text-left">Frequency</th>
              <th className="px-4 py-2 text-left">Duration</th>
              <th className="px-4 py-2 text-left">Instructions</th>
            </tr>
          </thead>
          <tbody>
            {prescription.medications.map((med: any, idx: number) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2 font-medium">{med.name}</td>
                <td className="px-4 py-2">{med.dosage}</td>
                <td className="px-4 py-2">{med.frequency}</td>
                <td className="px-4 py-2">{med.duration}</td>
                <td className="px-4 py-2">{med.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}