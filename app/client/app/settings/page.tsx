import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SettingsClient } from "./components/settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to sign-in if not authenticated
  if (!user) {
    redirect("/sign-in");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get creator profile if it exists
  const { data: creator } = await supabase
    .from("creators")
    .select("username")
    .eq("profile_id", user.id)
    .single();

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
      <SettingsClient 
        user={user} 
        profile={profile || null} 
        creator={creator || null} 
      />
    </div>
  );
} 