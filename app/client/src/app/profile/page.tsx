"use client";

import { useAuth } from "@/lib/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { ProjectCard } from "@/components/ProjectCard";

interface Project {
  id: string;
  title: string;
  description: string | null;
}

interface MediaEntry {
  id: string;
  user_id: string;
  file_path: string;
  file_type: "image" | "video";
  storage_url: string;
  mime_type: string;
  size_bytes: number;
  metadata: {
    original_name: string;
  };
}

function CreateProjectForm({
  onProjectCreated,
}: {
  onProjectCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { creator } = useAuth();

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creator || !title.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const { data: project, error: projectError } = await supabase.rpc(
        "create_project",
        {
          p_creator_id: creator.id,
          p_title: title.trim(),
          p_description: description.trim() || null,
        }
      );

      if (projectError) throw projectError;
      if (!project) throw new Error("No project returned from creation");

      setTitle("");
      setDescription("");
      onProjectCreated();
    } catch (err) {
      console.error("Error creating project:", err);
      setError(
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String(err.message)
            : "Failed to create project"
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={createProject} className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Project Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isCreating}
          />
          <Input
            placeholder="Project Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isCreating}
          />
        </div>
        <Button type="submit" disabled={isCreating}>
          <Plus className="h-4 w-4 mr-2" />
          {isCreating ? "Creating..." : "Create Project"}
        </Button>
      </form>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout, isLoading, creator } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    if (!creator) return;

    console.log("Fetching projects for creator:", {
      creator_id: creator.id,
      profile_id: creator.profile_id,
      auth_id: user?.id,
    });

    // First check if we can access the creators table
    const { data: creatorCheck, error: creatorError } = await supabase
      .from("creators")
      .select("*")
      .eq("id", creator.id)
      .single();

    console.log("Creator check:", { creatorCheck, error: creatorError });

    // Then check if we can access the portfolios table
    const { data: portfolio, error: portfolioError } = await supabase
      .from("portfolios")
      .select(
        `
        id,
        creator_id,
        project_ids,
        projects (
          id,
          title,
          description
        )
      `
      )
      .eq("creator_id", creator.id)
      .single();

    console.log("Portfolio check:", { portfolio, error: portfolioError });

    if (portfolio && portfolio.projects) {
      setProjects(portfolio.projects);
      return;
    }

    // Fallback to direct projects query if the join doesn't work
    const { data, error } = await supabase
      .from("projects")
      .select("id, title, description")
      .eq("creator_id", creator.id)
      .order("created_at", { ascending: false });

    console.log("Projects query result:", { data, error });

    if (error) {
      console.error("Error fetching projects:", error);
      return;
    }

    setProjects(data || []);
  };

  useEffect(() => {
    if (creator) {
      fetchProjects();
    }
  }, [creator]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user || !creator) {
    router.push("/auth/login");
    return null;
  }

  const handleUploadComplete = (url: string, mediaEntry: MediaEntry) => {
    console.log("File uploaded:", url, mediaEntry);
    fetchProjects();
  };

  const handleError = (error: string) => {
    console.error("Upload failed:", error);
    setError(error);
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profile</CardTitle>
          <Button variant="outline" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Email
              </h3>
              <p>{user?.email}</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Projects</h3>
              </div>

              <CreateProjectForm onProjectCreated={fetchProjects} />

              {error && (
                <p className="text-sm text-red-500 bg-red-50 p-2 rounded">
                  {error}
                </p>
              )}

              <div className="space-y-4">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onUploadComplete={handleUploadComplete}
                    onError={handleError}
                  />
                ))}

                {projects.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No projects yet. Create your first project to get started.
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
