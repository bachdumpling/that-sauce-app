export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
export const API_ENDPOINTS = {
  auth: "/auth",
  creators: "/creators",
  projects: "/projects",
  portfolios: "/portfolios",
  search: "/search",
  moodboards: "/moodboards",
} as const;
