// src/lib/api/client.ts
import axios from "axios";
import { API_BASE_URL } from "@/config/api";
import { supabase } from "@/lib/supabase";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add authentication token to requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get the current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // If there's a session, add the access token to the request
      if (session) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.error("Error adding auth token to request:", error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle expired tokens or other authorization errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 (Unauthorized) and the request hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the session
        const {
          data: { session },
          error: refreshError,
        } = await supabase.auth.refreshSession();

        if (refreshError) throw refreshError;

        if (session) {
          // Update the header and retry the request
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error("Failed to refresh authentication:", refreshError);

        // Redirect to login if refresh fails
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
      }
    }

    return Promise.reject(error);
  }
);
