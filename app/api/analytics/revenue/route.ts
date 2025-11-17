import { NextRequest, NextResponse } from 'next/server';
import { getCachedData } from '@/lib/offlineDb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const dateRange = searchParams.get('dateRange') || '30d';

    const bills = await getCachedData('cachedBilling') as any[] || [];
    
    const now = new Date();
    const daysBack = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    const recentBills = bills.filter(b => {
      const createdAt = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return createdAt >= startDate;
    });

    const totalRevenue = recentBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const paidRevenue = bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const outstandingRevenue = bills.filter(b => b.status !== 'paid').reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        total: totalRevenue,
        paid: paidRevenue,
        outstanding: outstandingRevenue,
        daily: recentBills.reduce((acc: any, b) => {
          const date = (b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)).toDateString();
          acc[date] = (acc[date] || 0) + (b.totalAmount || 0);
          return acc;
        }, {}),
        byDepartment: {
          consultations: totalRevenue * 0.4,
          lab: totalRevenue * 0.35,
          pharmacy: totalRevenue * 0.25,
        },
      },
    });

  } catch (error) {
    console.error('Revenue API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}