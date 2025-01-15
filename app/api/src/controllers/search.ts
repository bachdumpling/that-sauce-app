import { Request, Response } from "express";
import supabase from "../lib/supabase";
import { generateEmbedding } from "../lib/embedding";
import logger from "../config/logger";

interface SearchQueryParams {
  q: string;
  limit?: string;
  page?: string;
}

export class SearchController {
  async searchCreators(
    req: Request<{}, {}, {}, SearchQueryParams>,
    res: Response
  ) {
    try {
      const { q: query } = req.query;
      const limit = parseInt(req.query.limit || "10");
      const page = parseInt(req.query.page || "1");
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
            page: 1,
            limit: 10,
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
          match_threshold: 0.2,
          match_limit: limit,
        }
      );
      
      if (matchError) {
        logger.error("Portfolio match error:", matchError);
        throw matchError;
      }

      // Get full creator and project data for matches
      const results = await Promise.all(
        (matches || []).map(async (match: any) => {
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
            "match_projects_for_portfolios",
            {
              portfolio_ids: [match.id],
              query_embedding: queryEmbedding.values,
              project_limit: 4,
            }
          );

          if (projectsError) {
            logger.error("Projects fetch error:", projectsError);
            throw projectsError;
          }

          // Get relevant images for each project
          const projectsWithImages = await Promise.all(
            (projects || []).map(async (project: any) => {
              const { data: images, error: imagesError } = await supabase.rpc(
                "match_images_for_projects",
                {
                  project_ids: [project.id],
                  query_embedding: queryEmbedding.values,
                  image_limit: 5,
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
            score: match.score,
          };
        })
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
