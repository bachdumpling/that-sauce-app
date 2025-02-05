import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function useCreatorSetup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setupCreator = async (profileId: string, username: string) => {
    setLoading(true);
    setError(null);

    try {
      // Start a transaction by wrapping operations in a function
      const { data, error } = await supabase.rpc("setup_creator_profile", {
        p_profile_id: profileId,
        p_username: username,
      });

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { setupCreator, loading, error };
}
