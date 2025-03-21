import { Creator } from "./Creator";
import { Project } from "./Project";
import { Media } from "./Media";

export interface AdminUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: "admin" | "super_admin";
}

export interface SystemStats {
  creators: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  projects: {
    total: number;
  };
  media: {
    total: number;
    images: number;
    videos: number;
  };
}

export interface RejectedCreator {
  id: string;
  creator_id?: string;
  username: string;
  email?: string;
  location?: string;
  bio?: string;
  primary_role?: string[];
  social_links?: Record<string, string>;
  years_of_experience?: number;
  work_email?: string;
  rejection_reason: string;
  rejected_by: string;
  rejected_at: string;
  admin?: {
    first_name?: string;
    last_name?: string;
  };
}

export interface CreatorStatusUpdateRequest {
  status: "approved" | "rejected" | "pending";
  reason?: string;
}

export interface MediaListParams {
  page?: number;
  limit?: number;
  project_id?: string;
  type?: "image" | "video" | "all";
}

export interface CreatorListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "approved" | "rejected" | "pending" | "all";
}
