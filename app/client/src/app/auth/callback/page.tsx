// src/app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Exchange the code for a session
        const { error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        // Redirect to profile page on success
        router.push("/profile");
      } catch (error) {
        console.error("Error in auth callback:", error);
        router.push("/auth/login?error=Authentication failed");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Completing sign in...</h2>
        <p className="text-muted-foreground">
          Please wait while we complete your sign in.
        </p>
      </div>
    </div>
  );
}
