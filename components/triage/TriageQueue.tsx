import React, { useState } from 'react';
import TriageCard from './TriageCard';
import UrgencyBadge from './UrgencyBadge';
import type { TriageRecord } from '@/lib/triageService';

interface TriageQueueProps {
  triageRecords: TriageRecord[];
  patientNames: { [patientId: string]: string };
  onStatusUpdate?: (triageId: string, status: TriageRecord['status']) => void;
  showFilters?: boolean;
}

export default function TriageQueue({ triageRecords, patientNames, onStatusUpdate, showFilters = true }: TriageQueueProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const filteredRecords = triageRecords.filter(record => {
    if (statusFilter !== 'all' && record.status !== statusFilter) return false;
    if (levelFilter !== 'all' && record.triageLevel !== levelFilter) return false;
    return true;
  });

  const getQueueStats = () => {
    const stats = {
      emergency: triageRecords.filter(t => t.triageLevel === 'emergency' && t.status !== 'closed').length,
      urgent: triageRecords.filter(t => t.triageLevel === 'urgent' && t.status !== 'closed').length,
      semiUrgent: triageRecords.filter(t => t.triageLevel === 'semi-urgent' && t.status !== 'closed').length,
      nonUrgent: triageRecords.filter(t => t.triageLevel === 'non-urgent' && t.status !== 'closed').length,
      total: triageRecords.filter(t => t.status !== 'closed').length,
    };
    return stats;
  };

  const stats = getQueueStats();

  return (
    <div className="space-y-6">
      {/* Queue Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Queue</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-red-600">{stats.emergency}</div>
          <div className="text-sm text-gray-600">Emergency</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.urgent}</div>
          <div className="text-sm text-gray-600">Urgent</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.semiUrgent}</div>
          <div className="text-sm text-gray-600">Semi-Urgent</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-green-600">{stats.nonUrgent}</div>
          <div className="text-sm text-gray-600">Non-Urgent</div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="doctor_started">Doctor Started</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Urgency Filter</label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Levels</option>
                <option value="emergency">Emergency</option>
                <option value="urgent">Urgent</option>
                <option value="semi-urgent">Semi-Urgent</option>
                <option value="non-urgent">Non-Urgent</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setLevelFilter('all');
                }}
                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Triage Queue */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <div className="text-gray-500 mb-4">
              <div className="text-4xl mb-2">🏥</div>
              <div>No triage records found</div>
              {(statusFilter !== 'all' || levelFilter !== 'all') && (
                <div className="text-sm mt-2">Try adjusting your filters</div>
              )}
            </div>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <TriageCard
              key={record.id}
              triage={record}
              patientName={patientNames[record.patientId]}
              onStatusUpdate={onStatusUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
}