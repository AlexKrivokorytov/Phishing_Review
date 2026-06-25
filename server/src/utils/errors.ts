// Domain-specific error classes for structured error handling across layers.

// HTTP-facing error with an explicit status code. Thrown by controllers when
// the caller sends a bad request; the global error handler reads `status`
// and responds with the appropriate code instead of a generic 500.
export class HttpError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

// Raised when a record lookup or update targets an id that does not exist.
// Replaces fragile substring matching on error messages.
export class RecordNotFoundError extends Error {
  constructor(id: string) {
    super(`Record not found: id=${id}`);
    this.name = 'RecordNotFoundError';
  }
}
