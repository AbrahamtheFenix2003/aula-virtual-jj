import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/**
 * Standard API Error Codes
 */
export const ERROR_CODES = {
  // Client errors (4xx)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // Server errors (5xx)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Validation error detail structure
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
}

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: ValidationErrorDetail[] | Record<string, unknown>;
    timestamp?: string;
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  details?: ValidationErrorDetail[] | Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
    },
  };

  if (details) {
    response.error.details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Create error response from Zod validation error
 */
export function createValidationErrorResponse(
  zodError: ZodError
): NextResponse<ApiErrorResponse> {
  const details: ValidationErrorDetail[] = zodError.issues.map((issue) => ({
    field: issue.path.join(".") || "unknown",
    message: issue.message,
    code: issue.code,
  }));

  return createErrorResponse(
    ERROR_CODES.VALIDATION_ERROR,
    "Los datos enviados son invalidos",
    400,
    details
  );
}

/**
 * Convenience functions for common errors
 */
export const ApiErrors = {
  unauthorized(message = "No autorizado"): NextResponse<ApiErrorResponse> {
    return createErrorResponse(ERROR_CODES.UNAUTHORIZED, message, 401);
  },

  forbidden(message = "No tienes permisos"): NextResponse<ApiErrorResponse> {
    return createErrorResponse(ERROR_CODES.FORBIDDEN, message, 403);
  },

  notFound(resource = "Recurso"): NextResponse<ApiErrorResponse> {
    return createErrorResponse(
      ERROR_CODES.NOT_FOUND,
      `${resource} no encontrado`,
      404
    );
  },

  conflict(message: string): NextResponse<ApiErrorResponse> {
    return createErrorResponse(ERROR_CODES.CONFLICT, message, 409);
  },

  validation(message: string, field?: string): NextResponse<ApiErrorResponse> {
    const details = field ? [{ field, message }] : undefined;
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      message,
      400,
      details
    );
  },

  internal(message = "Error interno del servidor"): NextResponse<ApiErrorResponse> {
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, message, 500);
  },

  fromZod(zodError: ZodError): NextResponse<ApiErrorResponse> {
    return createValidationErrorResponse(zodError);
  },
};
