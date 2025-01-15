import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/config/api";

export interface SearchParams {
  q: string;
  page?: number;
  limit?: number;
}

export const searchCreators = async (params: SearchParams) => {
  const { data } = await apiClient.get(`${API_ENDPOINTS.search}/creators`, {
    params: {
      q: params.q,
      page: params.page || 1,
      limit: params.limit || 10,
    },
  });
  return data;
};
