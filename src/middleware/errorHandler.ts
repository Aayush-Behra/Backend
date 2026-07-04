import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

/**
 * Single place that turns any thrown error into a consistent JSON shape.
 * Placed last in the middleware chain (see app.ts). Keeping this generic
 * means route handlers never need try/catch boilerplate for known errors —
 * they just `throw ApiError.xyz(...)` and this takes care of the response.
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  console.error("[unhandled error]", err);
  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again.",
    stack: env.isProd ? undefined : (err as Error)?.stack,
  });
}
