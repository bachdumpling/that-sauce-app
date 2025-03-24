import { API_ENDPOINTS, buildApiUrl } from "./api";

/**
 * Interface for search parameters matching the unified search API
 */
interface SearchParams {
  q: string;                                 // Required search query
  page?: number;                             // Page number for pagination
  limit?: number;                            // Maximum number of results
  contentType?: "all" | "videos" | "images"; // Filter by content type
  role?: string;                             // Filter by creator role
  subjects?: string[];                       // Subject categories/focus areas
  styles?: string[];                         // Style preferences
  maxBudget?: number;                        // Maximum budget per hour
  hasDocuments?: boolean;                    // Whether uploaded docs were provided
  documentCount?: number;                    // Number of documents uploaded
}

/**
 * Interface for search prompt enhancement parameters
 */
interface EnhanceSearchPromptParams {
  query: string;
}

/**
 * Unified search function that uses the main search API endpoint
 * @see API documentation in /app/api/docs/search-api.md
 */
export async function search(params: SearchParams) {
  const url = buildApiUrl(API_ENDPOINTS.search, {
    q: params.q,
    page: params.page || 1,
    limit: params.limit || 10,
    content_type: params.contentType || "all",
    role: params.role,
    subjects: params.subjects ? params.subjects.join(",") : undefined,
    styles: params.styles ? params.styles.join(",") : undefined,
    min_budget: params.minBudget,
    max_budget: params.maxBudget,
    has_documents: params.hasDocuments ? "true" : undefined,
    document_count: params.documentCount
  });

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    // Include credentials for authentication if needed
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Legacy search function for creators - uses unified search function
 * @deprecated Use search() instead
 */
export async function searchCreators(params: SearchParams) {
  // Forward to unified search for backward compatibility
  return search(params);
}

/**
 * Server-side version of the search function
 */
export async function searchServer(params: SearchParams) {
  return search(params);
}

/**
 * Server-side version that can be used in server components (legacy)
 * @deprecated Use searchServer() instead
 */
export async function searchCreatorsServer(params: SearchParams) {
  return search(params);
}

/**
 * Enhances a search query by generating helpful refinement options
 * Uses the Gemini AI to suggest ways to improve the search
 */
export async function enhanceSearchPrompt(params: EnhanceSearchPromptParams) {
  const url = buildApiUrl(API_ENDPOINTS.enhanceSearchPrompt, {
    query: params.query
  });

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(`Search prompt enhancement failed: ${response.statusText}`);
  }

  return response.json();
}
