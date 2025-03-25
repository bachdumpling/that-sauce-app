// src/models/SearchHistory.ts
export interface SearchHistoryEntry {
  id: string;
  user_id: string;
  query: string;
  content_type: string;
  created_at: string;
  results_count: number;
  embedding?: number[];
}

export interface SearchHistoryResponse {
  history: SearchHistoryEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PopularSearch {
  query: string;
  count: number;
  similarity?: number;
}
