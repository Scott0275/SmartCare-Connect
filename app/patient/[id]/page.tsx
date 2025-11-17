"use client";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import { getPatientById } from "@/services/patients";
import { getVisitsByPatient } from "@/services/visits";
import { getBillsForPatient, markBillAsPaid } from "@/lib/billingService";
import { getPrescriptionsForPatient } from "@/lib/prescriptionService";
import { getLabRequestsForPatient } from "@/lib/labService";
import { getCachedData } from "@/lib/offlineDb";
import useRoleGuard from "@/hooks/useRoleGuard";
import { useAuth } from "@/context/AuthContext";
import VisitForm from "@/components/VisitForm";

export default function PatientProfilePage() {
  const { id } = useParams();
  const { loading } = useRoleGuard(["nurse", "doctor", "patient"]);
  const { role, user } = useAuth();

  const [patient, setPatient] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labRequests, setLabRequests] = useState<any[]>([]);
  const [dispensations, setDispensations] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [indexUrl, setIndexUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('visits');

  useEffect(() => {
    if (!id) return;
    async function load() {
      const p = await getPatientById(id as string);
      setPatient(p);
      try {
        const vs = await getVisitsByPatient(id as string);
        setVisits(vs);
        const bs = await getBillsForPatient(id as string);
        setBills(bs);
        const ps = await getPrescriptionsForPatient(id as string);
        setPrescriptions(ps);
        const ls = await getLabRequestsForPatient(id as string);
        setLabRequests(ls);
        const ds = await getCachedData('cachedDispensations') as any[];
        const patientDispensations = ds?.filter(d => d.patientId === id) || [];
        setDispensations(patientDispensations);
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
            <>
              <a href={`/doctor/billing/${id}`} className="bg-indigo-600 text-white px-3 py-1 rounded">Add Item to Bill</a>
              <a href={`/doctor/prescriptions/new/${id}`} className="bg-purple-600 text-white px-3 py-1 rounded">Create Prescription</a>
            </>
          )}
          <a href={`/patient/${id}/records`} className="bg-teal-600 text-white px-3 py-1 rounded">Medical Records</a>
          {role === "admin" && (
            <button onClick={() => setActiveTab('billing')} className="bg-gray-700 text-white px-3 py-1 rounded">Manage Bills</button>
          )}
          {role === "patient" && (
            <button onClick={() => setActiveTab('billing')} className="bg-gray-300 text-black px-3 py-1 rounded">View Bills</button>
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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('visits')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'visits'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Visits
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'billing'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Billing
          </button>
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'prescriptions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Prescriptions
          </button>
          <button
            onClick={() => setActiveTab('labs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'labs'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Labs & Imaging
          </button>
          <button
            onClick={() => setActiveTab('medications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'medications'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Medications
          </button>
          <a
            href={`/patient/${id}/records`}
            className="py-2 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            📋 Full Medical Records
          </a>
        </nav>
      </div>

      {/* Visits Tab */}
      {activeTab === 'visits' && (
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
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          {bills.map((bill) => (
            <div key={bill.id} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium">Bill #{bill.id}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(bill.createdAt?.toDate ? bill.createdAt.toDate() : bill.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${bill.totalAmount.toFixed(2)}</div>
                  <div className={`text-sm px-2 py-1 rounded ${
                    bill.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {bill.status}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <a
                  href={`/patient/billing/${bill.id}`}
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  View Details
                </a>
                {role === 'admin' && bill.status === 'unpaid' && (
                  <button
                    onClick={async () => {
                      await markBillAsPaid(bill.id);
                      const bs = await getBillsForPatient(id as string);
                      setBills(bs);
                      toast.success('Bill marked as paid');
                    }}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Mark Paid
                  </button>
                )}
                {role === 'admin' && (
                  <a
                    href={`/admin/billing/${bill.id}`}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-sm ml-2"
                  >
                    Manage
                  </a>
                )}
              </div>
            </div>
          ))}
          {bills.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No bills found for this patient.
            </div>
          )}
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <div key={prescription.id} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium">Prescription #{prescription.id}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(prescription.createdAt?.toDate ? prescription.createdAt.toDate() : prescription.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <strong>Diagnosis:</strong> {prescription.diagnosis}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {prescription.medications?.length || 0} medication(s)
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <a
                  href={`/${role}/prescriptions/${prescription.id}`}
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  View Details
                </a>
                {role === 'admin' && (
                  <a
                    href={`/admin/prescriptions/edit/${prescription.id}`}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Edit
                  </a>
                )}
              </div>
            </div>
          ))}
          {prescriptions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No prescriptions found for this patient.
            </div>
          )}
        </div>
      )}

      {/* Labs & Imaging Tab */}
      {activeTab === 'labs' && (
        <div className="space-y-4">
          {labRequests.map((request) => (
            <div key={request.id} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium">Lab Request #{request.id}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(request.createdAt?.toDate ? request.createdAt.toDate() : request.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <strong>Tests:</strong> {request.tests?.map((t: any) => t.name).join(', ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm px-2 py-1 rounded ${
                    request.status === 'completed' ? 'bg-green-100 text-green-800' :
                    request.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {request.status?.replace('_', ' ').toUpperCase()}
                  </div>
                  {request.priority && (
                    <div className={`text-xs px-1 py-0.5 rounded mt-1 ${
                      request.priority === 'stat' ? 'bg-red-100 text-red-800' :
                      request.priority === 'urgent' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {request.priority.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              {request.results && request.results.length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <div className="text-sm font-medium mb-2">Results:</div>
                  {request.results.map((result: any, idx: number) => (
                    <div key={idx} className="text-sm mb-1">
                      <span className="font-medium">{result.testName}:</span> {result.value} {result.unit}
                      {result.flag && result.flag !== 'Normal' && (
                        <span className={`ml-2 px-1 py-0.5 rounded text-xs ${
                          result.flag === 'Critical' ? 'bg-red-100 text-red-800' :
                          result.flag === 'High' ? 'bg-orange-100 text-orange-800' :
                          result.flag === 'Low' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {result.flag}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between items-center mt-3">
                <div className="text-sm text-gray-500">
                  Priority: {request.priority || 'Normal'}
                </div>
                {request.attachments && request.attachments.length > 0 && (
                  <div className="text-sm text-blue-600">
                    📎 {request.attachments.length} attachment(s)
                  </div>
                )}
              </div>
            </div>
          ))}
          {labRequests.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No lab requests found for this patient.
            </div>
          )}
        </div>
      )}

      {/* Medications Tab */}
      {activeTab === 'medications' && (
        <div className="space-y-4">
          {dispensations.map((dispensation) => (
            <div key={dispensation.id} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium">Dispensation #{dispensation.id}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(dispensation.dispensedAt?.toDate ? dispensation.dispensedAt.toDate() : dispensation.dispensedAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                  Dispensed
                </div>
              </div>
              
              <div className="mt-3">
                <div className="text-sm font-medium mb-2">Medications:</div>
                {dispensation.medications?.map((med: any, idx: number) => (
                  <div key={idx} className="text-sm mb-2 p-2 bg-gray-50 rounded">
                    <div className="font-medium">{med.name}</div>
                    <div className="text-gray-600">
                      Dispensed: {med.quantityDispensed} / Prescribed: {med.quantityPrescribed}
                    </div>
                    {med.substitution && (
                      <div className="text-blue-600">Substitution: {med.substitution}</div>
                    )}
                    {med.notes && (
                      <div className="text-gray-600">Notes: {med.notes}</div>
                    )}
                  </div>
                ))}
              </div>
              
              {dispensation.notes && (
                <div className="mt-3 p-2 bg-blue-50 rounded">
                  <div className="text-sm font-medium text-blue-800">Pharmacist Notes:</div>
                  <div className="text-sm text-blue-700">{dispensation.notes}</div>
                </div>
              )}
            </div>
          ))}
          {dispensations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No medications dispensed for this patient.
            </div>
          )}
        </div>
      )}

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
