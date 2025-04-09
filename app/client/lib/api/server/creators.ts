import { serverApiRequest } from "./apiServer";
import { API_ENDPOINTS } from "@/lib/api/shared/endpoints";
import { ApiResponse, Creator, Project } from "@/lib/api/shared/types";
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
 * Get creator's projects from the server-side
 * Uses server-side authentication and data fetching
 */
export async function getCreatorProjectsServer(
  username: string,
  page = 1,
  limit = 10
): Promise<ApiResponse<{ projects: Project[]; total: number }>> {
  return serverApiRequest.get<{ projects: Project[]; total: number }>(
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
 * Get project by title from a specific creator
 * Uses server-side authentication and data fetching
 */
export async function getProjectByTitleServer(
  username: string,
  projectTitle: string
): Promise<ApiResponse<Project>> {
  return serverApiRequest.get<Project>(
    API_ENDPOINTS.getProjectByTitle(username, projectTitle)
  );
}
