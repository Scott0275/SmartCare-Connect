"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import useRoleGuard from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { getCachedData } from '@/lib/offlineDb';
import { getPatientTimeline } from '@/lib/emrService';
import Timeline from './components/Timeline';
import DiagnosisForm from './components/DiagnosisForm';
import EncounterForm from './components/EncounterForm';
import VitalsHistory from './components/VitalsHistory';
import AllergiesEditor from './components/AllergiesEditor';
import ChronicConditionsEditor from './components/ChronicConditionsEditor';

export default function PatientRecordsPage() {
  const { loading } = useRoleGuard(['doctor', 'nurse', 'pharmacy', 'labtech', 'admin']);
  const { user, role } = useAuth();
  const { id } = useParams() as { id: string };
  
  const [patient, setPatient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('timeline');
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);
  const [showEncounterForm, setShowEncounterForm] = useState(false);

  useEffect(() => {
    if (id) {
      loadPatientData();
      loadTimeline();
    }
  }, [id]);

  const loadPatientData = async () => {
    try {
      const cachedPatients = await getCachedData('cachedPatients') as any[];
      const patientData = cachedPatients?.find(p => p.id === id);
      setPatient(patientData);
    } catch (error) {
      console.error('Error loading patient data:', error);
    }
  };

  const loadTimeline = async () => {
    try {
      const events = await getPatientTimeline(id);
      setTimelineEvents(events);
    } catch (error) {
      console.error('Error loading timeline:', error);
    }
  };

  const canWrite = role === 'doctor' || role === 'nurse' || role === 'admin';
  const canAddDiagnosis = role === 'doctor' || role === 'admin';

  if (loading) return <div className="p-6">Loading...</div>;
  if (!patient) return <div className="p-6">Patient not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Patient Header */}
      <div className="sticky top-0 z-10 bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>ID: {patient.id}</span>
                <span>Age: {patient.age || 'N/A'}</span>
                <span>DOB: {patient.dateOfBirth || 'N/A'}</span>
              </div>
              {/* Allergies Badges */}
              {patient.allergies && patient.allergies.length > 0 && (
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-sm font-medium text-red-600">ALLERGIES:</span>
                  {patient.allergies.map((allergy: any, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      {allergy.allergen} ({allergy.severity})
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Quick Actions */}
            {canWrite && (
              <div className="flex space-x-2">
                {canAddDiagnosis && (
                  <button
                    onClick={() => setShowDiagnosisForm(true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Add Diagnosis
                  </button>
                )}
                <button
                  onClick={() => setShowEncounterForm(true)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Add Note
                </button>
                {role === 'nurse' && (
                  <button
                    onClick={() => setActiveTab('vitals')}
                    className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                  >
                    Add Vitals
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'timeline', label: 'Timeline', icon: '📅' },
              { id: 'vitals', label: 'Vitals', icon: '💓' },
              { id: 'diagnoses', label: 'Diagnoses', icon: '🩺' },
              { id: 'allergies', label: 'Allergies', icon: '⚠️' },
              { id: 'conditions', label: 'Chronic Conditions', icon: '📋' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'timeline' && (
            <Timeline events={timelineEvents} onRefresh={loadTimeline} />
          )}
          
          {activeTab === 'vitals' && (
            <VitalsHistory patientId={id} canAdd={role === 'nurse' || role === 'doctor'} />
          )}
          
          {activeTab === 'diagnoses' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Diagnoses</h3>
                {canAddDiagnosis && (
                  <button
                    onClick={() => setShowDiagnosisForm(true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Add Diagnosis
                  </button>
                )}
              </div>
              <div className="text-center text-gray-500 py-8">
                Diagnoses will be displayed here
              </div>
            </div>
          )}
          
          {activeTab === 'allergies' && (
            <AllergiesEditor 
              patientId={id} 
              patient={patient} 
              canEdit={canWrite}
              onUpdate={loadPatientData}
            />
          )}
          
          {activeTab === 'conditions' && (
            <ChronicConditionsEditor 
              patientId={id} 
              patient={patient} 
              canEdit={canWrite}
              onUpdate={loadPatientData}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showDiagnosisForm && (
        <DiagnosisForm
          patientId={id}
          onClose={() => setShowDiagnosisForm(false)}
          onSuccess={() => {
            setShowDiagnosisForm(false);
            loadTimeline();
          }}
        />
      )}

      {showEncounterForm && (
        <EncounterForm
          patientId={id}
          onClose={() => setShowEncounterForm(false)}
          onSuccess={() => {
            setShowEncounterForm(false);
            loadTimeline();
          }}
        />
      )}
    </div>
  );
}