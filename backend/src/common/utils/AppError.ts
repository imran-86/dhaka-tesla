/**
 * Application-level error with an HTTP status code and a stable machine-readable code.
 *
 * Throw this anywhere in services, controllers, or middlewares.
 * The global error handler (`src/middlewares/error.ts`) catches it and
 * returns a consistent JSON response:
 *
 *   { "error": { "code": "NO_ROUTE", "message": "No distance defined for Banani → Uttara" } }
 *
 * Why a `code` in addition to `message`:
 *   - Frontend can branch on `code` without string-matching messages.
 *   - Messages may change or be translated; codes stay stable.
 *   - Useful for logging/alerting (e.g. count how often NOT_AUTHENTICATED fires).
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    isOperational: boolean = true,
  ) {
    super(message);

    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Restore prototype chain — required when extending built-ins in TS.
    Object.setPrototypeOf(this, AppError.prototype);

    // Capture a clean stack trace that excludes this constructor frame.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}