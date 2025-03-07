import { API_ENDPOINTS, buildApiUrl } from "./api";

interface SearchParams {
  q: string;
  page?: number;
  limit?: number;
  contentType?: "all" | "videos";
}

export async function searchCreators(params: SearchParams) {
  const url = buildApiUrl(API_ENDPOINTS.searchCreators, {
    q: params.q,
    page: params.page || 1,
    limit: params.limit || 10,
    content_type: params.contentType || "all",
  });

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  return response.json();
}

// Server-side version that can be used in server components
export async function searchCreatorsServer(params: SearchParams) {
  return searchCreators(params);
}
