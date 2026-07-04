/**
 * A typed error carrying an HTTP status code, so controllers can `throw`
 * business-logic errors and let the central error handler translate them
 * into consistent JSON responses instead of every route hand-rolling
 * res.status(x).json(...) on every failure branch.
 */
export class ApiError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }
  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }
  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }
  static conflict(message: string) {
    return new ApiError(409, message);
  }
  static internal(message = "Internal server error") {
    return new ApiError(500, message);
  }
}
