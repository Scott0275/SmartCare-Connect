import { createDocument } from './syncEngine';
import { cacheData, getCachedData } from './offlineDb';

export async function createShiftReport(reportData: any, userId: string) {
  const data = {
    ...reportData,
    createdBy: userId,
    createdAt: new Date(),
    shift: reportData.shift || 'day',
    id: `shift_report_${Date.now()}`
  };

  try {
    const docId = await createDocument('shiftReports', data);
    return docId;
  } catch (error) {
    await cacheData('cachedShiftReports', data);
    throw error;
  }
}

export async function getShiftReports(userId?: string) {
  try {
    const cached = await getCachedData('cachedShiftReports') as any[];
    if (userId) {
      return cached?.filter(report => report.createdBy === userId) || [];
    }
    return cached || [];
  } catch (error) {
    console.error('Error getting shift reports:', error);
    return [];
  }
}