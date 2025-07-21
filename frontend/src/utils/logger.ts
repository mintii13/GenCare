export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: string, context: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${context}] ${message}`;
  }

  public debug(context: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', context, message), data || '');
    }
  }

  public info(context: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', context, message), data || '');
    }
  }

  public warn(context: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', context, message), data || '');
    }
  }

  public error(context: string, message: string, error?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', context, message), error || '');
    }
  }

  // Specialized methods for common use cases
  public api(method: string, url: string, data?: any): void {
    this.debug('API', `${method} ${url}`, data);
  }

  public apiResponse(method: string, url: string, status: number, data?: any): void {
    if (status >= 400) {
      this.error('API', `${method} ${url} - ${status}`, data);
    } else {
      this.debug('API', `${method} ${url} - ${status}`, data);
    }
  }

  public component(componentName: string, action: string, data?: any): void {
    this.debug('COMPONENT', `${componentName}: ${action}`, data);
  }

  public userAction(action: string, data?: any): void {
    this.info('USER', action, data);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience exports
export const log = {
  debug: (context: string, message: string, data?: any) => logger.debug(context, message, data),
  info: (context: string, message: string, data?: any) => logger.info(context, message, data),
  warn: (context: string, message: string, data?: any) => logger.warn(context, message, data),
  error: (context: string, message: string, error?: any) => logger.error(context, message, error),
  api: (method: string, url: string, data?: any) => logger.api(method, url, data),
  apiResponse: (method: string, url: string, status: number, data?: any) => logger.apiResponse(method, url, status, data),
  component: (componentName: string, action: string, data?: any) => logger.component(componentName, action, data),
  userAction: (action: string, data?: any) => logger.userAction(action, data)
};