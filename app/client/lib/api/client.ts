import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { API_BASE_URL } from "@/lib/api/api";
import { createClient } from "@/utils/supabase/client";

// Define response type for better type safety
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout
});

// Add authentication token to requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get the current session
      const supabase = await createClient();
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
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // If the error is 401 (Unauthorized) and the request hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const supabase = await createClient();
        // Try to refresh the session
        const {
          data: { session },
          error: refreshError,
        } = await supabase.auth.refreshSession();

        if (refreshError) throw refreshError;

        if (session) {
          // Update the header and retry the request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
          } else {
            originalRequest.headers = {
              Authorization: `Bearer ${session.access_token}`,
            };
          }
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

// Helper functions for API requests with better error handling and type safety
export const apiRequest = {
  get: async <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<T> = await apiClient.get(url, config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  post: async <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<T> = await apiClient.post(
        url,
        data,
        config
      );
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  put: async <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<T> = await apiClient.put(url, data, config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  delete: async <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<T> = await apiClient.delete(url, config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },
};

// Helper function to handle API errors
const handleApiError = (error: AxiosError): never => {
  const errorResponse = {
    data: null,
    status: error.response?.status || 500,
    message:
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred",
  };

  // Log error for debugging
  console.error("API Error:", errorResponse);

  throw errorResponse;
};
