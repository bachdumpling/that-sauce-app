import { ApiResponse } from "@/client/types";
import { apiRequest } from "./apiClient";
import { API_ENDPOINTS } from "../shared/endpoints";
import {
  ScrapedMedia,
  ScrapeResponse,
  ImportResponse,
} from "@/client/types/media";

/**
 * Extract media from an external URL (Behance, Dribbble, etc.)
 */
export async function extractMediaFromUrl(
  url: string,
  projectId?: string,
  autoImport: boolean = false
): Promise<ApiResponse<ScrapeResponse>> {
  return apiRequest.post<ScrapeResponse>(API_ENDPOINTS.scraper.extractMedia, {
    url,
    project_id: projectId,
    auto_import: autoImport,
  });
}

/**
 * Import scraped media into a project
 */
export async function importScrapedMedia(
  projectId: string,
  media: ScrapedMedia[],
  replaceExisting: boolean = false
): Promise<ApiResponse<ImportResponse>> {
  // Create array of media URLs with metadata
  const urlItems = media.map((item) => ({
    url: item.url,
    metadata: {
      type: item.type,
      alt_text: item.alt_text || "",
      order: item.order || 0,
      youtube_id: item.youtube_id,
      vimeo_id: item.vimeo_id,
    },
  }));

  // Use the new importUrlMedia endpoint
  return apiRequest.post<ImportResponse>(API_ENDPOINTS.media.importUrlMedia, {
    project_id: projectId,
    urls: urlItems,
    replace_existing: replaceExisting,
  });
}
