import { supabase } from "../lib/supabase";
import { Project, ProjectWithMedia, ImageMedia, VideoMedia } from "../models/Project";

export class ProjectRepository {
  /**
   * Get projects by creator ID
   */
  async getByCreatorId(creatorId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get project by ID with media
   */
  async getById(id: string): Promise<ProjectWithMedia | null> {
    // Get the project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (projectError) throw projectError;
    if (!project) return null;

    // Get project images
    const { data: images, error: imagesError } = await supabase
      .from("images")
      .select("*")
      .eq("project_id", id)
      .order("order", { ascending: true });

    if (imagesError) throw imagesError;

    // Get project videos
    const { data: videos, error: videosError } = await supabase
      .from("videos")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false });

    if (videosError) throw videosError;

    // Combine media
    const media = [
      ...(images || []).map((image) => ({ ...image, file_type: "image" } as ImageMedia)),
      ...(videos || []).map((video) => ({ ...video, file_type: "video" } as VideoMedia)),
    ];

    return {
      ...project,
      media,
    };
  }

  /**
   * Create a new project
   */
  async create(
    data: Pick<Project, "title" | "description" | "creator_id" | "portfolio_id">
  ): Promise<Project> {
    const { data: project, error } = await supabase
      .from("projects")
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return project;
  }

  /**
   * Update a project
   */
  async update(
    id: string,
    data: Partial<Pick<Project, "title" | "description">>
  ): Promise<Project> {
    const { data: project, error } = await supabase
      .from("projects")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return project;
  }

  /**
   * Delete a project
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  /**
   * Check if a project belongs to a creator
   */
  async belongsToCreator(projectId: string, creatorId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("creator_id", creatorId)
      .single();

    if (error) return false;
    return !!data;
  }
} 