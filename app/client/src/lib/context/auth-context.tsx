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

interface AuthContextType {
  user: User | null;
  creator: Creator | null;
  isLoading: boolean;
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
      localStorage.setItem('muse_user_session', JSON.stringify({
        user, 
        creator,
        timestamp: Date.now()
      }));
    } else {
      localStorage.removeItem('muse_user_session');
    }
  } catch (error) {
    console.error('Error storing session data:', error);
  }
};

const getStoredSessionData = () => {
  try {
    const data = localStorage.getItem('muse_user_session');
    if (!data) return null;
    
    const parsedData = JSON.parse(data);
    const timestamp = parsedData.timestamp || 0;
    
    // Only use stored session if it's less than 24 hours old
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('muse_user_session');
      return null;
    }
    
    return parsedData;
  } catch (error) {
    console.error('Error retrieving stored session:', error);
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkCreatorWithUser = useCallback(
    async (currentUser: User) => {
      if (!currentUser?.id) return null;

      try {
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
        setCreator(null);
        return null;
      }
    },
    [supabase]
  );

  const checkCreator = useCallback(async () => {
    if (!user) return null;
    return checkCreatorWithUser(user);
  }, [user, checkCreatorWithUser]);

  const refreshSession = async () => {
    try {
      setIsLoading(true);
      console.log("Refreshing session...");

      // Add a timeout to prevent getting stuck forever
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Session refresh timeout")), 20000)
      );

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
          setIsLoading(false);
          return;
        }
        
        setUser(null);
        setCreator(null);
        return;
      }

      const currentUser = data.session?.user ?? null;
      if (currentUser) {
        console.log("Session refreshed successfully");
        setUser(currentUser);

        // Fetch profile role after refresh
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", currentUser.id)
            .single();

          if (!profileError && profile) {
            const userWithRole = {
              ...currentUser,
              role: profile.role,
            };
            setUser(userWithRole);
            // Store session data
            storeSessionData(userWithRole, creator);
          }
        } catch (profileError) {
          console.error("Error fetching profile after refresh:", profileError);
        }

        await checkCreatorWithUser(currentUser);
      } else {
        console.log("No user found after session refresh");
        setUser(null);
        setCreator(null);
        storeSessionData(null, null);
      }
    } catch (error) {
      console.error("Unexpected error refreshing session:", error);
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}, message: ${error.message}`);
        // If it's a timeout error, log it specifically 
        if (error.message === "Session refresh timeout") {
          console.error("Session refresh timed out in production");
        }
      }
      setUser(null);
      setCreator(null);
    } finally {
      console.log("Session refresh complete, setting isLoading to false");
      setIsLoading(false);
    }
  };

  const checkUser = async () => {
    try {
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
          setUser(storedSession.user);
          setCreator(storedSession.creator);
          setIsLoading(false);
          return;
        }
        
        setUser(null);
        setIsLoading(false);
        return;
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
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
            // Create a new user object with the role
            const userWithRole = {
              ...currentUser,
              role: profile.role,
            };
            setUser(userWithRole);
            
            // Store updated session data
            const creatorData = await checkCreatorWithUser(currentUser);
            storeSessionData(userWithRole, creatorData);
            return;
          }

          // Check creator status
          const creatorData = await checkCreatorWithUser(currentUser);
          storeSessionData(currentUser, creatorData);
        } catch (error) {
          console.error("Error in user profile check:", error);
        }
      } else {
        // Clear stored session if no current user
        storeSessionData(null, null);
      }
    } catch (error) {
      console.error("Error checking user:", error);
      setUser(null);
      storeSessionData(null, null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check current session
    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;

      if (currentUser) {
        setUser(currentUser);

        try {
          // Fetch profile role on auth state change
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", currentUser.id)
            .single();

          if (!error && profile) {
            // Update user with role
            setUser({
              ...currentUser,
              role: profile.role,
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
        setUser(null);
        setCreator(null);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

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
      if (error instanceof Error && error.message?.includes("creators_username_key")) {
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setCreator(null);
      router.push("/");
    } catch (error) {
      console.error("Error during logout:", error);
      // Force client-side cleanup even if API call fails
      setUser(null);
      setCreator(null);
      router.push("/");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        creator,
        isLoading,
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
