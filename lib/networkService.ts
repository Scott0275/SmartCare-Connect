let healthCheckFailures = 0;
const MAX_HEALTH_CHECK_FAILURES = 3;

export async function isOnline(): Promise<boolean> {
  // First check navigator.onLine
  if (!navigator.onLine) {
    return false;
  }

  // Then ping health endpoint
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      healthCheckFailures = 0;
      return true;
    } else {
      healthCheckFailures++;
    }
  } catch (error) {
    healthCheckFailures++;
  }

  return healthCheckFailures < MAX_HEALTH_CHECK_FAILURES;
}

export function resetHealthCheckFailures() {
  healthCheckFailures = 0;
}