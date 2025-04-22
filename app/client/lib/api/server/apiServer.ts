import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { API_BASE_URL } from "@/lib/api/shared/endpoints";
import { ApiResponse } from "@/client/types";

// Helper function to get server-side authentication token
async function getServerAuthToken(requireAuth = true) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  // Verify user is authenticated first using getUser
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // If authentication is required, return null to signal auth failure
    // Otherwise return false to signal no auth but proceed anyway
    return requireAuth ? null : false;
  }

  // After verifying the user is authenticated, we can safely get the session token
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token;
}

// Build URL with query parameters
export function buildServerApiUrl(
  endpoint: string,
  queryParams?: Record<string, string | number | boolean | undefined>
) {
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

// Server-side API request functions with authentication
export const serverApiRequest = {
  get: async <T>(
    endpoint: string,
    queryParams?: Record<string, string | number | boolean | undefined>,
    requireAuth = false // Change the default to false
  ): Promise<ApiResponse<T>> => {
    const url = buildServerApiUrl(endpoint, queryParams);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (requireAuth) {
        const token = await getServerAuthToken(true);
        if (token === null) {
          return redirect("/sign-in") as never;
        }

        if (token) {
          // Only add Authorization header if there's a token
          headers["Authorization"] = `Bearer ${token}`;
        }
      } else {
        // Get token but don't fail if there isn't one
        const token = await getServerAuthToken(false);
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
        cache: "no-store", // Don't cache by default for server requests
      });

      const responseData = await response.json();

      // Based on the actual API response format from responseUtils.ts
      if (responseData && typeof responseData === "object") {
        // Check if response has the expected API structure
        if ("success" in responseData) {
          return {
            success: responseData.success,
            data: responseData.success ? responseData.data : null,
            error:
              !responseData.success && responseData.error
                ? responseData.error.message
                : undefined,
          };
        }
      }

      // Fallback for unexpected response format
      return {
        success: response.ok,
        data: response.ok ? responseData : null,
        error: !response.ok ? "Unexpected API response format" : undefined,
      };
    } catch (error) {
      console.error("Server API Error:", error);
      return {
        success: false,
        data: null as T,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      };
    }
  },

  post: async <T>(
    endpoint: string,
    body?: any,
    requireAuth = true
  ): Promise<ApiResponse<T>> => {
    const url = buildServerApiUrl(endpoint);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (requireAuth) {
        const token = await getServerAuthToken();
        if (!token) {
          return redirect("/login") as never;
        }

        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
      });

      const responseData = await response.json();

      // Based on the actual API response format from responseUtils.ts
      if (responseData && typeof responseData === "object") {
        // Check if response has the expected API structure
        if ("success" in responseData) {
          return {
            success: responseData.success,
            data: responseData.success ? responseData.data : null,
            error:
              !responseData.success && responseData.error
                ? responseData.error.message
                : undefined,
          };
        }
      }

      // Fallback for unexpected response format
      return {
        success: response.ok,
        data: response.ok ? responseData : null,
        error: !response.ok ? "Unexpected API response format" : undefined,
      };
    } catch (error) {
      console.error("Server API Error:", error);
      return {
        success: false,
        data: null as T,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      };
    }
  },

  put: async <T>(
    endpoint: string,
    body?: any,
    requireAuth = true
  ): Promise<ApiResponse<T>> => {
    const url = buildServerApiUrl(endpoint);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (requireAuth) {
        const token = await getServerAuthToken();
        if (!token) {
          return redirect("/login") as never;
        }

        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: "PUT",
        headers,
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
      });

      const responseData = await response.json();

      // Based on the actual API response format from responseUtils.ts
      if (responseData && typeof responseData === "object") {
        // Check if response has the expected API structure
        if ("success" in responseData) {
          return {
            success: responseData.success,
            data: responseData.success ? responseData.data : null,
            error:
              !responseData.success && responseData.error
                ? responseData.error.message
                : undefined,
          };
        }
      }

      // Fallback for unexpected response format
      return {
        success: response.ok,
        data: response.ok ? responseData : null,
        error: !response.ok ? "Unexpected API response format" : undefined,
      };
    } catch (error) {
      console.error("Server API Error:", error);
      return {
        success: false,
        data: null as T,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      };
    }
  },

  delete: async <T>(
    endpoint: string,
    queryParams?: Record<string, string | number | boolean | undefined>,
    requireAuth = true
  ): Promise<ApiResponse<T>> => {
    const url = buildServerApiUrl(endpoint, queryParams);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (requireAuth) {
        const token = await getServerAuthToken();
        if (!token) {
          return redirect("/login") as never;
        }

        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: "DELETE",
        headers,
        cache: "no-store",
      });

      const responseData = await response.json();

      // Based on the actual API response format from responseUtils.ts
      if (responseData && typeof responseData === "object") {
        // Check if response has the expected API structure
        if ("success" in responseData) {
          return {
            success: responseData.success,
            data: responseData.success ? responseData.data : null,
            error:
              !responseData.success && responseData.error
                ? responseData.error.message
                : undefined,
          };
        }
      }

      // Fallback for unexpected response format
      return {
        success: response.ok,
        data: response.ok ? responseData : null,
        error: !response.ok ? "Unexpected API response format" : undefined,
      };
    } catch (error) {
      console.error("Server API Error:", error);
      return {
        success: false,
        data: null as T,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      };
    }
  },

  // Add postFormData method for handling FormData
  postFormData: async <T>(
    endpoint: string,
    formData: FormData,
    requireAuth = true
  ): Promise<ApiResponse<T>> => {
    const url = buildServerApiUrl(endpoint);

    try {
      const headers: Record<string, string> = {
        // Don't set Content-Type header, let the browser set it with boundary for FormData
      };

      if (requireAuth) {
        const token = await getServerAuthToken();
        if (!token) {
          return redirect("/login") as never;
        }

        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
        cache: "no-store",
      });

      const responseData = await response.json();

      // Based on the actual API response format from responseUtils.ts
      if (responseData && typeof responseData === "object") {
        // Check if response has the expected API structure
        if ("success" in responseData) {
          return {
            success: responseData.success,
            data: responseData.success ? responseData.data : null,
            error:
              !responseData.success && responseData.error
                ? responseData.error.message
                : undefined,
          };
        }
      }

      // Fallback for unexpected response format
      return {
        success: response.ok,
        data: response.ok ? responseData : null,
        error: !response.ok ? "Unexpected API response format" : undefined,
      };
    } catch (error) {
      console.error("Server API Error:", error);
      return {
        success: false,
        data: null as T,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      };
    }
  },
};
