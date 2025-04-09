// Common types that can be used across both client and server

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

export interface Creator {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  isVerified?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  creator?: Creator;
  thumbnailUrl?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Media {
  id: string;
  type: "image" | "video" | "audio";
  url: string;
  thumbnailUrl?: string;
  projectId?: string;
  creatorId: string;
  title?: string;
  description?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  creators?: Creator[];
  projects?: Project[];
  media?: Media[];
  total?: number;
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
