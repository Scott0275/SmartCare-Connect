import React, { useState, useEffect } from 'react';
import { getTriageRecords } from '@/lib/triageService';
import UrgencyBadge from '@/components/triage/UrgencyBadge';
import Link from 'next/link';

interface TriageHistoryProps {
  patientId: string;
}

export default function TriageHistory({ patientId }: TriageHistoryProps) {
  const [triageRecords, setTriageRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTriageHistory();
  }, [patientId]);

  const loadTriageHistory = async () => {
    try {
      const records = await getTriageRecords();
      setTriageRecords(records);
    } catch (error) {
      console.error('Error loading triage history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'doctor_started': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Loading triage history...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Triage History</h3>
        <button
          onClick={loadTriageHistory}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Refresh
        </button>
      </div>

      {triageRecords.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🏥</div>
          <div>No triage records found</div>
        </div>
      ) : (
        <div className="space-y-4">
          {triageRecords.map((record) => (
            <div key={record.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <UrgencyBadge level={record.triageLevel} />
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(record.status)}`}>
                    {record.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(record.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700">Chief Complaint:</p>
                <p className="text-sm text-gray-600">{record.complaint || 'No complaint recorded'}</p>
              </div>

              {record.vitals && Object.keys(record.vitals).length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Vitals:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                    {record.vitals.temperature && <div>Temp: {record.vitals.temperature}°F</div>}
                    {record.vitals.bloodPressure && <div>BP: {record.vitals.bloodPressure}</div>}
                    {record.vitals.heartRate && <div>HR: {record.vitals.heartRate} bpm</div>}
                    {record.vitals.oxygenSaturation && <div>O2: {record.vitals.oxygenSaturation}%</div>}
                  </div>
                </div>
              )}

              {record.notes && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700">Notes:</p>
                  <p className="text-sm text-gray-600">{record.notes}</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  {record.appointmentId && <span>Appointment: {record.appointmentId}</span>}
                </div>
                <Link
                  href={`/triage/${record.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}