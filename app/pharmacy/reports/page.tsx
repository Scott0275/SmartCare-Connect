"use client";
import React, { useState, useEffect } from 'react';
import useRoleGuard from '@/hooks/useRoleGuard';
import { getPrescriptions, getInventory } from '@/lib/pharmacyService';
import { getCachedData } from '@/lib/offlineDb';

export default function PharmacyReportsPage() {
  const { loading } = useRoleGuard(['pharmacy']);
  const [reportData, setReportData] = useState({
    totalPrescriptions: 0,
    dispensedToday: 0,
    pendingPrescriptions: 0,
    lowStockItems: 0,
    totalInventoryValue: 0,
  });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      const [prescriptions, inventory, dispensations] = await Promise.all([
        getPrescriptions(),
        getInventory(),
        getCachedData('cachedDispensations')
      ]);

      const today = new Date().toDateString();
      const dispensedToday = (dispensations as any[])?.filter(d => 
        new Date(d.dispensedAt?.toDate ? d.dispensedAt.toDate() : d.dispensedAt).toDateString() === today
      ).length || 0;

      setReportData({
        totalPrescriptions: prescriptions.length,
        dispensedToday,
        pendingPrescriptions: prescriptions.filter((p: any) => p.status === 'pending').length,
        lowStockItems: inventory.filter((item: any) => item.currentStock <= item.reorderLevel).length,
        totalInventoryValue: inventory.reduce((sum: number, item: any) => sum + (item.currentStock * item.unitPrice), 0),
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Pharmacy Reports</h1>
        <button onClick={loadReportData} className="bg-green-600 text-white px-3 py-1 rounded text-sm">
          Refresh Data
        </button>
      </div>

      {loadingData ? (
        <div className="text-center py-8">Loading report data...</div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{reportData.totalPrescriptions}</div>
              <div className="text-sm text-gray-600">Total Prescriptions</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{reportData.dispensedToday}</div>
              <div className="text-sm text-gray-600">Dispensed Today</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-orange-600">{reportData.pendingPrescriptions}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-red-600">{reportData.lowStockItems}</div>
              <div className="text-sm text-gray-600">Low Stock Items</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">${reportData.totalInventoryValue.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Inventory Value</div>
            </div>
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Prescription Status Distribution</h3>
              <div className="text-center text-gray-500 py-8">
                Chart visualization would go here
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Daily Dispensation Trend</h3>
              <div className="text-center text-gray-500 py-8">
                Chart visualization would go here
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="text-center text-gray-500 py-8">
                Recent pharmacy activities would be listed here
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}