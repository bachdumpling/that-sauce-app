import { Creator } from "./creator";
import { Project } from "./project";
import { Media } from "./media";

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error?: string;
  meta?: ResponseMeta;
}

// Response metadata types
export interface ResponseMeta {
  pagination?: PaginationMeta;
  filters?: FilterMeta;
  [key: string]: any;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface FilterMeta {
  appliedFilters: Record<string, any>;
  availableFilters?: Record<string, any>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SearchResult {
  creators?: Creator[];
  projects?: Project[];
  media?: Media[];
  total?: number;
}
