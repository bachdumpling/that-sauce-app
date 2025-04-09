import { serverApiRequest } from "./apiServer";
import { API_ENDPOINTS } from "@/lib/api/shared/endpoints";
import { ApiResponse, Project, Media } from "@/lib/api/shared/types";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

/**
 * Get project by ID from the server-side
 * Uses server-side authentication and data fetching
 */
export async function getProjectByIdServer(
  projectId: string
): Promise<ApiResponse<Project>> {
  return serverApiRequest.get<Project>(API_ENDPOINTS.getProject(projectId));
}

/**
 * Get project's media from the server-side
 */
export async function getProjectMediaServer(
  projectId: string,
  page = 1,
  limit = 10
): Promise<ApiResponse<{ media: Media[]; total: number }>> {
  return serverApiRequest.get<{ media: Media[]; total: number }>(
    API_ENDPOINTS.getProjectMedia(projectId),
    { page, limit }
  );
}

/**
 * Direct database access for project (server-only functionality)
 */
export async function getProjectDirectFromDB(
  projectId: string
): Promise<Project | null> {
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
    .from("projects")
    .select("*, creator:creator_id(*)")
    .eq("id", projectId)
    .single();

  if (error) {
    console.error("Error fetching project from DB:", error);
    return null;
  }

  return data as Project;
}

/**
 * Update project from the server-side
 */
export async function updateProjectServer(
  projectId: string,
  projectData: Partial<Project>
): Promise<ApiResponse<Project>> {
  return serverApiRequest.put<Project>(
    API_ENDPOINTS.getProject(projectId),
    projectData
  );
}

/**
 * Delete project from the server-side
 */
export async function deleteProjectServer(
  projectId: string
): Promise<ApiResponse<void>> {
  return serverApiRequest.delete<void>(API_ENDPOINTS.getProject(projectId));
}
