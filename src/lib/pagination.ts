/**
 * Pagination Utilities
 * 
 * Provides standardized pagination for API responses.
 */

/**
 * Pagination parameters from query string
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Pagination metadata for responses
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
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
  pagination: PaginationMeta;
}

/**
 * Default pagination values
 */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(
  searchParams: URLSearchParams
): PaginationParams {
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize") || searchParams.get("limit");

  let page = pageParam ? parseInt(pageParam, 10) : PAGINATION_DEFAULTS.PAGE;
  let pageSize = pageSizeParam
    ? parseInt(pageSizeParam, 10)
    : PAGINATION_DEFAULTS.PAGE_SIZE;

  // Ensure valid values
  if (isNaN(page) || page < 1) {
    page = PAGINATION_DEFAULTS.PAGE;
  }

  if (isNaN(pageSize) || pageSize < 1) {
    pageSize = PAGINATION_DEFAULTS.PAGE_SIZE;
  }

  // Enforce maximum page size
  if (pageSize > PAGINATION_DEFAULTS.MAX_PAGE_SIZE) {
    pageSize = PAGINATION_DEFAULTS.MAX_PAGE_SIZE;
  }

  return { page, pageSize };
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  page: number,
  pageSize: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize);

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Calculate skip value for Prisma
 */
export function calculateSkip(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: calculatePagination(page, pageSize, total),
  };
}
