import { API_BASE_URL, API_ENDPOINTS } from "@/config/api";

interface SearchParams {
  q: string;
  limit?: number;
  page?: number;
  contentType?: "all" | "videos";
}

export async function searchCreators(params: SearchParams) {
  const queryParams = new URLSearchParams({
    q: params.q,
    ...(params.limit && { limit: params.limit.toString() }),
    ...(params.page && { page: params.page.toString() }),
    ...(params.contentType && { contentType: params.contentType }),
  });

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.search}/creators?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error('Search request failed');
  }
  return response.json();
}
