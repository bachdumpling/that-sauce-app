import { serverApiRequest } from "./apiServer";
import { API_ENDPOINTS } from "@/lib/api/shared/endpoints";
import {
  Project,
  ProjectImage,
  ProjectVideo,
  ApiResponse,
} from "@/client/types";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

// Type for client-safe data (excludes embedding and other sensitive fields)
type WithoutEmbedding<T> = Omit<T, "embedding">;

/**
 * Generic utility to sanitize any object with an embedding field
 */
function sanitizeData<T extends { embedding?: any }>(
  data: T
): WithoutEmbedding<T> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { embedding, ...sanitizedData } = data;
  return sanitizedData as WithoutEmbedding<T>;
}

/**
 * Sanitize a project by removing sensitive fields before sending to client
 */
function sanitizeProject(project: Project): WithoutEmbedding<Project> {
  return sanitizeData(project);
}

/**
 * Create a new project from the server-side
 * Uses server-side authentication and data fetching
 */
export async function createProjectServer(
  projectData: {
    title: string;
    description?: string;
  }
): Promise<ApiResponse<WithoutEmbedding<Project>>> {
  const response = await serverApiRequest.post<Project>(
    API_ENDPOINTS.projects,
    projectData
  );

  if (response.success && response.data) {
    return {
      ...response,
      data: sanitizeProject(response.data),
    };
  }

  return response as ApiResponse<WithoutEmbedding<Project>>;
}

/**
 * Get project by ID from the server-side
 * Uses server-side authentication and data fetching
 */
export async function getProjectByIdServer(
  projectId: string
): Promise<ApiResponse<WithoutEmbedding<Project>>> {
  const response = await serverApiRequest.get<Project>(
    API_ENDPOINTS.getProject(projectId)
  );

  if (response.success && response.data) {
    return {
      ...response,
      data: sanitizeProject(response.data),
    };
  }

  return response as ApiResponse<WithoutEmbedding<Project>>;
}

/**
 * Get project's media from the server-side
 */
export async function getProjectMediaServer(
  projectId: string,
  page = 1,
  limit = 10
): Promise<
  ApiResponse<{
    images: WithoutEmbedding<ProjectImage>[];
    videos: WithoutEmbedding<ProjectVideo>[];
    total: number;
  }>
> {
  const response = await serverApiRequest.get<{
    images: ProjectImage[];
    videos: ProjectVideo[];
    total: number;
  }>(API_ENDPOINTS.getProjectMedia(projectId), { page, limit });

  if (response.success && response.data) {
    // Filter out embedding field from images if present
    const sanitizedImages = response.data.images.map((img) =>
      sanitizeData(img)
    );

    // Filter out embedding field from videos if present
    const sanitizedVideos = response.data.videos.map((vid) =>
      sanitizeData(vid)
    );

    return {
      ...response,
      data: {
        ...response.data,
        images: sanitizedImages,
        videos: sanitizedVideos,
      },
    };
  }

  return response;
}

/**
 * Direct database access for project (server-only functionality)
 */
export async function getProjectDirectFromDB(
  projectId: string
): Promise<WithoutEmbedding<Project> | null> {
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
    .select("*, creators:creator_id(*), images(*), videos(*)")
    .eq("id", projectId)
    .single();

  if (error) {
    console.error("Error fetching project from DB:", error);
    return null;
  }

  // Sanitize project data before returning to client
  return sanitizeProject(data as Project);
}

/**
 * Update project from the server-side
 */
export async function updateProjectServer(
  projectId: string,
  projectData: Partial<WithoutEmbedding<Project>>
): Promise<ApiResponse<WithoutEmbedding<Project>>> {
  const response = await serverApiRequest.put<Project>(
    API_ENDPOINTS.getProject(projectId),
    projectData
  );

  if (response.success && response.data) {
    return {
      ...response,
      data: sanitizeProject(response.data),
    };
  }

  return response as ApiResponse<WithoutEmbedding<Project>>;
}

/**
 * Delete project from the server-side
 */
export async function deleteProjectServer(
  projectId: string
): Promise<ApiResponse<void>> {
  return serverApiRequest.delete<void>(API_ENDPOINTS.getProject(projectId));
}
