import { ProjectRepository } from "../repositories/ProjectRepository";
import { CreatorRepository } from "../repositories/CreatorRepository";
import { PortfolioRepository } from "../repositories/PortfolioRepository";
import { Project, ProjectWithMedia } from "../models/Project";

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
  async getProject(projectId: string, userId: string): Promise<ProjectWithMedia> {
    const creator = await this.creatorRepo.getByProfileId(userId);
    if (!creator) {
      throw new Error("Creator profile not found");
    }

    const project = await this.projectRepo.getById(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check if the project belongs to the creator
    const projectBelongsToCreator = await this.projectRepo.belongsToCreator(projectId, creator.id);
    if (!projectBelongsToCreator) {
      throw new Error("You don't have permission to access this project");
    }

    return project;
  }

  /**
   * Create a new project
   */
  async createProject(userId: string, title: string, description?: string): Promise<Project> {
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
      description: description?.trim() || null,
      creator_id: creator.id,
      portfolio_id: portfolio.id,
    });

    // Update portfolio with new project
    await this.portfolioRepo.addProject(portfolio.id, project.id);

    return project;
  }

  /**
   * Update a project
   */
  async updateProject(projectId: string, userId: string, data: Partial<Pick<Project, "title" | "description">>): Promise<Project> {
    const creator = await this.creatorRepo.getByProfileId(userId);
    if (!creator) {
      throw new Error("Creator profile not found");
    }

    // Verify ownership
    const belongsToCreator = await this.projectRepo.belongsToCreator(projectId, creator.id);
    if (!belongsToCreator) {
      throw new Error("You don't have permission to update this project");
    }

    // Update the project
    return this.projectRepo.update(projectId, data);
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    const creator = await this.creatorRepo.getByProfileId(userId);
    if (!creator) {
      throw new Error("Creator profile not found");
    }

    // Verify ownership
    const belongsToCreator = await this.projectRepo.belongsToCreator(projectId, creator.id);
    if (!belongsToCreator) {
      throw new Error("You don't have permission to delete this project");
    }

    // Get portfolio
    const portfolio = await this.portfolioRepo.getByCreatorId(creator.id);
    if (portfolio) {
      // Remove project from portfolio
      await this.portfolioRepo.removeProject(portfolio.id, projectId);
    }

    // Delete the project
    await this.projectRepo.delete(projectId);
  }
} 