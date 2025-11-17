import { NextRequest, NextResponse } from 'next/server';
import { getCachedData } from '@/lib/offlineDb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const dateRange = searchParams.get('dateRange') || '30d';

    const patients = await getCachedData('cachedPatients') as any[] || [];
    
    const now = new Date();
    const daysBack = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    const admissions = patients.filter(p => {
      const createdAt = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
      return createdAt >= startDate;
    });

    return NextResponse.json({
      success: true,
      data: {
        total: admissions.length,
        daily: admissions.reduce((acc: any, p) => {
          const date = (p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt)).toDateString();
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {}),
        activePatients: patients.length,
      },
    });

  } catch (error) {
    console.error('Admissions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}