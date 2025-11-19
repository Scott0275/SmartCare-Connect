let isOnlineCache = navigator?.onLine ?? true;
let healthCheckInProgress = false;

export async function checkNetworkHealth(): Promise<boolean> {
  if (healthCheckInProgress) return isOnlineCache;
  
  healthCheckInProgress = true;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('/api/health', {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-cache'
    });
    
    clearTimeout(timeoutId);
    const isHealthy = response.ok;
    isOnlineCache = isHealthy;
    return isHealthy;
  } catch {
    isOnlineCache = false;
    return false;
  } finally {
    healthCheckInProgress = false;
  }
}

export function isOnline(): boolean {
  return navigator?.onLine && isOnlineCache;
}

export function resetHealthCheckFailures() {
  // Legacy function for compatibility
  return true;
}

export function initNetworkMonitoring() {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('online', () => {
    checkNetworkHealth();
  });
  
  window.addEventListener('offline', () => {
    isOnlineCache = false;
  });
  
  // Check health on load
  checkNetworkHealth();
}