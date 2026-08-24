// ==============================================
// Custom Error Classes
// ==============================================

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(403, "FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(404, "NOT_FOUND", `${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(422, "VALIDATION_ERROR", message);
    this.name = "ValidationError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(409, "CONFLICT", message);
    this.name = "ConflictError";
  }
}

export class SlotUnavailableError extends AppError {
  constructor(message = "This slot is no longer available") {
    super(409, "SLOT_UNAVAILABLE", message);
    this.name = "SlotUnavailableError";
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(502, "EXTERNAL_SERVICE_ERROR", message || `${service} is temporarily unavailable`);
    this.name = "ExternalServiceError";
  }
}

// ==============================================
// API Response Helpers
// ==============================================

import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  code: string,
  message: string,
  status = 400
): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error("API Error:", error);

  if (error instanceof AppError) {
    return errorResponse(error.code, error.message, error.statusCode);
  }

  if (error instanceof Error) {
    // Don't expose internal errors
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }

  return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
}
