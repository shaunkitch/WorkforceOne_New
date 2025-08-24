/**
 * Logger utility for WorkforceOne Backend
 * Provides structured logging with environment awareness
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  timestamp: string;
  service: string;
}

class Logger {
  private service: string;
  private minLevel: LogLevel;

  constructor(service: string = 'WorkforceOne-Backend') {
    this.service = service;
    // Set minimum log level based on environment
    this.minLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) return undefined;

    const sanitized = { ...metadata };
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'authorization',
      'credit_card', 'ssn', 'social_security', 'api_key',
      'private_key', 'access_token', 'refresh_token'
    ];

    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }

      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    return sanitizeObject(sanitized);
  }

  private formatLog(level: LogLevel, message: string, metadata?: Record<string, any>): string {
    const entry: LogEntry = {
      level,
      message,
      metadata: this.sanitizeMetadata(metadata),
      timestamp: new Date().toISOString(),
      service: this.service,
    };

    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(entry);
    } else {
      // Pretty format for development
      const levelName = LogLevel[level];
      const metaStr = entry.metadata ? `\n${JSON.stringify(entry.metadata, null, 2)}` : '';
      return `[${entry.timestamp}] ${levelName} [${this.service}]: ${message}${metaStr}`;
    }
  }

  debug(message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.log(this.formatLog(LogLevel.DEBUG, message, metadata));
  }

  info(message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.log(this.formatLog(LogLevel.INFO, message, metadata));
  }

  warn(message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    console.warn(this.formatLog(LogLevel.WARN, message, metadata));
  }

  error(message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    console.error(this.formatLog(LogLevel.ERROR, message, metadata));
  }

  // Utility methods for common logging patterns
  requestStart(method: string, path: string, metadata?: Record<string, any>): void {
    this.info(`${method} ${path} - Request started`, metadata);
  }

  requestEnd(method: string, path: string, statusCode: number, duration: number): void {
    this.info(`${method} ${path} - Request completed`, {
      statusCode,
      duration: `${duration}ms`
    });
  }

  apiCall(service: string, endpoint: string, method: string = 'GET'): void {
    this.debug(`API call to ${service}`, { endpoint, method });
  }

  dbQuery(query: string, duration?: number): void {
    this.debug('Database query executed', {
      query: query.length > 100 ? `${query.substring(0, 100)}...` : query,
      duration: duration ? `${duration}ms` : undefined
    });
  }

  authEvent(event: string, userId?: string, metadata?: Record<string, any>): void {
    this.info(`Auth event: ${event}`, {
      userId,
      ...metadata
    });
  }
}

// Create default logger instance
export const logger = new Logger();

// Export function to create service-specific loggers
export const createLogger = (service: string): Logger => new Logger(service);

export default logger;