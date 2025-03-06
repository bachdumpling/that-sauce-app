"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useReducer,
} from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface Creator {
  id: string;
  username: string;
  profile_id: string;
}

// Define clear auth states
type AuthState =
  | { status: "INITIAL" }
  | { status: "LOADING" }
  | { status: "AUTHENTICATED"; user: User; creator: Creator | null }
  | { status: "UNAUTHENTICATED" }
  | { status: "ERROR"; error: string };

// Define auth actions
type AuthAction =
  | { type: "AUTH_LOADING" }
  | { type: "AUTH_SUCCESS"; user: User; creator: Creator | null }
  | { type: "AUTH_FAILURE"; error?: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "SET_CREATOR"; creator: Creator | null };

// Auth reducer for state management
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_LOADING":
      return { status: "LOADING" };
    case "AUTH_SUCCESS":
      return {
        status: "AUTHENTICATED",
        user: action.user,
        creator: action.creator,
      };
    case "AUTH_FAILURE":
      return {
        status: "UNAUTHENTICATED",
      };
    case "AUTH_LOGOUT":
      return { status: "UNAUTHENTICATED" };
    case "SET_CREATOR":
      if (state.status !== "AUTHENTICATED") {
        return state;
      }
      return {
        ...state,
        creator: action.creator,
      };
    default:
      return state;
  }
}

