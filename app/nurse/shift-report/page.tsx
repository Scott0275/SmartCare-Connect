'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import useRoleGuard from '../../../hooks/useRoleGuard';
import DashboardLayout from '../../../components/DashboardLayout';
import toast from 'react-hot-toast';

const ShiftReportPage = () => {
  const { user } = useAuth();
  const { loading } = useRoleGuard(['nurse']);
  const [report, setReport] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to submit a report.');
      return;
    }

    if (!report.trim()) {
      toast.error('Report cannot be empty.');
      return;
    }

    const newReport = {
      report,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
    };

    try {
      await addDoc(collection(db, 'shift_reports'), newReport);
      toast.success('Shift report submitted successfully!');
      setReport(''); // Reset form
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error('Failed to submit report.');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">End-of-Shift Report</h1>
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="report" className="block text-sm font-medium text-gray-700">Shift Summary</label>
            <textarea
              name="report"
              id="report"
              rows={10}
              required
              value={report}
              onChange={(e) => setReport(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              placeholder="Enter your shift summary here..."
            ></textarea>
          </div>
          <button type="submit" className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700">
            Submit Report
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ShiftReportPage;
