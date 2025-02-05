"use client";
import { createContext, useContext, useEffect, useState } from "react";
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkCreatorWithUser = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from("creators")
        .select("id, username, profile_id")
        .eq("profile_id", currentUser.id)
        .single();

      if (error) throw error;
      setCreator(data);
      return data;
    } catch (error) {
      console.error("Error checking creator:", error);
      setCreator(null);
      return null;
    }
  };

  const checkCreator = async () => {
    if (!user) return null;
    return checkCreatorWithUser(user);
  };

  const checkUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        return await checkCreatorWithUser(currentUser);
      }
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
      setUser(currentUser);

      if (currentUser) {
        const creatorData = await checkCreatorWithUser(currentUser);
        if (event === "SIGNED_IN" && !creatorData) {
          router.push("/onboarding");
        }
      } else {
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

    try {
      const { data, error } = await supabase.rpc("setup_creator_profile", {
        p_profile_id: user.id,
        p_username: username,
      });

      if (error) throw error;

      // Refresh creator data
      await checkCreator();
    } catch (error: any) {
      if (error.message.includes("creators_username_key")) {
        throw new Error("Username already taken");
      }
      throw error;
    }
  };

  const login = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const googleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setCreator(null);
    router.push("/");
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
