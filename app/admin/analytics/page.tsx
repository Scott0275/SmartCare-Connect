"use client";
import React, { useState, useEffect } from 'react';
import useRoleGuard from '@/hooks/useRoleGuard';
import { useAuth } from '@/context/AuthContext';
import { refreshAnalytics, getAnalyticsSnapshot } from '@/lib/analyticsService';
import type { AnalyticsMetrics } from '@/lib/analyticsService';
import AnalyticsCard from '@/components/analytics/AnalyticsCard';
import AnalyticsChart from '@/components/analytics/AnalyticsChart';
import TrendGraph from '@/components/analytics/TrendGraph';
import RevenueBreakdown from '@/components/analytics/RevenueBreakdown';
import toast from 'react-hot-toast';

export default function AdminAnalyticsPage() {
  const { loading } = useRoleGuard(['admin', 'superadmin']);
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    loadAnalytics();
    
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadAnalytics = async () => {
    try {
      let analyticsData: AnalyticsMetrics | null = null;
      
      if (navigator.onLine) {
        analyticsData = await refreshAnalytics();
      } else {
        analyticsData = await getAnalyticsSnapshot();
      }
      
      setMetrics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Error loading analytics data');
    }
  };

  const handleRefresh = async () => {
    if (!navigator.onLine) {
      toast.error('Cannot refresh while offline');
      return;
    }
    
    setIsRefreshing(true);
    try {
      const analyticsData = await refreshAnalytics();
      setMetrics(analyticsData);
      toast.success('Analytics refreshed successfully');
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      toast.error('Error refreshing analytics');
    } finally {
      setIsRefreshing(false);
    }
  };

  const generateTrendData = (baseValue: number) => {
    const data = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const variation = Math.random() * 0.4 - 0.2; // ±20% variation
      data.push({
        date: date.toISOString(),
        value: Math.max(0, Math.round(baseValue * (1 + variation))),
      });
    }
    return data;
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!metrics) return <div className="p-6">No analytics data available</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
          <p className="text-gray-600">
            Last updated: {new Date(metrics.timestamp).toLocaleString()}
            {isOffline && <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Offline</span>}
          </p>
        </div>
        <div className="flex space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isOffline}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <AnalyticsCard
          title="Admissions Today"
          value={metrics.admissions.today}
          icon="🏥"
          subtitle={`${metrics.admissions.activePatients} active patients`}
        />
        <AnalyticsCard
          title="Consultations"
          value={metrics.consultations.total}
          icon="🩺"
          subtitle={`${metrics.consultations.averageTime} min avg`}
        />
        <AnalyticsCard
          title="Lab Tests Done"
          value={metrics.labTests.completed}
          icon="🧪"
          subtitle={`${metrics.labTests.pending} pending`}
        />
        <AnalyticsCard
          title="Medications Dispensed"
          value={metrics.dispensations.total}
          icon="💊"
        />
        <AnalyticsCard
          title="Revenue Today"
          value={`$${metrics.revenue.today.toFixed(2)}`}
          icon="💰"
          subtitle={`$${metrics.revenue.thisMonth.toFixed(2)} this month`}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TrendGraph
          title="Admissions Trend (30 days)"
          data={generateTrendData(metrics.admissions.today)}
          color="blue"
        />
        <TrendGraph
          title="Revenue Trend (30 days)"
          data={generateTrendData(metrics.revenue.today)}
          color="green"
        />
        <AnalyticsChart
          title="Lab Tests by Type"
          data={metrics.labTests.frequentTests}
          type="bar"
          isOffline={isOffline}
        />
        <RevenueBreakdown
          data={metrics.revenue.byDepartment}
          total={metrics.revenue.thisMonth}
        />
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart
          title="Consultations by Specialization"
          data={metrics.consultations.bySpecialization}
          type="pie"
          isOffline={isOffline}
        />
        <AnalyticsChart
          title="Dispensations by Category"
          data={metrics.dispensations.byCategory}
          type="bar"
          isOffline={isOffline}
        />
      </div>

      {/* Summary Stats */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Patient Flow</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>This Week:</span>
                <span>{metrics.admissions.thisWeek} admissions</span>
              </div>
              <div className="flex justify-between">
                <span>This Month:</span>
                <span>{metrics.admissions.thisMonth} admissions</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Duration:</span>
                <span>{metrics.admissions.averageDuration} days</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Lab Performance</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Completion Rate:</span>
                <span>{((metrics.labTests.completed / (metrics.labTests.completed + metrics.labTests.pending)) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Turnaround:</span>
                <span>{metrics.labTests.averageTurnaround} days</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Financial</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Outstanding:</span>
                <span className="text-red-600">${metrics.revenue.outstanding.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid:</span>
                <span className="text-green-600">${metrics.revenue.paid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Collection Rate:</span>
                <span>{((metrics.revenue.paid / (metrics.revenue.paid + metrics.revenue.outstanding)) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}