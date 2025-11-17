import { getCachedData, cacheData } from './offlineDb';
import { addToSyncQueue } from './syncQueue';

export interface AnalyticsMetrics {
  admissions: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    averageDuration: number;
    activePatients: number;
  };
  dispensations: {
    total: number;
    byCategory: { [category: string]: number };
    byDoctor: { [doctorId: string]: number };
  };
  labTests: {
    completed: number;
    pending: number;
    frequentTests: { [testName: string]: number };
    averageTurnaround: number;
  };
  consultations: {
    total: number;
    averageTime: number;
    bySpecialization: { [spec: string]: number };
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    byDepartment: {
      consultations: number;
      lab: number;
      pharmacy: number;
    };
    outstanding: number;
    paid: number;
  };
  timestamp: Date;
}

export const computeAnalytics = async (): Promise<AnalyticsMetrics> => {
  const [patients, consultations, prescriptions, labRequests, bills, dispensations] = await Promise.all([
    getCachedData('cachedPatients'),
    getCachedData('cachedConsultations'),
    getCachedData('cachedPrescriptions'),
    getCachedData('cachedLabRequests'),
    getCachedData('cachedBilling'),
    getCachedData('cachedDispensations'),
  ]);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Admissions analytics
  const admissionsToday = (patients as any[] || []).filter(p => {
    const createdAt = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
    return createdAt >= today;
  }).length;

  const admissionsThisWeek = (patients as any[] || []).filter(p => {
    const createdAt = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
    return createdAt >= weekAgo;
  }).length;

  const admissionsThisMonth = (patients as any[] || []).filter(p => {
    const createdAt = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
    return createdAt >= monthAgo;
  }).length;

  // Dispensations analytics
  const totalDispensations = (dispensations as any[] || []).length;
  const dispensationsByCategory: { [key: string]: number } = {};
  const dispensationsByDoctor: { [key: string]: number } = {};

  (dispensations as any[] || []).forEach(d => {
    d.medications?.forEach((med: any) => {
      const category = med.category || 'Other';
      dispensationsByCategory[category] = (dispensationsByCategory[category] || 0) + 1;
    });
    const doctorId = d.doctorId || 'Unknown';
    dispensationsByDoctor[doctorId] = (dispensationsByDoctor[doctorId] || 0) + 1;
  });

  // Lab tests analytics
  const completedLabs = (labRequests as any[] || []).filter(l => l.status === 'completed').length;
  const pendingLabs = (labRequests as any[] || []).filter(l => l.status !== 'completed').length;
  const frequentTests: { [key: string]: number } = {};

  (labRequests as any[] || []).forEach(l => {
    l.tests?.forEach((test: any) => {
      const testName = test.name || 'Unknown';
      frequentTests[testName] = (frequentTests[testName] || 0) + 1;
    });
  });

  // Consultations analytics
  const totalConsultations = (consultations as any[] || []).length;
  const consultationsBySpec: { [key: string]: number } = {};

  (consultations as any[] || []).forEach(c => {
    const spec = c.specialization || 'General';
    consultationsBySpec[spec] = (consultationsBySpec[spec] || 0) + 1;
  });

  // Revenue analytics
  const todayRevenue = (bills as any[] || []).filter(b => {
    const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return createdAt >= today;
  }).reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const weekRevenue = (bills as any[] || []).filter(b => {
    const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return createdAt >= weekAgo;
  }).reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const monthRevenue = (bills as any[] || []).filter(b => {
    const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return createdAt >= monthAgo;
  }).reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const paidRevenue = (bills as any[] || []).filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const outstandingRevenue = (bills as any[] || []).filter(b => b.status !== 'paid').reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  return {
    admissions: {
      today: admissionsToday,
      thisWeek: admissionsThisWeek,
      thisMonth: admissionsThisMonth,
      averageDuration: 3.5, // Mock data
      activePatients: (patients as any[] || []).length,
    },
    dispensations: {
      total: totalDispensations,
      byCategory: dispensationsByCategory,
      byDoctor: dispensationsByDoctor,
    },
    labTests: {
      completed: completedLabs,
      pending: pendingLabs,
      frequentTests,
      averageTurnaround: 2.3, // Mock data in days
    },
    consultations: {
      total: totalConsultations,
      averageTime: 25, // Mock data in minutes
      bySpecialization: consultationsBySpec,
    },
    revenue: {
      today: todayRevenue,
      thisWeek: weekRevenue,
      thisMonth: monthRevenue,
      byDepartment: {
        consultations: monthRevenue * 0.4,
        lab: monthRevenue * 0.35,
        pharmacy: monthRevenue * 0.25,
      },
      outstanding: outstandingRevenue,
      paid: paidRevenue,
    },
    timestamp: new Date(),
  };
};

export const getAnalyticsSnapshot = async (): Promise<AnalyticsMetrics | null> => {
  try {
    const snapshots = await getCachedData('analyticsSnapshots') as AnalyticsMetrics[] || [];
    return snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  } catch (error) {
    console.error('Error getting analytics snapshot:', error);
    return null;
  }
};

export const saveAnalyticsSnapshot = async (metrics: AnalyticsMetrics): Promise<void> => {
  try {
    await cacheData('analyticsSnapshots', metrics);
    
    if (navigator.onLine) {
      await addToSyncQueue({
        type: 'SAVE_ANALYTICS_SNAPSHOT',
        data: metrics,
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    console.error('Error saving analytics snapshot:', error);
  }
};

export const refreshAnalytics = async (): Promise<AnalyticsMetrics> => {
  const metrics = await computeAnalytics();
  await saveAnalyticsSnapshot(metrics);
  return metrics;
};