import { ApiResponse } from "@/client/types";
import { serverApiRequest } from "./apiServer";
import { API_ENDPOINTS } from "../shared/endpoints";
import {
  ScrapedMedia,
  ScrapeResponse,
  ImportResponse,
} from "@/client/types/media";

/**
 * Extract media from an external URL (Behance, Dribbble, etc.) - server-side
 * This function now returns the Trigger.dev handle ID which can be used with useRun hook
 */
export async function extractMediaFromUrlServer(
  url: string,
  projectId?: string,
  autoImport: boolean = false
): Promise<ApiResponse<ScrapeResponse>> {
  return serverApiRequest.post<ScrapeResponse>(
    API_ENDPOINTS.scraper.extractMedia,
    {
      url,
      project_id: projectId,
      auto_import: autoImport,
    }
  );
}

/**
 * Import scraped media into a project - server-side
 */
export async function importScrapedMediaServer(
  projectId: string,
  media: ScrapedMedia[],
  replaceExisting: boolean = false
): Promise<ApiResponse<ImportResponse>> {
  // Create payload in the format expected by batch-upload endpoint
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

  const payload = {
    project_id: projectId,
    url_items: JSON.stringify(urlItems),
    replace_existing: replaceExisting ? "true" : "false",
  };

  return serverApiRequest.post<ImportResponse>(
    API_ENDPOINTS.scraper.importMedia,
    payload
  );
}
