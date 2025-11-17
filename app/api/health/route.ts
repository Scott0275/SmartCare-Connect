import { NextResponse } from 'next/server';
import { getSyncQueue } from '@/lib/syncQueue';
import { getCachedData } from '@/lib/offlineDb';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Check database connectivity
    let dbStatus = 'healthy';
    let dbLatency = 0;
    
    try {
      const dbStart = Date.now();
      await getCachedData('cachedPatients');
      dbLatency = Date.now() - dbStart;
    } catch (error) {
      dbStatus = 'unhealthy';
    }
    
    // Check sync queue length
    let queueLength = 0;
    try {
      const queue = await getSyncQueue();
      queueLength = queue.length;
    } catch (error) {
      // Queue check failed
    }
    
    // Check Firebase Admin SDK
    let adminSdkStatus = 'healthy';
    try {
      // Simple check - verify environment variables exist
      if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
        adminSdkStatus = 'misconfigured';
      }
    } catch (error) {
      adminSdkStatus = 'unhealthy';
    }
    
    const totalLatency = Date.now() - startTime;
    const isHealthy = dbStatus === 'healthy' && adminSdkStatus === 'healthy';
    
    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          status: dbStatus,
          latency: `${dbLatency}ms`,
        },
        adminSdk: {
          status: adminSdkStatus,
        },
        syncQueue: {
          length: queueLength,
          status: queueLength < 1000 ? 'healthy' : 'warning',
        },
      },
      metrics: {
        responseTime: `${totalLatency}ms`,
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      },
    };
    
    return NextResponse.json(healthData, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}