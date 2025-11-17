import { NextRequest, NextResponse } from 'next/server';
import { getCachedData } from '@/lib/offlineDb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || '30d';

    const labRequests = await getCachedData('cachedLabRequests') as any[] || [];
    
    const now = new Date();
    const daysBack = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    const recentLabs = labRequests.filter(l => {
      const createdAt = l.createdAt?.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
      return createdAt >= startDate;
    });

    const completed = recentLabs.filter(l => l.status === 'completed').length;
    const pending = recentLabs.filter(l => l.status !== 'completed').length;

    const frequentTests: { [key: string]: number } = {};
    recentLabs.forEach(l => {
      l.tests?.forEach((test: any) => {
        const testName = test.name || 'Unknown';
        frequentTests[testName] = (frequentTests[testName] || 0) + 1;
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        completed,
        pending,
        total: recentLabs.length,
        frequentTests,
        completionRate: recentLabs.length > 0 ? (completed / recentLabs.length) * 100 : 0,
        averageTurnaround: 2.3, // Mock data
      },
    });

  } catch (error) {
    console.error('Labs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}