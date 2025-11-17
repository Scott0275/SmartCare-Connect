let Sentry: any = null;

try {
  Sentry = require('@sentry/nextjs');
} catch (e) {
  console.warn('Sentry not installed, error monitoring disabled');
}

export function initSentry() {
  if (Sentry && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      beforeSend(event: any) {
        // Redact sensitive data
        if (event.request?.data) {
          event.request.data = redactSensitiveData(event.request.data);
        }
        return event;
      },
    });
  }
}

function redactSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) return data;
  
  const sensitiveFields = [
    'password', 'token', 'key', 'secret', 'ssn', 'dob', 
    'phone', 'email', 'address', 'medicalRecord'
  ];
  
  const redacted = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = '[REDACTED]';
    }
  }
  
  return redacted;
}

export function captureException(error: Error, context?: Record<string, any>) {
  if (Sentry) {
    Sentry.captureException(error, {
      contexts: context ? { custom: context } : undefined,
    });
  } else {
    console.error('Exception:', error, context);
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (Sentry) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level}] ${message}`);
  }
}

export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  if (Sentry) {
    Sentry.addBreadcrumb({
      message,
      category,
      data: data ? redactSensitiveData(data) : undefined,
      timestamp: Date.now() / 1000,
    });
  }
}