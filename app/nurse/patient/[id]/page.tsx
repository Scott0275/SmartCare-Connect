'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import useRoleGuard from '../../../../hooks/useRoleGuard';
import DashboardLayout from '../../../../components/DashboardLayout';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Patient {
  name: string;
  dob: string;
  gender: string;
  contact: string;
}

interface Vital {
  id: string;
  date: string;
  temperature: string;
  bloodPressure: string;
  heartRate: string;
  respiratoryRate: string;
}

const PatientProfilePage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { loading } = useRoleGuard(['nurse', 'doctor']);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [activeTab, setActiveTab] = useState('Vitals');

  useEffect(() => {
    if (id) {
      const fetchPatient = async () => {
        const docRef = doc(db, 'patients', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPatient(docSnap.data() as Patient);
        }
      };
      fetchPatient();

      const vitalsQuery = query(collection(db, 'patients', id as string, 'vitals'), orderBy('date', 'desc'));
      const unsubscribe = onSnapshot(vitalsQuery, (snapshot) => {
        const vitalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vital));
        setVitals(vitalsData);
      });

      return () => unsubscribe();
    }
  }, [id]);

  if (loading || !patient) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="bg-white p-8 rounded-lg shadow-md mb-6">
        <h1 className="text-3xl font-bold">{patient.name}</h1>
        <p className="text-gray-600">DOB: {patient.dob} | Gender: {patient.gender} | Contact: {patient.contact}</p>
      </div>

      <div className="flex border-b mb-6">
        <TabButton title="History" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton title="Visits" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton title="Vitals" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton title="Medications" activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      <div>
        {activeTab === 'History' && <div>Patient History Content</div>}
        {activeTab === 'Visits' && <div>Patient Visits Content</div>}
        {activeTab === 'Vitals' && 
          <div>
            <Link href={`/nurse/vitals/new?patientId=${id}`}>
              <button className="mb-4 bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors">New Vitals</button>
            </Link>
            <div className="space-y-4">
              {vitals.map(vital => (
                <div key={vital.id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <p>Date: {new Date(vital.date).toLocaleDateString()}</p>
                  <p>Temperature: {vital.temperature}°C</p>
                  <p>Blood Pressure: {vital.bloodPressure}</p>
                  <p>Heart Rate: {vital.heartRate} bpm</p>
                  <p>Respiratory Rate: {vital.respiratoryRate} breaths/min</p>
                </div>
              ))}
            </div>
          </div>
        }
        {activeTab === 'Medications' && <div>Patient Medications Content</div>}
      </div>
    </DashboardLayout>
  );
};

const TabButton = ({ title, activeTab, setActiveTab }: { title: string, activeTab: string, setActiveTab: (title: string) => void }) => (
  <button
    onClick={() => setActiveTab(title)}
    className={`px-4 py-2 -mb-px font-semibold text-gray-800 border-b-2 ${activeTab === title ? 'border-teal-500' : 'border-transparent'}`}>
    {title}
  </button>
);

export default PatientProfilePage;