interface AuthContextType {
  state: AuthState;
  user: User | null;
  creator: Creator | null;
  isLoading: boolean;
  isCreatorLoading: boolean;
  login: (email: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  checkCreator: () => Promise<Creator | null>;
  setupCreator: (username: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session storage helpers for resilience
const storeSessionData = (user: User | null, creator: Creator | null) => {
  try {
    if (user) {
      localStorage.setItem(
        "muse_user_session",
        JSON.stringify({
          user,
          creator,
          timestamp: Date.now(),
        })
      );
    } else {
      localStorage.removeItem("muse_user_session");
    }
  } catch (error) {
    console.error("Error storing session data:", error);
  }
};

const getStoredSessionData = () => {
  try {
    const data = localStorage.getItem("muse_user_session");
    if (!data) return null;

    const parsedData = JSON.parse(data);
    const timestamp = parsedData.timestamp || 0;

    // Only use stored session if it's less than 24 hours old
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem("muse_user_session");
      return null;
    }

    return parsedData;
  } catch (error) {
    console.error("Error retrieving stored session:", error);
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { status: "INITIAL" });
  const [isCreatorLoading, setIsCreatorLoading] = useState(false);
  const router = useRouter();

  // Derived state for backward compatibility
  const user = state.status === "AUTHENTICATED" ? state.user : null;
  const creator = state.status === "AUTHENTICATED" ? state.creator : null;
  const isLoading = state.status === "LOADING" || state.status === "INITIAL";

  // Safety timeout to ensure we're never stuck in loading
  useEffect(() => {
    if (state.status === "LOADING") {
      const safetyTimeout = setTimeout(() => {
        console.warn(
          "Safety timeout triggered: forcing auth state to resolve after 10s"
        );
        // Try to recover from stored session
        const storedSession = getStoredSessionData();
        if (storedSession?.user) {
          dispatch({
            type: "AUTH_SUCCESS",
            user: storedSession.user,
            creator: storedSession.creator,
          });
        } else {
          dispatch({ type: "AUTH_FAILURE" });
        }
      }, 10000);

      return () => clearTimeout(safetyTimeout);
    }
  }, [state.status]);

  const checkCreatorWithUser = useCallback(
    async (currentUser: User) => {
      if (!currentUser?.id) return null;

      try {
        setIsCreatorLoading(true);
        const { data, error } = await supabase
          .from("creators")
          .select("id, username, profile_id")
          .eq("profile_id", currentUser.id)
          .single();

        if (error) {
          console.error("Error checking creator:", error);
          return null;
        }

        // Update creator in state
        dispatch({ type: "SET_CREATOR", creator: data });
        return data;
      } catch (error) {
        console.error("Error checking creator:", error);
        return null;
      } finally {
        setIsCreatorLoading(false);
      }
    },
    [dispatch]
  );

  const checkCreator = useCallback(async () => {
    if (state.status !== "AUTHENTICATED") return null;
    return checkCreatorWithUser(state.user);
  }, [state, checkCreatorWithUser]);

  const refreshSession = async () => {
    try {
      // Set loading state
      dispatch({ type: "AUTH_LOADING" });
      console.log("Refreshing session...");

      // Add a timeout to prevent getting stuck forever
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Session refresh timeout")), 20000)
      );

      let sessionData;
      let sessionError;

      try {
        // Race the session refresh with a timeout
        const result = await Promise.race([
          supabase.auth.refreshSession(),
          timeoutPromise,
        ]);
        sessionData = result.data;
        sessionError = result.error;
      } catch (error) {
        console.error("Error in session refresh race:", error);
        sessionError = error;
      }

      if (sessionError) {
        console.error("Error refreshing session:", sessionError);

        // Try to retrieve from storage as fallback
        const storedSession = getStoredSessionData();
        if (storedSession?.user) {
          console.log("Using stored session as fallback");
          dispatch({
            type: "AUTH_SUCCESS",
            user: storedSession.user,
            creator: storedSession.creator,
          });

          // Check creator profile asynchronously
          setTimeout(() => checkCreatorWithUser(storedSession.user), 0);
          return;
        }

        dispatch({ type: "AUTH_FAILURE", error: "Session refresh failed" });
        return;
      }

      const currentUser = sessionData?.session?.user ?? null;
      console.log(
        "Session refresh result:",
        currentUser ? "User found" : "No user"
      );

      if (!currentUser) {
        console.log("No user found after session refresh");
        dispatch({ type: "AUTH_FAILURE" });
        storeSessionData(null, null);
        return;
      }

      // Set authenticated state immediately
      dispatch({ type: "AUTH_SUCCESS", user: currentUser, creator: null });

      // Fetch profile role after refresh
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile after refresh:", profileError);
        } else if (profile) {
          console.log("Profile role fetched successfully");
          const userWithRole = {
            ...currentUser,
            role: profile.role,
          };

          // Update user with role
          dispatch({ type: "AUTH_SUCCESS", user: userWithRole, creator });
          storeSessionData(userWithRole, creator);
        }

        // Check creator profile asynchronously
        checkCreatorWithUser(currentUser)
          .then((creatorData) => {
            console.log(
              "Creator profile check completed:",
              creatorData ? "Found" : "Not found"
            );
            if (creatorData) {
              storeSessionData(currentUser, creatorData);
            }
          })
          .catch((error) => {
            console.error("Error checking creator profile:", error);
          });
      } catch (profileError) {
        console.error("Error fetching profile after refresh:", profileError);
      }
    } catch (error) {
      console.error("Unexpected error refreshing session:", error);
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}, message: ${error.message}`);
      }
      dispatch({ type: "AUTH_FAILURE", error: "Unexpected error" });
    }
  };

  const checkUser = async () => {
    try {
      dispatch({ type: "AUTH_LOADING" });
      console.log("Starting checkUser...");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting session:", sessionError);

        // Try to use stored session as fallback
        const storedSession = getStoredSessionData();
        if (storedSession?.user) {
          console.log("Using stored session as fallback during checkUser");
          dispatch({
            type: "AUTH_SUCCESS",
            user: storedSession.user,
            creator: storedSession.creator,
          });

          // Check creator profile asynchronously
          setTimeout(() => checkCreatorWithUser(storedSession.user), 0);
          return;
        }

        dispatch({ type: "AUTH_FAILURE" });
        return;
      }

      const currentUser = session?.user ?? null;
      console.log("checkUser result:", currentUser ? "User found" : "No user");

      if (!currentUser) {
        dispatch({ type: "AUTH_FAILURE" });
        storeSessionData(null, null);
        return;
      }

      // Set authenticated state immediately
      dispatch({ type: "AUTH_SUCCESS", user: currentUser, creator: null });

      try {
        // Fetch profile role
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single();

        if (error) {
          console.error("Error fetching profile role:", error);
        } else if (profile) {
          console.log("Profile role fetched successfully in checkUser");
          // Create a new user object with the role
          const userWithRole = {
            ...currentUser,
            role: profile.role,
          };

          // Update user with role
          dispatch({ type: "AUTH_SUCCESS", user: userWithRole, creator });
        }

        // Check creator profile asynchronously
        checkCreatorWithUser(currentUser).catch((error) => {
          console.error("Error checking creator profile in checkUser:", error);
        });
      } catch (error) {
        console.error("Error in user profile check:", error);
      }
    } catch (error) {
      console.error("Error checking user:", error);
      dispatch({ type: "AUTH_FAILURE" });
      storeSessionData(null, null);
    }
  };

  useEffect(() => {
    // Check current session
    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      const currentUser = session?.user ?? null;

      if (currentUser) {
        // Set authenticated state immediately
        dispatch({ type: "AUTH_SUCCESS", user: currentUser, creator: null });

        try {
          // Fetch profile role on auth state change
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", currentUser.id)
            .single();

          if (!error && profile) {
            // Update user with role
            const userWithRole = {
              ...currentUser,
              role: profile.role,
            };
            dispatch({
              type: "AUTH_SUCCESS",
              user: userWithRole,
              creator: null,
            });
          }

          const creatorData = await checkCreatorWithUser(currentUser);
          if (event === "SIGNED_IN" && !creatorData) {
            router.push("/onboarding");
          }
        } catch (error) {
          console.error("Error in auth state change:", error);
        }
      } else {
        dispatch({ type: "AUTH_FAILURE" });
        storeSessionData(null, null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, checkCreatorWithUser]);

  const setupCreator = async (username: string) => {
    if (state.status !== "AUTHENTICATED") throw new Error("No user found");

    if (!username.trim()) {
      throw new Error("Username cannot be empty");
    }

    try {
      const { error } = await supabase.rpc("setup_creator_profile", {
        p_profile_id: state.user.id,
        p_username: username,
      });

      if (error) throw error;

      // Refresh creator data
      await checkCreator();
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message?.includes("creators_username_key")
      ) {
        throw new Error("Username already taken");
      }
      throw error;
    }
  };

  const login = async (email: string) => {
    if (!email.trim()) {
      throw new Error("Email cannot be empty");
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_CLIENT_URL}/auth/callback`,
      },
    });

    if (error) throw error;
  };

  const googleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_CLIENT_URL}/auth/callback`,
      },
    });

    if (error) throw error;
  };

  const logout = async () => {
    try {
      dispatch({ type: "AUTH_LOADING" });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      dispatch({ type: "AUTH_LOGOUT" });
      storeSessionData(null, null);
      router.push("/");
    } catch (error) {
      console.error("Error during logout:", error);
      // Force client-side cleanup even if API call fails
      dispatch({ type: "AUTH_LOGOUT" });
      storeSessionData(null, null);
      router.push("/");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        user,
        creator,
        isLoading,
        isCreatorLoading,
        login,
        googleLogin,
        logout,
        checkCreator,
        setupCreator,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
