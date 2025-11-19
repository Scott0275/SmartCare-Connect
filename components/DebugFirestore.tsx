"use client";
import { useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { checkNetworkHealth } from '@/lib/networkService';
import { createVitals } from '@/lib/vitalsService';

export default function DebugFirestore() {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  const testDirectFirestore = async () => {
    setStatus('Testing direct Firestore...');
    addLog('Starting direct Firestore test');
    
    try {
      addLog(`Firebase DB available: ${!!db}`);
      addLog(`Auth available: ${!!auth}`);
      addLog(`Current user: ${auth?.currentUser?.uid || 'None'}`);
      addLog(`User from context: ${user?.uid || 'None'}`);
      
      if (!db) {
        addLog('ERROR: Firebase DB not initialized');
        setStatus('Failed: Firebase not initialized');
        return;
      }

      if (!user) {
        addLog('ERROR: No authenticated user');
        setStatus('Failed: Not authenticated');
        return;
      }

      const testData = {
        patientId: 'test-patient-123',
        bloodPressure: '120/80',
        heartRate: 72,
        temperature: 98.6,
        recordedBy: user.uid,
        recordedAt: new Date()
      };

      addLog('Attempting to write to Firestore vitals collection...');
      const docRef = await addDoc(collection(db, 'vitals'), testData);
      addLog(`SUCCESS: Document written with ID: ${docRef.id}`);
      setStatus('Success: Direct Firestore write worked');
      
    } catch (error: any) {
      addLog(`ERROR: ${error.message}`);
      addLog(`Error code: ${error.code}`);
      setStatus(`Failed: ${error.message}`);
    }
  };

  const testVitalsService = async () => {
    setStatus('Testing vitals service...');
    addLog('Starting vitals service test');
    
    try {
      const networkHealth = await checkNetworkHealth();
      addLog(`Network health: ${networkHealth}`);
      
      const result = await createVitals('test-patient-123', {
        bloodPressure: '120/80',
        heartRate: 72,
        temperature: 98.6
      }, user?.uid || '');
      
      addLog(`SUCCESS: Vitals created with ID: ${result}`);
      setStatus('Success: Vitals service worked');
      
    } catch (error: any) {
      addLog(`ERROR: ${error.message}`);
      setStatus(`Failed: ${error.message}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setStatus('');
  };

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="font-bold mb-4">Firestore Debug Panel</h3>
      
      <div className="space-x-2 mb-4">
        <button 
          onClick={testDirectFirestore}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Test Direct Firestore
        </button>
        <button 
          onClick={testVitalsService}
          className="bg-green-500 text-white px-3 py-1 rounded"
        >
          Test Vitals Service
        </button>
        <button 
          onClick={clearLogs}
          className="bg-gray-500 text-white px-3 py-1 rounded"
        >
          Clear Logs
        </button>
      </div>

      {status && (
        <div className={`p-2 rounded mb-4 ${status.includes('Success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {status}
        </div>
      )}

      <div className="bg-black text-green-400 p-3 rounded font-mono text-sm max-h-64 overflow-y-auto">
        {logs.length === 0 ? 'No logs yet...' : logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  );
}