import { NextRequest, NextResponse } from 'next/server';
import { computeAnalytics } from '@/lib/analyticsService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const dateRange = searchParams.get('dateRange') || '30d';
    const department = searchParams.get('department');

    const metrics = await computeAnalytics();

    return NextResponse.json({
      success: true,
      data: metrics,
      meta: {
        dateRange,
        department,
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}