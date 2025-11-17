"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useRoleGuard from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { getLabRequestById, updateLabRequestStatus, submitLabResults, LabResult } from '@/lib/labTechService';
import { getCachedData } from '@/lib/offlineDb';
import toast from 'react-hot-toast';

export default function LabRequestDetailsPage() {
  const { loading } = useRoleGuard(['labtech']);
  const { user } = useAuth();
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [request, setRequest] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [results, setResults] = useState<LabResult[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadRequestData();
    }
  }, [id]);

  const loadRequestData = async () => {
    try {
      const [requestData, cachedPatients] = await Promise.all([
        getLabRequestById(id),
        getCachedData('cachedPatients')
      ]);
      
      setRequest(requestData);
      
      if (requestData) {
        const patientData = (cachedPatients as any[])?.find(p => p.id === (requestData as any).patientId);
        setPatient(patientData);
        
        // Initialize results if not already present
        if ((requestData as any).results) {
          setResults((requestData as any).results);
        } else if ((requestData as any).tests) {
          const initialResults = (requestData as any).tests.map((test: any) => ({
            testId: test.id,
            testName: test.name,
            value: '',
            unit: '',
            referenceRange: '',
            flag: 'Normal' as const,
            notes: '',
          }));
          setResults(initialResults);
        }
      }
    } catch (error) {
      console.error('Error loading request data:', error);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!user) return;
    
    setSaving(true);
    try {
      const additionalData: any = {};
      if (newStatus === 'sample_collected') {
        additionalData.sampleCollectedAt = new Date();
      } else if (newStatus === 'in_progress') {
        additionalData.startedAt = new Date();
      }
      
      await updateLabRequestStatus(id, newStatus, additionalData);
      toast.success(navigator.onLine ? 'Status updated' : 'Status updated offline - will sync when online');
      await loadRequestData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    } finally {
      setSaving(false);
    }
  };

  const handleResultChange = (index: number, field: string, value: string) => {
    setResults(prev => prev.map((result, i) => 
      i === index ? { ...result, [field]: value } : result
    ));
  };

  const handleSubmitResults = async () => {
    if (!user) return;
    
    // Validate results
    const incompleteResults = results.filter(r => !r.value.trim());
    if (incompleteResults.length > 0) {
      toast.error('Please fill in all test results');
      return;
    }
    
    setSaving(true);
    try {
      await submitLabResults(id, results);
      toast.success(navigator.onLine ? 'Results submitted successfully' : 'Results saved offline - will sync when online');
      router.push('/labtech/dashboard');
    } catch (error) {
      console.error('Error submitting results:', error);
      toast.error('Error submitting results');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'sample_collected': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!request) return <div className="p-6">Request not found</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Lab Request Details</h1>
          <p className="text-gray-600">Request ID: {request.id}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>

      {/* Status and Actions */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(request.status)}`}>
              {request.status?.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-sm text-gray-600">
              Priority: {request.priority?.toUpperCase()}
            </span>
          </div>
          
          <div className="flex space-x-2">
            {request.status === 'pending' && (
              <button
                onClick={() => handleStatusUpdate('accepted')}
                disabled={saving}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Accept
              </button>
            )}
            {request.status === 'accepted' && (
              <button
                onClick={() => handleStatusUpdate('sample_collected')}
                disabled={saving}
                className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
              >
                Mark Sample Collected
              </button>
            )}
            {request.status === 'sample_collected' && (
              <button
                onClick={() => handleStatusUpdate('in_progress')}
                disabled={saving}
                className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
              >
                Start Processing
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['details', 'results'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-medium mb-3">Patient Information</h3>
            {patient ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Name: {patient.firstName} {patient.lastName}</div>
                <div>Email: {patient.email}</div>
                <div>Phone: {patient.phone || 'N/A'}</div>
                <div>Age: {patient.age || 'N/A'}</div>
              </div>
            ) : (
              <p className="text-gray-500">Patient information not available</p>
            )}
          </div>
          
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-medium mb-3">Requested Tests</h3>
            <div className="space-y-2">
              {request.tests?.map((test: any, index: number) => (
                <div key={index} className="p-2 border rounded">
                  <div className="font-medium">{test.name}</div>
                  <div className="text-sm text-gray-600">{test.category}</div>
                </div>
              ))}
            </div>
          </div>
          
          {request.notes && (
            <div className="bg-white rounded shadow p-4">
              <h3 className="font-medium mb-3">Notes</h3>
              <p className="text-sm text-gray-700">{request.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-medium mb-4">Test Results</h3>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded p-4">
                  <h4 className="font-medium mb-3">{result.testName}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Value</label>
                      <input
                        type="text"
                        value={result.value}
                        onChange={(e) => handleResultChange(index, 'value', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Enter result"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Unit</label>
                      <input
                        type="text"
                        value={result.unit}
                        onChange={(e) => handleResultChange(index, 'unit', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="mg/dL, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Reference Range</label>
                      <input
                        type="text"
                        value={result.referenceRange}
                        onChange={(e) => handleResultChange(index, 'referenceRange', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="0-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Flag</label>
                      <select
                        value={result.flag}
                        onChange={(e) => handleResultChange(index, 'flag', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Low">Low</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      value={result.notes}
                      onChange={(e) => handleResultChange(index, 'notes', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      rows={2}
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {request.status === 'in_progress' && (
              <div className="mt-6 text-right">
                <button
                  onClick={handleSubmitResults}
                  disabled={saving}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Submitting...' : 'Submit Results'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}