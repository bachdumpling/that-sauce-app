import { API_ENDPOINTS, buildApiUrl } from "./api";

/**
 * Fetch creator details by username
 */
export async function getCreatorByUsername(username: string) {
  const url = buildApiUrl(API_ENDPOINTS.getCreatorByUsername(username));

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return {
        success: false,
        error: "Creator not found",
      };
    }
    throw new Error(`Failed to fetch creator: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch specific project by creator username and project title
 */
export async function getProjectByTitle(
  username: string,
  projectTitle: string
) {
  try {
    const url = buildApiUrl(
      API_ENDPOINTS.getProjectByTitle(username, projectTitle)
    );

    console.log(`Fetching project: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error(`Project not found: ${username}/${projectTitle}`);
        return {
          success: false,
          error: "Project not found",
        };
      }
      const errorText = await response.text();
      console.error(
        `Failed to fetch project: ${response.status} ${response.statusText}`,
        errorText
      );
      throw new Error(
        `Failed to fetch project: ${response.statusText} (${response.status})`
      );
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error(`Error in getProjectByTitle: ${error.message}`, error);
    return {
      success: false,
      error: error.message || "Failed to fetch project",
    };
  }
}

/**
 * Delete a project image (owner only)
 */
export async function deleteProjectImage(projectId: string, imageId: string) {
  try {
    const url = buildApiUrl(
      API_ENDPOINTS.deleteProjectImage(projectId, imageId)
    );

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error:
          errorData.error || `Failed to delete image: ${response.statusText}`,
      };
    }

    return {
      success: true,
      message: "Image deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting project image:", error);
    return {
      success: false,
      error: error.message || "Failed to delete image",
    };
  }
}

// Server-side version that can be used in server components
export async function getCreatorByUsernameServer(username: string) {
  return getCreatorByUsername(username);
}

// Server-side version for project fetching that can be used in server components
export async function getProjectByTitleServer(
  username: string,
  projectTitle: string
) {
  try {
    console.log(`Server-side fetching project: ${username}/${projectTitle}`);
    const result = await getProjectByTitle(username, projectTitle);
    console.log(
      `Server-side fetch result:`,
      result.success ? "Success" : `Error: ${result.error}`
    );
    return result;
  } catch (error: any) {
    console.error(
      `Server-side error in getProjectByTitleServer: ${error.message}`,
      error
    );
    return {
      success: false,
      error: error.message || "Failed to fetch project on server",
    };
  }
}
