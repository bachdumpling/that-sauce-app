import React from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProfileClientWrapper } from "./components/profile-client-wrapper";

export default async function ProfilePage() {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to sign-in if not authenticated
  if (!user) {
    redirect("/sign-in");
  }

  // Get creator profile
  const { data: creator } = await supabase
    .from("creators")
    .select("username")
    .eq("profile_id", user.id)
    .single();

  // If user has a creator profile, redirect to their creator page
  if (creator && creator.username) {
    redirect(`/${creator.username}`);
  } else {
    // If user doesn't have a creator profile, redirect to settings
    redirect("/settings");
  }
}
