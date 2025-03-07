export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const API_ENDPOINTS = {
  // Search endpoints
  search: "/search",
  searchCreators: "/search/creators",

  // Project endpoints
  projects: "/projects",
  projectMedia: (projectId: string) => `/projects/${projectId}/media`,

  // Admin endpoints
  admin: {
    creators: "/admin/creators",
    creatorDetails: (creatorId: string) => `/admin/creators/${creatorId}`,
    rejectCreator: (creatorId: string) => `/admin/creators/${creatorId}/reject`,
    rejectedCreators: "/admin/unqualified/creators",
    projects: "/admin/projects",
    projectDetails: (projectId: string) => `/admin/projects/${projectId}`,
    deleteProjectImage: (projectId: string, imageId: string) =>
      `/admin/projects/${projectId}/images/${imageId}`,
  },
} as const;

// Helper function to build full API URLs
export const buildApiUrl = (
  endpoint: string,
  queryParams?: Record<string, string | number | boolean | undefined>
) => {
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
};
