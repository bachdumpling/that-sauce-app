import { supabase } from "../lib/supabase";
import { Portfolio } from "../models/Portfolio";

export class PortfolioRepository {
  /**
   * Get portfolio by ID
   */
  async getById(id: string): Promise<Portfolio | null> {
    const { data, error } = await supabase
      .from("portfolios")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get portfolio by creator ID
   */
  async getByCreatorId(creatorId: string): Promise<Portfolio | null> {
    const { data, error } = await supabase
      .from("portfolios")
      .select("*")
      .eq("creator_id", creatorId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Add project to portfolio
   */
  async addProject(portfolioId: string, projectId: string): Promise<boolean> {
    const { error } = await supabase.rpc("append_project_to_portfolio", {
      p_portfolio_id: portfolioId,
      p_project_id: projectId,
    });

    return !error;
  }

  /**
   * Remove project from portfolio
   */
  async removeProject(
    portfolioId: string,
    projectId: string
  ): Promise<boolean> {
    const { error } = await supabase.rpc("remove_project_from_portfolio", {
      p_portfolio_id: portfolioId,
      p_project_id: projectId,
    });

    return !error;
  }
}
