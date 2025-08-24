/**
 * Logger utility for WorkforceOne Frontend
 * Provides conditional logging based on environment and log levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    // Set log level based on environment
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: string, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : '';
    return `[${timestamp}] ${level}${contextStr}: ${message}`;
  }

  debug(message: string, data?: any, context?: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, context), data || '');
    }
  }

  info(message: string, data?: any, context?: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, context), data || '');
    }
  }

  warn(message: string, data?: any, context?: string): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context), data || '');
    }
  }

  error(message: string, error?: any, context?: string): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorData = error instanceof Error 
        ? { message: error.message, stack: error.stack } 
        : error;
      console.error(this.formatMessage('ERROR', message, context), errorData || '');
    }
  }

  // Development-only debug logging
  devDebug(message: string, data?: any, context?: string): void {
    if (this.isDevelopment) {
      console.log(`[DEV] ${message}`, data || '');
    }
  }

  // API response logging (sanitized for production)
  apiResponse(endpoint: string, data?: any, sanitize = true): void {
    if (this.isDevelopment) {
      console.log(`[API] ${endpoint}`, sanitize ? this.sanitizeData(data) : data);
    }
  }

  // User action logging for analytics/debugging
  userAction(action: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[USER] ${action}`, data || '');
    }
  }

  // Sanitize sensitive data for logging
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'auth', 'authorization', 'cookie'];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for common use cases
export const devLog = (message: string, data?: any) => logger.devDebug(message, data);
export const apiLog = (endpoint: string, data?: any) => logger.apiResponse(endpoint, data);
export const userLog = (action: string, data?: any) => logger.userAction(action, data);
export const errorLog = (message: string, error?: any, context?: string) => logger.error(message, error, context);