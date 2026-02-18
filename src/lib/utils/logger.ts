/**
 * Simple logger utility for the application
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private level: LogLevel;
  private name: string;

  constructor(name: string, level: LogLevel = LogLevel.INFO) {
    this.name = name;
    this.level = level;
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level < this.level) return;

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`[${timestamp}] [${levelName}] [${this.name}] ${message}`, ...args);
        break;
      case LogLevel.INFO:
        console.log(`[${timestamp}] [${levelName}] [${this.name}] ${message}`, ...args);
        break;
      case LogLevel.WARN:
        console.warn(`[${timestamp}] [${levelName}] [${this.name}] ${message}`, ...args);
        break;
      case LogLevel.ERROR:
        console.error(`[${timestamp}] [${levelName}] [${this.name}] ${message}`, ...args);
        break;
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

/**
 * Factory function to create a named logger
 */
export function createLogger(name: string, level?: LogLevel): Logger {
  const logLevel = level ?? (process.env.LOG_LEVEL ? LogLevel[process.env.LOG_LEVEL.toUpperCase() as keyof typeof LogLevel] ?? LogLevel.INFO : LogLevel.INFO);
  return new Logger(name, logLevel);
}
