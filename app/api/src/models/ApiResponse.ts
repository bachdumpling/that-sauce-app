/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * Filter metadata
 */
export interface FilterMeta {
  appliedFilters: Record<string, any>;
  availableFilters?: Record<string, any>;
}

/**
 * Response metadata
 */
export interface ResponseMeta {
  pagination?: PaginationMeta;
  filters?: FilterMeta;
}

/**
 * Error codes used across the API
 */
export enum ErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  INVALID_PARAMETER = "INVALID_PARAMETER",
  MISSING_PARAMETERS = "MISSING_PARAMETERS",
  SERVER_ERROR = "SERVER_ERROR",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  USERNAME_TAKEN = "USERNAME_TAKEN",
  CREATION_FAILED = "CREATION_FAILED",
  UPDATE_FAILED = "UPDATE_FAILED"
} 