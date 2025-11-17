import React from 'react';
import Link from 'next/link';
import UrgencyBadge from './UrgencyBadge';
import type { TriageRecord } from '@/lib/triageService';

interface TriageCardProps {
  triage: TriageRecord;
  patientName?: string;
  showActions?: boolean;
  onStatusUpdate?: (triageId: string, status: TriageRecord['status']) => void;
}

export default function TriageCard({ triage, patientName, showActions = true, onStatusUpdate }: TriageCardProps) {
  const getStatusColor = (status: TriageRecord['status']) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'doctor_started': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <UrgencyBadge level={triage.triageLevel} />
          <div>
            <h3 className="font-medium text-lg">{patientName || 'Unknown Patient'}</h3>
            <p className="text-sm text-gray-600">ID: {triage.patientId}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(triage.status)}`}>
          {triage.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700">Chief Complaint:</p>
        <p className="text-sm text-gray-600">{triage.complaint || 'No complaint recorded'}</p>
      </div>

      {triage.vitals && Object.keys(triage.vitals).length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 mb-1">Vitals:</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            {triage.vitals.temperature && <div>Temp: {triage.vitals.temperature}°F</div>}
            {triage.vitals.bloodPressure && <div>BP: {triage.vitals.bloodPressure}</div>}
            {triage.vitals.heartRate && <div>HR: {triage.vitals.heartRate} bpm</div>}
            {triage.vitals.oxygenSaturation && <div>O2: {triage.vitals.oxygenSaturation}%</div>}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
        <span>Created: {new Date(triage.createdAt).toLocaleString()}</span>
        {triage.appointmentId && <span>Appointment: {triage.appointmentId}</span>}
      </div>

      {showActions && (
        <div className="flex space-x-2">
          <Link
            href={`/triage/${triage.id}`}
            className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded text-sm hover:bg-blue-700"
          >
            View Details
          </Link>
          {triage.status === 'completed' && onStatusUpdate && (
            <button
              onClick={() => onStatusUpdate(triage.id, 'doctor_started')}
              className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700"
            >
              Start Encounter
            </button>
          )}
        </div>
      )}
    </div>
  );
}