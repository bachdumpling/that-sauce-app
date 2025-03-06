import React from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProfileClientWrapper } from "@/components/profile/profile-client-wrapper";

async function ProfilePage() {
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
  const { data: creator, error: creatorError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get user projects
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="container max-w-7xl mx-auto py-8">
      <ProfileClientWrapper 
        user={user}
        creator={creator || null}
        initialProjects={projects || []}
        creatorError={creatorError?.message}
        projectsError={projectsError?.message}
      />
    </div>
  );
}

export default ProfilePage;
