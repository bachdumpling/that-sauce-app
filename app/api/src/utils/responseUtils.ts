import { Response } from "express";
import {
  ApiSuccessResponse,
  ApiErrorResponse,
  ErrorCode,
  PaginationMeta,
  FilterMeta,
  ResponseMeta
} from '../models/ApiResponse';

/**
 * Send a successful response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  meta?: ResponseMeta,
  statusCode = 200
): void {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
  
  res.status(statusCode).json(response);
}

/**
 * Send an error response
 */
export function sendError(
  res: Response,
  code: ErrorCode | string,
  message: string,
  details?: any,
  statusCode = 500
): void {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === "development" ? { details } : {}),
    },
  };
  
  res.status(statusCode).json(response);
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Create filter metadata
 */
export function createFilterMeta(
  appliedFilters: Record<string, any>,
  availableFilters?: Record<string, any>
): FilterMeta {
  return {
    appliedFilters,
    ...(availableFilters ? { availableFilters } : {}),
  };
}

/**
 * Parse pagination parameters from request query
 */
export function parsePaginationParams(query: any): {
  page: number;
  limit: number;
  offset: number;
} {
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Parse filter parameters from request query
 * Expects filters in format filter[field]=value
 */
export function parseFilterParams(query: any): Record<string, any> {
  const filters: Record<string, any> = {};

  Object.keys(query).forEach((key) => {
    const match = key.match(/^filter\[(.*)\]$/);
    if (match && match[1]) {
      filters[match[1]] = query[key];
    }
  });

  return filters;
}

/**
 * Parse sort parameter from request query
 * Format: field (ascending) or -field (descending)
 */
export function parseSortParams(
  query: any,
  defaultSort = "-created_at"
): {
  sortField: string;
  sortDirection: "asc" | "desc";
  sortParam: string;
} {
  const sortParam = (query.sort as string) || defaultSort;
  const sortField = sortParam.startsWith("-")
    ? sortParam.substring(1)
    : sortParam;
  const sortDirection = sortParam.startsWith("-") ? "desc" : "asc";

  return { sortField, sortDirection, sortParam };
}
