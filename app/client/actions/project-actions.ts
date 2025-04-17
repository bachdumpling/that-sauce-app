"use server";

import { Project, Creator } from "@/client/types";
import { revalidatePath } from "next/cache";
import {
  getProjectByIdServer,
  createProjectServer,
  updateProjectServer,
  deleteProjectServer,
} from "@/lib/api/server/projects";
import { notFound } from "next/navigation";

/**
 * Get a project by ID
 */
export async function getProjectByIdAction(projectId: string) {
  try {
    const response = await getProjectByIdServer(projectId);

    if (!response.success || !response.data) {
      console.error("Failed to fetch project:", response.error);
      return { success: false, error: response.error || "Project not found" };
    }

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Error in getProjectByIdAction:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * Create a new project
 */
export async function createProjectAction(
  username: string,
  projectData: Partial<Project>
) {
  try {
    const response = await createProjectServer(projectData);

    if (response.success) {
      // Revalidate creator pages to show the new project
      revalidatePath(`/${username}`, "layout");
      revalidatePath(`/${username}/work`, "page");

      return {
        success: true,
        message: "Project created successfully",
        data: response.data,
      };
    } else {
      return {
        success: false,
        message: response.error || "Failed to create project",
        error: response.error,
      };
    }
  } catch (error: any) {
    console.error("Error in createProjectAction:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
}

/**
 * Update a project
 */
export async function updateProjectAction(
  username: string,
  projectId: string,
  projectData: Partial<Project>
) {
  try {
    const response = await updateProjectServer(projectId, projectData);

    if (response.success) {
      // Revalidate related paths
      revalidatePath(`/${username}`, "layout");
      revalidatePath(`/${username}/work`, "page");
      revalidatePath(`/${username}/work/${projectId}`, "page");

      // Also revalidate by project title if available
      if (projectData.title) {
        revalidatePath(`/${username}/work/${projectData.title}`, "page");
      }

      return {
        success: true,
        message: "Project updated successfully",
        data: response.data,
      };
    } else {
      return {
        success: false,
        message: response.error || "Failed to update project",
        error: response.error,
      };
    }
  } catch (error: any) {
    console.error("Error in updateProjectAction:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
}

/**
 * Delete a project
 */
export async function deleteProjectAction(username: string, projectId: string) {
  try {
    const response = await deleteProjectServer(projectId);

    if (response.success) {
      // Revalidate related paths
      revalidatePath(`/${username}`, "layout");
      revalidatePath(`/${username}/work`, "page");

      return {
        success: true,
        message: "Project deleted successfully",
      };
    } else {
      return {
        success: false,
        message: response.error || "Failed to delete project",
        error: response.error,
      };
    }
  } catch (error: any) {
    console.error("Error in deleteProjectAction:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
}

/**
 * Check if a project exists - Use in middleware or layout
 * This throws notFound() if the project doesn't exist
 */
export async function checkProjectExistsAction(
  projectId: string
): Promise<Project> {
  try {
    const response = await getProjectByIdServer(projectId);

    if (!response.success || !response.data) {
      console.error("Project not found:", response.error);
      notFound();
    }

    return response.data;
  } catch (error) {
    console.error("Error checking if project exists:", error);
    notFound();
  }
}
