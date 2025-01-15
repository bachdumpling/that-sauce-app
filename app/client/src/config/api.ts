// src/config/api.ts
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
export const API_ENDPOINTS = {
  search: "/search",
} as const;
