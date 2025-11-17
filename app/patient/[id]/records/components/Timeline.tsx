"use client";
import React, { useState } from 'react';

interface TimelineProps {
  events: any[];
  onRefresh: () => void;
}

export default function Timeline({ events, onRefresh }: TimelineProps) {
  const [filter, setFilter] = useState('all');

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'vital': return '💓';
      case 'diagnosis': return '🩺';
      case 'encounter': return '📝';
      case 'prescription': return '💊';
      case 'lab': return '🧪';
      case 'imaging': return '📷';
      case 'billing': return '💰';
      default: return '📋';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'vital': return 'bg-red-100 text-red-800';
      case 'diagnosis': return 'bg-blue-100 text-blue-800';
      case 'encounter': return 'bg-green-100 text-green-800';
      case 'prescription': return 'bg-purple-100 text-purple-800';
      case 'lab': return 'bg-yellow-100 text-yellow-800';
      case 'imaging': return 'bg-indigo-100 text-indigo-800';
      case 'billing': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEvents = filter === 'all' ? events : events.filter(e => e.type === filter);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Medical Timeline</h3>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="all">All Events</option>
            <option value="vital">Vitals</option>
            <option value="diagnosis">Diagnoses</option>
            <option value="encounter">Encounters</option>
            <option value="prescription">Prescriptions</option>
            <option value="lab">Lab Tests</option>
            <option value="imaging">Imaging</option>
            <option value="billing">Billing</option>
          </select>
          <button
            onClick={onRefresh}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">📅</div>
          <div>No events found</div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event, index) => (
            <div key={event.id} className="flex items-start space-x-4">
              {/* Timeline Line */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-sm">
                  {getEventIcon(event.type)}
                </div>
                {index < filteredEvents.length - 1 && (
                  <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
                )}
              </div>

              {/* Event Content */}
              <div className="flex-1 bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <p className="text-sm text-gray-600">{event.description}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getEventColor(event.type)}`}>
                      {event.type.toUpperCase()}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(event.timestamp?.toDate ? event.timestamp.toDate() : event.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                {event.type === 'vital' && event.data && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600 mt-2">
                    {event.data.bloodPressure && <div>BP: {event.data.bloodPressure}</div>}
                    {event.data.temperature && <div>Temp: {event.data.temperature}°C</div>}
                    {event.data.pulse && <div>Pulse: {event.data.pulse} bpm</div>}
                    {event.data.spO2 && <div>SpO₂: {event.data.spO2}%</div>}
                  </div>
                )}

                {event.type === 'prescription' && event.data?.medications && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-600">Medications:</div>
                    <div className="text-xs text-gray-700">
                      {event.data.medications.slice(0, 2).map((med: any, idx: number) => (
                        <div key={idx}>{med.name} - {med.dosage}</div>
                      ))}
                      {event.data.medications.length > 2 && (
                        <div>+{event.data.medications.length - 2} more</div>
                      )}
                    </div>
                  </div>
                )}

                {event.type === 'lab' && event.data?.results && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-600">Results:</div>
                    <div className="text-xs text-gray-700">
                      {event.data.results.slice(0, 2).map((result: any, idx: number) => (
                        <div key={idx}>
                          {result.testName}: {result.value} {result.unit}
                          {result.flag && result.flag !== 'Normal' && (
                            <span className="ml-1 text-red-600">({result.flag})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {event.type === 'encounter' && event.data?.soap && (
                  <div className="mt-2 text-xs text-gray-700">
                    {event.data.soap.assessment && (
                      <div><strong>Assessment:</strong> {event.data.soap.assessment.substring(0, 100)}...</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}