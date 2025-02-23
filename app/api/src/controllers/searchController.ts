import { Request, Response } from "express";
import supabase from "../lib/supabase";
import { generateEmbedding } from "../lib/embedding";
import logger from "../config/logger";

interface SearchQueryParams {
  q: string;
  limit?: number;
  page?: number;
}

export class SearchController {
  async searchCreators(
    req: Request<{}, {}, {}, SearchQueryParams>,
    res: Response
  ) {
    try {
      const { q: query } = req.query;
      const limit = req.query.limit || 5;
      const page = req.query.page || 1;
      const offset = (page - 1) * limit;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: "Search query is required",
        });
      }

      // Generate embedding for search query
      const queryEmbedding = await generateEmbedding(query, "creators");

      if (!queryEmbedding?.values?.length) {
        logger.warn("Failed to generate embedding for query:", query);
        return res.json({
          success: false,
          data: {
            results: [],
            page: page,
            limit: limit,
            total: 0,
            query,
          },
        });
      }

      // Get matching portfolios
      const { data: matches, error: matchError } = await supabase.rpc(
        "match_portfolios",
        {
          query_embedding: queryEmbedding.values,
          match_threshold: 0.3,
          match_limit: limit,
        }
      );

      if (matchError) {
        logger.error("Portfolio match error:", matchError);
        throw matchError;
      }

      // Get full creator and project data for matches
      const results = await Promise.all(
        (matches || []).map(
          async (match: {
            id: string;
            creator_id: string;
            final_score: number;
          }) => {
            // Get creator data
            const { data: creator, error: creatorError } = await supabase
              .from("creators")
              .select(
                `
              id,
              username,
              location,
              bio,
              primary_role,
              creative_fields,
              social_links
            `
              )
              .eq("id", match.creator_id)
              .single();

            if (creatorError) {
              logger.error("Creator fetch error:", creatorError);
              throw creatorError;
            }

            // Get relevant projects with vector similarity
            const { data: projects, error: projectsError } = await supabase.rpc(
              "match_portfolio_projects",
              {
                query_embedding: queryEmbedding.values,
                target_portfolio_id: match.id,
                match_limit: 4,
              }
            );

            if (projectsError) {
              logger.error("Projects fetch error:", projectsError);
              throw projectsError;
            }

            // Get relevant images for each project
            const projectsWithImages = await Promise.all(
              (projects || []).map(async (project: { id: string }) => {
                const { data: images, error: imagesError } = await supabase.rpc(
                  "match_project_images",
                  {
                    query_embedding: queryEmbedding.values,
                    target_project_id: project.id,
                    match_limit: 3,
                  }
                );

                if (imagesError) {
                  logger.error("Images fetch error:", imagesError);
                  throw imagesError;
                }

                return {
                  ...project,
                  images: images || [],
                };
              })
            );

            return {
              profile: creator,
              projects: projectsWithImages || [],
              score: match.final_score,
            };
          }
        )
      );

      res.json({
        success: true,
        data: {
          results,
          page,
          limit,
          total: matches?.length || 0,
          query,
          processed_query: queryEmbedding.processed_text,
        },
      });
    } catch (error) {
      logger.error("Search error:", error);
      res.status(500).json({
        success: false,
        error: "Search failed",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
}
