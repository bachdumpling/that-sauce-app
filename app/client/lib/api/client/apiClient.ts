import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { createClient } from "@/utils/supabase/client";
import { API_BASE_URL } from "@/lib/api/shared/endpoints";
import { ApiResponse } from "@/client/types";

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

      // If there's a user, get the session to access the token
      if (user) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

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

      try {
        const supabase = await createClient();

        // Use getUser instead of getSession for improved security
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return Promise.reject({
            success: false,
            data: null,
            error: "No active session found. Please log in.",
          });
        }

        // Try to refresh the session
        const {
          data: { session },
          error: refreshError,
        } = await supabase.auth.refreshSession();

        if (refreshError) {
          console.error("Token refresh failed:", refreshError);
          throw refreshError;
        }

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

        // Instead of auto-redirecting, just return a clear error
        return Promise.reject({
          success: false,
          data: null,
          error: "Authentication failed. Please log in again.",
        });
      }
    }

    // For all other errors, create a consistent error response
    const errorResponse = {
      success: false,
      data: null,
      error:
        error.response?.data?.error?.message ||
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
      const response: AxiosResponse = await apiClient.get(url, config);

      // Handle nested response formats
      if (response.data && typeof response.data === "object") {
        if ("success" in response.data) {
          // Already in the correct format
          return {
            success: response.data.success,
            data: response.data.success ? response.data.data : null,
            error:
              !response.data.success && response.data.error
                ? response.data.error.message
                : undefined,
            meta: response.data.meta,
          };
        }
      }

      // Fallback for unexpected response format
      return {
        success: true,
        data: response.data,
        meta: response.data.meta,
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
      const response: AxiosResponse = await apiClient.post(url, data, config);

      // Handle nested response formats
      if (response.data && typeof response.data === "object") {
        if ("success" in response.data) {
          // Already in the correct format
          return {
            success: response.data.success,
            data: response.data.success ? response.data.data : null,
            error:
              !response.data.success && response.data.error
                ? response.data.error.message
                : undefined,
            meta: response.data.meta,
          };
        }
      }

      // Fallback for unexpected response format
      return {
        success: true,
        data: response.data,
        meta: response.data.meta,
      };
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  // Add FormData specific post method for file uploads
  postFormData: async <T>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      // Log the FormData contents (keys only for privacy)
      const formDataKeys: string[] = [];
      formData.forEach((value, key) => {
        if (value instanceof File) {
          formDataKeys.push(
            `${key}: File (${value.name}, ${value.size} bytes, ${value.type})`
          );
        } else {
          formDataKeys.push(
            `${key}: ${typeof value === "string" ? value : "Non-string value"}`
          );
        }
      });

      // Create custom config for FormData that doesn't set Content-Type
      // The browser will set it automatically with the correct boundary
      const formDataConfig = {
        ...config,
        headers: {
          ...(config?.headers || {}),
          "Content-Type": "multipart/form-data", // Let axios set this properly
        },
      };

      const response: AxiosResponse = await apiClient.post(
        url,
        formData,
        formDataConfig
      );

      // Handle nested response formats
      if (response.data && typeof response.data === "object") {
        if ("success" in response.data) {
          // Already in the correct format
          return {
            success: response.data.success,
            data: response.data.success ? response.data.data : null,
            error:
              !response.data.success && response.data.error
                ? response.data.error.message
                : undefined,
            meta: response.data.meta,
          };
        }
      }

      // Fallback for unexpected response format
      return {
        success: true,
        data: response.data,
        meta: response.data.meta,
      };
    } catch (error) {
      console.error(`Error in postFormData to ${url}:`, error);
      return handleApiError(error as AxiosError);
    }
  },

  put: async <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse = await apiClient.put(url, data, config);

      // Handle nested response formats
      if (response.data && typeof response.data === "object") {
        if ("success" in response.data) {
          // Already in the correct format
          return {
            success: response.data.success,
            data: response.data.success ? response.data.data : null,
            error:
              !response.data.success && response.data.error
                ? response.data.error.message
                : undefined,
            meta: response.data.meta,
          };
        }
      }

      // Fallback for unexpected response format
      return {
        success: true,
        data: response.data,
        meta: response.data.meta,
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
      const response: AxiosResponse = await apiClient.delete(url, config);

      // Handle nested response formats
      if (response.data && typeof response.data === "object") {
        if ("success" in response.data) {
          // Already in the correct format
          return {
            success: response.data.success,
            data: response.data.success ? response.data.data : null,
            error:
              !response.data.success && response.data.error
                ? response.data.error.message
                : undefined,
            meta: response.data.meta,
          };
        }
      }

      // Fallback for unexpected response format
      return {
        success: true,
        data: response.data,
        meta: response.data.meta,
      };
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },
};

// Helper function to handle API errors
const handleApiError = (error: AxiosError): ApiResponse<any> => {
  // Check if this is already our formatted error
  if (
    error.message &&
    "success" in error &&
    "data" in error &&
    "error" in error
  ) {
    console.error("API Error (pre-formatted):", error);
    return error as unknown as ApiResponse<any>;
  }

  const errorResponse: ApiResponse<any> = {
    success: false,
    data: null,
    error:
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred",
  };

  // Add specific handling for common errors
  if (error.response?.status === 401) {
    errorResponse.error = "Authentication required. Please log in.";
  } else if (error.response?.status === 403) {
    errorResponse.error = "You don't have permission to perform this action.";
  } else if (error.response?.status === 404) {
    errorResponse.error = "The requested resource was not found.";
  } else if (error.response?.status === 429) {
    errorResponse.error = "Too many requests. Please try again later.";
  }

  // Log error for debugging
  console.error("API Error:", errorResponse);

  return errorResponse;
};
