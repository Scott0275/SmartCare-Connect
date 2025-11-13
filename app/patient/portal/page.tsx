'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import useRoleGuard from '../../../hooks/useRoleGuard';
import DashboardLayout from '../../../components/DashboardLayout';

interface Prescription {
    id: string;
    medication: string;
    dosage: string;
    frequency: string;
    notes: string;
}

const PatientPortalPage = () => {
    const { user } = useAuth();
    const { loading } = useRoleGuard(['patient']);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

    useEffect(() => {
        if (user) {
            // This assumes that the patient's user ID is used to link to their patient document ID.
            // This may need to be adjusted based on the actual data model.
            const fetchPrescriptions = async () => {
                const q = query(collection(db, 'patients', user.uid, 'prescriptions'));
                const querySnapshot = await getDocs(q);
                const prescriptionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prescription));
                setPrescriptions(prescriptionsData);
            };

            fetchPrescriptions();
        }
    }, [user]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-6">My Health Portal</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-4">My Prescriptions</h2>
                    <div className="space-y-4">
                        {prescriptions.map(prescription => (
                            <div key={prescription.id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                <p className="font-semibold text-lg">{prescription.medication}</p>
                                <p>Dosage: {prescription.dosage}</p>
                                <p>Frequency: {prescription.frequency}</p>
                                {prescription.notes && <p>Notes: {prescription.notes}</p>}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-4">My Billing</h2>
                    <p>Billing information will be available here soon.</p>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PatientPortalPage;
