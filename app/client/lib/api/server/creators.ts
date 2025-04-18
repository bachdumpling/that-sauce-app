import { serverApiRequest } from "./apiServer";
import { ApiResponse, Creator, Project } from "@/client/types";
import { API_ENDPOINTS } from "@/lib/api/shared/endpoints";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

/**
 * Get creator by username from the server-side
 * Uses server-side authentication and data fetching
 */
export async function getCreatorByUsernameServer(
  username: string
): Promise<ApiResponse<Creator>> {
  return serverApiRequest.get<Creator>(
    API_ENDPOINTS.getCreatorByUsername(username)
  );
}

/**
 * Get creator by ID from the server-side
 * Uses server-side authentication and data fetching
 */
export async function getCreatorByIdServer(
  creatorId: string
): Promise<ApiResponse<Creator>> {
  // Assuming there's an endpoint to get creator by ID
  // If not, we can use direct DB access as a fallback
  return serverApiRequest.get<Creator>(API_ENDPOINTS.getCreator(creatorId));
}

/**
 * Get creator's projects from the server-side
 * Uses server-side authentication and data fetching
 */
export async function getCreatorProjectsServer(
  username: string,
  page = 1,
  limit = 10
): Promise<ApiResponse<{ projects: LegacyProject[]; total: number }>> {
  return serverApiRequest.get<{ projects: LegacyProject[]; total: number }>(
    API_ENDPOINTS.getCreatorByUsername(username) + "/projects",
    { page, limit }
  );
}

/**
 * Direct database access for creator (example of server-only functionality)
 * This could potentially bypass the API layer for better performance
 */
export async function getCreatorDirectFromDB(
  username: string
): Promise<Creator | null> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  // First verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated");
    return null;
  }

  const { data, error } = await supabase
    .from("creators")
    .select("*")
    .eq("username", username)
    .single();

  if (error) {
    console.error("Error fetching creator from DB:", error);
    return null;
  }

  return data as Creator;
}

/**
 * Update creator profile from the server-side
 * Uses server-side authentication and data fetching
 */
export async function updateCreatorProfileServer(
  username: string,
  profileData: Partial<Creator>
): Promise<ApiResponse<Creator>> {
  return serverApiRequest.put<Creator>(
    API_ENDPOINTS.updateCreatorProfile(username),
    profileData
  );
}

/**
 * Upload creator avatar image from the server-side
 * Uses server-side authentication and data fetching
 */
export async function uploadCreatorAvatarServer(
  username: string,
  formData: FormData
): Promise<ApiResponse<{ avatar_url: string }>> {
  return serverApiRequest.postFormData<{ avatar_url: string }>(
    API_ENDPOINTS.uploadCreatorAvatar(username),
    formData
  );
}

/**
 * Upload creator banner image from the server-side
 * Uses server-side authentication and data fetching
 */
export async function uploadCreatorBannerServer(
  username: string,
  formData: FormData
): Promise<ApiResponse<{ banner_url: string }>> {
  return serverApiRequest.postFormData<{ banner_url: string }>(
    API_ENDPOINTS.uploadCreatorBanner(username),
    formData
  );
}

/**
 * Get project by title from a specific creator
 * Uses server-side authentication and data fetching
 */
export async function getProjectByTitleServer(
  username: string,
  projectTitle: string
): Promise<ApiResponse<LegacyProject>> {
  return serverApiRequest.get<LegacyProject>(
    API_ENDPOINTS.getProjectByTitle(username, projectTitle)
  );
}
