import { ProjectRepository } from "../repositories/ProjectRepository";
import { CreatorRepository } from "../repositories/CreatorRepository";
import { PortfolioRepository } from "../repositories/PortfolioRepository";
import { Project, ProjectWithMedia } from "../models/Project";
import { supabase } from "../lib/supabase";
import { invalidateCache } from "../lib/cache";
import logger from "../config/logger";

export class ProjectService {
  private projectRepo: ProjectRepository;
  private creatorRepo: CreatorRepository;
  private portfolioRepo: PortfolioRepository;

  constructor() {
    this.projectRepo = new ProjectRepository();
    this.creatorRepo = new CreatorRepository();
    this.portfolioRepo = new PortfolioRepository();
  }

  /**
   * Get all projects for a user
   */
  async getUserProjects(userId: string): Promise<Project[]> {
    const creator = await this.creatorRepo.getByProfileId(userId);
    if (!creator) {
      throw new Error("Creator profile not found");
    }

    return this.projectRepo.getByCreatorId(creator.id);
  }

  /**
   * Get a project by ID with all media
   */
  async getProject(projectId: string): Promise<ProjectWithMedia> {
    const project = await this.projectRepo.getById(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    return project;
  }

  /**
   * Create a new project
   */
  async createProject(
    userId: string,
    title: string,
    description?: string,
    short_description?: string,
    roles?: string[],
    client_ids?: string[],
    year?: number,
    thumbnail_url?: string
  ): Promise<Project> {
    // Get creator
    const creator = await this.creatorRepo.getByProfileId(userId);
    if (!creator) {
      throw new Error("Creator profile not found");
    }

    // Get or create portfolio
    const portfolio = await this.creatorRepo.getOrCreatePortfolio(creator.id);
    if (!portfolio) {
      throw new Error("Failed to get or create portfolio");
    }

    // Create project
    const project = await this.projectRepo.create({
      title: title.trim(),
      description: description?.trim() || "",
      short_description: short_description?.trim(),
      roles: roles || [],
      client_ids: client_ids || [],
      year,
      creator_id: creator.id,
      portfolio_id: portfolio.id,
      thumbnail_url,
    });

    // Update portfolio with new project
    await this.portfolioRepo.addProject(portfolio.id, project.id);

    return project;
  }

  /**
   * Update a project
   */
  async updateProject(
    projectId: string,
    userId: string,
    data: Partial<
      Pick<
        Project,
        | "title"
        | "description"
        | "short_description"
        | "roles"
        | "client_ids"
        | "year"
        | "thumbnail_url"
      >
    >
  ): Promise<Project> {
    const creator = await this.creatorRepo.getByProfileId(userId);
    if (!creator) {
      throw new Error("Creator profile not found");
    }

    // Verify ownership
    const belongsToCreator = await this.projectRepo.belongsToCreator(
      projectId,
      creator.id
    );
    if (!belongsToCreator) {
      throw new Error("You don't have permission to update this project");
    }

    // Update the project
    return this.projectRepo.update(projectId, data);
  }

  /**
   * Delete a project
   * @param projectId - ID of the project to delete
   * @param userId - ID of the user requesting the deletion
   * @param cascade - Whether to cascade delete associated media
   */
  async deleteProject(
    projectId: string,
    userId: string,
    cascade: boolean = false
  ) {
    try {
      // First, check if the user is the owner of the project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select(
          `
          *,
          creators!inner (
            id,
            profile_id,
            username
          )
        `
        )
        .eq("id", projectId)
        .single();

      if (projectError) {
        throw new Error(
          `Project not found or you don't have access to it: ${projectError.message}`
        );
      }

      // Verify user owns the project
      if (project.creators.profile_id !== userId) {
        throw new Error("You don't have permission to delete this project");
      }

      if (cascade) {
        // Delete all images associated with the project
        const { data: images } = await supabase
          .from("images")
          .select("id, url")
          .eq("project_id", projectId);

        if (images && images.length > 0) {
          // Delete image files from storage
          for (const image of images) {
            if (image.url) {
              try {
                const url = new URL(image.url);
                const pathParts = url.pathname.split("/");
                const filePath = pathParts
                  .slice(pathParts.indexOf("media") + 1)
                  .join("/");

                await supabase.storage.from("media").remove([filePath]);
              } catch (e) {
                logger.error(`Error deleting image file: ${e}`);
                // Continue even if file deletion fails
              }
            }
          }

          // Delete image records
          await supabase.from("images").delete().eq("project_id", projectId);
        }

        // Delete all videos associated with the project
        const { data: videos } = await supabase
          .from("videos")
          .select("id, url")
          .eq("project_id", projectId);

        if (videos && videos.length > 0) {
          // Delete video files from storage if they're hosted locally
          for (const video of videos) {
            if (
              video.url &&
              !video.url.includes("youtube.com") &&
              !video.url.includes("vimeo.com")
            ) {
              try {
                const url = new URL(video.url);
                const pathParts = url.pathname.split("/");
                const filePath = pathParts
                  .slice(pathParts.indexOf("media") + 1)
                  .join("/");

                await supabase.storage.from("media").remove([filePath]);
              } catch (e) {
                logger.error(`Error deleting video file: ${e}`);
                // Continue even if file deletion fails
              }
            }
          }

          // Delete video records
          await supabase.from("videos").delete().eq("project_id", projectId);
        }
      } else {
        // Check if there are any media items associated with the project
        const { count: imageCount } = await supabase
          .from("images")
          .select("id", { count: "exact", head: true })
          .eq("project_id", projectId);

        const { count: videoCount } = await supabase
          .from("videos")
          .select("id", { count: "exact", head: true })
          .eq("project_id", projectId);

        if ((imageCount || 0) > 0 || (videoCount || 0) > 0) {
          throw new Error(
            "Cannot delete project with associated media. Use cascade=true to delete all content."
          );
        }
      }

      // Finally, delete the project
      const { error: deleteError } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (deleteError) {
        throw new Error(`Failed to delete project: ${deleteError.message}`);
      }

      // If we reach here, the deletion was successful
      // Invalidate related caches
      invalidateCache(`admin_project_details_${projectId}`);
      invalidateCache(`project_${projectId}`);
      invalidateCache("admin_projects_list_");

      if (project && project.creators && project.creators.username) {
        invalidateCache(`creator_username_${project.creators.username}`);
        invalidateCache(`creator_project_`);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get project images
   * @param projectId - ID of the project to fetch images for
   */
  async getProjectImages(projectId: string) {
    return this.projectRepo.getProjectImages(projectId);
  }

  /**
   * Get project videos
   * @param projectId - ID of the project to fetch videos for
   */
  async getProjectVideos(projectId: string) {
    return this.projectRepo.getProjectVideos(projectId);
  }

  /**
   * Get projects with their associated organizations
   */
  async getProjectWithOrganizations(
    projectId: string
  ): Promise<ProjectWithMedia> {
    const project = await this.projectRepo.getById(projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    if (project.client_ids && project.client_ids.length > 0) {
      // Fetch organizations for this project
      const { data: organizations, error } = await supabase
        .from("organizations")
        .select("*")
        .in("id", project.client_ids);

      if (error) {
        logger.error("Error fetching organizations for project:", error);
      } else {
        return {
          ...project,
          organizations: organizations || [],
        };
      }
    }

    return {
      ...project,
      organizations: [],
    };
  }
}
