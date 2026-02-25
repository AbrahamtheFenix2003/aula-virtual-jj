/**
 * Pagination Utilities
 *
 * Provides standardized pagination for API responses.
 * Uses `limit` as the page-size parameter and `meta` as the response envelope key.
 */

/**
 * Pagination parameters from query string
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Pagination metadata for responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Default pagination values
 */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * Parse pagination parameters from URL search params.
 * Accepts `limit` as the primary param name, with `pageSize` as a backwards-compat fallback.
 */
export function parsePaginationParams(
  searchParams: URLSearchParams
): PaginationParams {
  const pageParam = searchParams.get("page");
  const limitParam =
    searchParams.get("limit") || searchParams.get("pageSize");

  let page = pageParam ? parseInt(pageParam, 10) : PAGINATION_DEFAULTS.PAGE;
  let limit = limitParam
    ? parseInt(limitParam, 10)
    : PAGINATION_DEFAULTS.LIMIT;

  // Ensure valid values
  if (isNaN(page) || page < 1) {
    page = PAGINATION_DEFAULTS.PAGE;
  }

  if (isNaN(limit) || limit < 1) {
    limit = PAGINATION_DEFAULTS.LIMIT;
  }

  // Enforce maximum limit
  if (limit > PAGINATION_DEFAULTS.MAX_LIMIT) {
    limit = PAGINATION_DEFAULTS.MAX_LIMIT;
  }

  return { page, limit };
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Calculate skip value for Prisma
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    meta: calculatePagination(page, limit, total),
  };
}
