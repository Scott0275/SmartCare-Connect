"use client";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import { getPatientById } from "@/services/patients";
import { getVisitsByPatient } from "@/services/visits";
import useRoleGuard from "@/hooks/useRoleGuard";
import { useAuth } from "@/context/AuthContext";
import VisitForm from "@/components/VisitForm";

export default function PatientProfilePage() {
  const { id } = useParams();
  const { loading } = useRoleGuard(["nurse", "doctor", "patient"]);
  const { role, user } = useAuth();

  const [patient, setPatient] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [indexUrl, setIndexUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const p = await getPatientById(id as string);
      setPatient(p);
      try {
        const vs = await getVisitsByPatient(id as string);
        setVisits(vs);
      } catch (err: any) {
        console.error("Error loading visits:", err);
        const msg = err?.message || String(err);
        // If Firestore suggests creating an index, its URL is included in the message — show it to the user
        toast.error(`Unable to load visits: ${msg}`);
        // Extract URL from error message and store it for display
        const m = msg.match(/https?:\/\/[^\s)]+/);
        if (m) setIndexUrl(m[0]);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Patient Profile</h1>
        <div className="flex items-center space-x-2">
          {(role === "nurse" || role === "doctor") && (
            <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-3 py-1 rounded">Add Visit</button>
          )}
          {role === "nurse" && (
            <a href={`/nurse/billing/${id}`} className="bg-emerald-600 text-white px-3 py-1 rounded">Create New Bill</a>
          )}
          {role === "doctor" && (
            <a href={`/doctor/billing/${id}`} className="bg-indigo-600 text-white px-3 py-1 rounded">Add Item to Bill</a>
          )}
          {role === "admin" && (
            <a href={`/admin/billing/${id}`} className="bg-gray-700 text-white px-3 py-1 rounded">Manage Bills</a>
          )}
          {role === "patient" && (
            <a href="#" className="bg-gray-300 text-black px-3 py-1 rounded">View Bills</a>
          )}
        </div>
      </div>

      {patient ? (
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-lg font-medium">{patient.firstName} {patient.lastName}</h2>
          <p>DOB: {patient.dateOfBirth}</p>
          <p>Gender: {patient.gender}</p>
          <p>Phone: {patient.phone}</p>
          <p>Address: {patient.address}</p>
        </div>
      ) : (
        <div>No patient found</div>
      )}

      {indexUrl && (
        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <div className="text-sm">
            Firestore index required to load visits. Create it in the console:{' '}
            <a href={indexUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline">Create index</a>
          </div>
          {role === 'admin' && (
            <div className="mt-2">
              <button
                onClick={async () => {
                  if (!user) return toast.error('Not authenticated');
                  try {
                    const idToken = await user.getIdToken();
                    const res = await fetch('/api/createIndex', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${idToken}`,
                      },
                      body: JSON.stringify({
                        collectionGroup: 'visits',
                        fields: [
                          { fieldPath: 'patientId', order: 'ASCENDING' },
                          { fieldPath: 'createdAt', order: 'DESCENDING' },
                        ],
                        queryScope: 'COLLECTION',
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      console.error('createIndex failed', data);
                      toast.error(data?.error?.message || 'Failed to create index');
                    } else {
                      toast.success('Index creation started. It may take a few minutes to build.');
                    }
                  } catch (err: any) {
                    console.error(err);
                    toast.error(err?.message || 'Error creating index');
                  }
                }}
                className="mt-2 inline-block bg-blue-600 text-white px-3 py-1 rounded"
              >
                Create index automatically (admin)
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {visits.map((v) => (
          <div key={v.id} className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">{new Date(v.createdAt?.toDate ? v.createdAt.toDate() : v.createdAt).toLocaleString()}</div>
            {v.symptoms && <p><strong>Symptoms:</strong> {v.symptoms}</p>}
            {v.diagnosis && <p><strong>Diagnosis:</strong> {v.diagnosis}</p>}
            {v.notes && <p><strong>Notes:</strong> {v.notes}</p>}
          </div>
        ))}
      </div>

      {showModal && id && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Add Visit</h3>
            <VisitForm
              mode={role === "doctor" ? "doctor" : "nurse"}
              patientId={id as string}
              onSubmit={async () => {
                try {
                  const vs = await getVisitsByPatient(id as string);
                  setVisits(vs);
                } catch (err: any) {
                  console.error("Error reloading visits after submit:", err);
                  toast.error(err?.message || "Error loading visits");
                }
                setShowModal(false);
              }}
            />
            <div className="mt-4 text-right">
              <button onClick={() => setShowModal(false)} className="text-sm text-gray-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
