interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  correlationId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private correlationId: string | null = null;
  
  setCorrelationId(id: string) {
    this.correlationId = id;
  }
  
  private log(level: LogEntry['level'], message: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      correlationId: this.correlationId || undefined,
      metadata,
    };
    
    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production') {
      // Send to logging service (e.g., Datadog, CloudWatch)
      console.log(JSON.stringify(entry));
    } else {
      console.log(`[${entry.level.toUpperCase()}] ${entry.message}`, metadata || '');
    }
  }
  
  info(message: string, metadata?: Record<string, any>) {
    this.log('info', message, metadata);
  }
  
  warn(message: string, metadata?: Record<string, any>) {
    this.log('warn', message, metadata);
  }
  
  error(message: string, error?: Error, metadata?: Record<string, any>) {
    this.log('error', message, {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }
  
  debug(message: string, metadata?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, metadata);
    }
  }
}

export const logger = new Logger();

export function withLogging<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operation: string
) {
  return async (...args: T): Promise<R> => {
    const correlationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.setCorrelationId(correlationId);
    
    logger.info(`Starting ${operation}`, { correlationId });
    
    try {
      const result = await fn(...args);
      logger.info(`Completed ${operation}`, { correlationId });
      return result;
    } catch (error) {
      logger.error(`Failed ${operation}`, error as Error, { correlationId });
      throw error;
    }
  };
}