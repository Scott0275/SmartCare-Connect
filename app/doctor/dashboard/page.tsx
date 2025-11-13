'use client';

import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "../../../components/doctor/Sidebar";

const DoctorDashboard = () => {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || role !== 'doctor')) {
      router.push("/unauthorized");
    }
  }, [user, role, loading, router]);

  if (loading || !user || role !== 'doctor') {
    return <div>Loading...</div>; // Or a proper loading component
  }

  return (
    <div className="flex bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Doctor Dashboard</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Welcome back, Dr. Smith!</p>

          <div className="grid grid-cols-1 gap-6 mt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Patients</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">1,234</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Appointments Today</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">12</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Unread Messages</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">5</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Open Reports</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">3</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
            {/* Placeholder for recent activity feed */}
            <div className="mt-4 bg-white rounded-lg shadow-md dark:bg-gray-800">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                <li className="px-6 py-4">New patient registered: John Doe</li>
                <li className="px-6 py-4">Appointment confirmed with Jane Smith</li>
                <li className="px-6 py-4">Lab results received for Michael Johnson</li>
              </ul>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;
