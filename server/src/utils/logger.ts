// Simple key-value logger for database and server events.

export interface LogFields {
  [key: string]: unknown;
}

export class Logger {
  // Logs an info level message in JSON format.
  public info(event: string, fields: LogFields = {}): void {
    console.log(
      JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        event,
        ...fields,
      })
    );
  }

  // Logs a warning level message in JSON format.
  public warn(event: string, fields: LogFields = {}): void {
    console.warn(
      JSON.stringify({
        level: 'warn',
        timestamp: new Date().toISOString(),
        event,
        ...fields,
      })
    );
  }

  // Logs an error level message in JSON format.
  public error(event: string, error: Error | string, fields: LogFields = {}): void {
    const message = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;
    console.error(
      JSON.stringify({
        level: 'error',
        timestamp: new Date().toISOString(),
        event,
        message,
        stack,
        ...fields,
      })
    );
  }
}

export const logger: Logger = new Logger();
