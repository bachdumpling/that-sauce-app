import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { API_BASE_URL } from "@/lib/api/api";
import { createClient } from "@/utils/supabase/server";

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

      // Use getUser instead of getSession for improved security
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // console.log("user in api client", user);

      // If there's a user, get the session to access the token
      if (user) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // console.log("session in api client", session);

        if (session) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
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
      console.log("Received 401 response, attempting to refresh token...");

      try {
        const supabase = await createClient();
        console.log("Checking current user...");

        // Use getUser instead of getSession for improved security
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.log("No active user found, cannot refresh");
          return Promise.reject({
            status: 401,
            message: "No active session found. Please log in.",
          });
        }

        // Try to refresh the session
        console.log("Attempting to refresh session...");
        const {
          data: { session },
          error: refreshError,
        } = await supabase.auth.refreshSession();

        if (refreshError) {
          console.error("Token refresh failed:", refreshError);
          throw refreshError;
        }

        if (session) {
          console.log("Session refreshed successfully");
          // Update the header and retry the request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
          } else {
            originalRequest.headers = {
              Authorization: `Bearer ${session.access_token}`,
            };
          }
          return apiClient(originalRequest);
        } else {
          console.log("No session returned after refresh");
        }
      } catch (refreshError) {
        console.error("Failed to refresh authentication:", refreshError);

        // Instead of auto-redirecting, just return a clear error
        return Promise.reject({
          status: 401,
          message: "Authentication failed. Please log in again.",
        });
      }
    }

    // For all other errors, create a consistent error response
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

    return Promise.reject(errorResponse);
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
  // Check if this is already our formatted error
  if (error.message && typeof error.status === "number") {
    console.error("API Error (pre-formatted):", error);
    throw error;
  }

  const errorResponse = {
    data: null,
    status: error.response?.status || 500,
    message:
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "An unexpected error occurred",
  };

  // Add specific handling for common errors
  if (errorResponse.status === 401) {
    errorResponse.message = "Authentication required. Please log in.";
  } else if (errorResponse.status === 403) {
    errorResponse.message = "You don't have permission to perform this action.";
  } else if (errorResponse.status === 404) {
    errorResponse.message = "The requested resource was not found.";
  } else if (errorResponse.status === 429) {
    errorResponse.message = "Too many requests. Please try again later.";
  }

  // Log error for debugging
  console.error("API Error:", errorResponse);

  throw errorResponse;
};
