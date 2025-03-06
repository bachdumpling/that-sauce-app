"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface Creator {
  id: string;
  username: string;
  profile_id: string;
}

// Simplified auth status
type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextType {
  status: AuthStatus;
  user: User | null;
  creator: Creator | null;
  isCreatorLoading: boolean;
  login: (email: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  checkCreator: () => Promise<Creator | null>;
  setupCreator: (username: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  isLoading: boolean;
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
  // Core auth state
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  // Profile state (separate from core auth)
  const [creator, setCreator] = useState<Creator | null>(null);
  const [isCreatorLoading, setIsCreatorLoading] = useState(false);

  const router = useRouter();

  // Safety timeout to prevent getting stuck in loading
  useEffect(() => {
    if (status === "loading") {
      const safetyTimeout = setTimeout(() => {
        console.warn(
          "Safety timeout triggered: forcing auth state to resolve after 10s"
        );

        // Try to recover from stored session
        const storedSession = getStoredSessionData();
        if (storedSession?.user) {
          setUser(storedSession.user);
          setCreator(storedSession.creator);
          setStatus("authenticated");
        } else {
          setStatus("unauthenticated");
        }
      }, 10000);

      return () => clearTimeout(safetyTimeout);
    }
  }, [status]);

  const checkCreatorWithUser = useCallback(async (currentUser: User) => {
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

      setCreator(data);
      return data;
    } catch (error) {
      console.error("Error checking creator:", error);
      return null;
    } finally {
      setIsCreatorLoading(false);
    }
  }, []);

  const checkCreator = useCallback(async () => {
    if (!user) return null;
    return checkCreatorWithUser(user);
  }, [user, checkCreatorWithUser]);

  const refreshSession = async () => {
    try {
      // Set loading state
      setStatus("loading");
      console.log("Refreshing session...");

      // Add a timeout to prevent getting stuck forever
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Session refresh timeout")), 20000)
      );

      try {
        // Race the session refresh with a timeout
        const { data, error } = await Promise.race([
          supabase.auth.refreshSession(),
          timeoutPromise,
        ]);

        if (error) {
          console.error("Error refreshing session:", error);

          // Try to retrieve from storage as fallback
          const storedSession = getStoredSessionData();
          if (storedSession?.user) {
            console.log("Using stored session as fallback");
            setUser(storedSession.user);
            setCreator(storedSession.creator);
            setStatus("authenticated");
            return;
          }

          setStatus("unauthenticated");
          return;
        }

        const currentUser = data.session?.user ?? null;

        if (!currentUser) {
          console.log("No user found after session refresh");
          setUser(null);
          setCreator(null);
          setStatus("unauthenticated");
          storeSessionData(null, null);
          return;
        }

        // Set authenticated state immediately
        console.log("Session refreshed successfully");
        setUser(currentUser);
        setStatus("authenticated");

        // Fetch profile data asynchronously
        Promise.all([
          // Fetch profile role
          supabase
            .from("profiles")
            .select("role")
            .eq("id", currentUser.id)
            .single()
            .then(({ data: profile, error: profileError }) => {
              if (profileError) {
                console.error("Error fetching profile:", profileError);
                return;
              }

              if (profile) {
                const userWithRole = {
                  ...currentUser,
                  role: profile.role,
                };
                setUser(userWithRole);
                storeSessionData(userWithRole, creator);
              }
            }),

          // Check creator profile
          checkCreatorWithUser(currentUser).then((creatorData) => {
            if (creatorData) {
              storeSessionData(currentUser, creatorData);
            }
          }),
        ]).catch((error) => {
          console.error("Error in profile data fetch:", error);
        });
      } catch (error) {
        console.error("Error in session refresh:", error);
        setStatus("unauthenticated");
      }
    } catch (error) {
      console.error("Unexpected error refreshing session:", error);
      setStatus("unauthenticated");
    }
  };

  // Initial session check
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("Checking initial session...");
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting initial session:", error);
          setStatus("unauthenticated");
          return;
        }

        const currentUser = data.session?.user ?? null;

        if (currentUser) {
          console.log("User found in initial session");
          setUser(currentUser);
          setStatus("authenticated");

          // Fetch profile data asynchronously
          checkCreatorWithUser(currentUser);
        } else {
          console.log("No user in initial session");
          setStatus("unauthenticated");
        }
      } catch (error) {
        console.error("Error in initial session check:", error);
        setStatus("unauthenticated");
      }
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      if (session?.user) {
        setUser(session.user);
        setStatus("authenticated");
        checkCreatorWithUser(session.user);
      } else {
        setUser(null);
        setCreator(null);
        setStatus("unauthenticated");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkCreatorWithUser]);

  const setupCreator = async (username: string) => {
    if (!user) throw new Error("No user found");

    if (!username.trim()) {
      throw new Error("Username cannot be empty");
    }

    try {
      const { error } = await supabase.rpc("setup_creator_profile", {
        p_profile_id: user.id,
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
      setStatus("loading");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setCreator(null);
      setStatus("unauthenticated");
      storeSessionData(null, null);
      router.push("/");
    } catch (error) {
      console.error("Error during logout:", error);
      // Force client-side cleanup even if API call fails
      setUser(null);
      setCreator(null);
      setStatus("unauthenticated");
      storeSessionData(null, null);
      router.push("/");
    }
  };

  // Derived value for backward compatibility
  const isLoading = status === "loading";

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        creator,
        isCreatorLoading,
        login,
        googleLogin,
        logout,
        checkCreator,
        setupCreator,
        refreshSession,
        isLoading,
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
