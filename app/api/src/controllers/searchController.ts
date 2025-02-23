import { Request, Response } from "express";
import supabase from "../lib/supabase";
import { generateEmbedding } from "../lib/embedding";
import logger from "../config/logger";

interface SearchQueryParams {
  q: string;
  limit?: number;
  page?: number;
  contentType?: "all" | "videos";
}

export class SearchController {
  async searchCreators(
    req: Request<{}, {}, {}, SearchQueryParams>,
    res: Response
  ) {
    try {
      const { q: query, contentType = "all" } = req.query;
      const limit = Number(req.query.limit) || 5;
      const page = Number(req.query.page) || 1;
      const offset = (page - 1) * limit;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: "Search query is required",
        });
      }

      // Generate embedding for the search query
      const queryEmbedding = await generateEmbedding(query, "creators");

      if (!queryEmbedding?.values?.length) {
        logger.warn("Failed to generate embedding for query:", query);
        return res.json({
          success: false,
          data: {
            results: [],
            page,
            limit,
            total: 0,
            query,
          },
        });
      }

      // Get matching portfolios using the existing RPC function
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

      // Process each matching portfolio
      const results = await Promise.all(
        (matches || []).map(async (match: any) => {
          // Retrieve creator details
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

          // When searching for videos, check that the creator has at least one video
          if (contentType === "videos") {
            const { data: videoCheck, error: videoCheckError } = await supabase
              .from("videos")
              .select("id", { count: "exact" })
              .eq("creator_id", creator.id)
              .limit(1);

            if (videoCheckError) {
              logger.error("Video check error:", videoCheckError);
              throw videoCheckError;
            }
            if (!videoCheck || videoCheck.length === 0) {
              // Skip this creator if no videos are found
              return null;
            }
          }

          // Choose the RPC based on content type
          const rpcName =
            contentType === "videos"
              ? "match_portfolio_projects_with_videos"
              : "match_portfolio_projects";

          // Retrieve matching projects for the portfolio
          const { data: projects, error: projectsError } = await supabase.rpc(
            rpcName,
            {
              query_embedding: queryEmbedding.values,
              target_portfolio_id: match.id,
              match_limit: 3,
            }
          );

          if (projectsError) {
            logger.error("Projects fetch error:", projectsError);
            throw projectsError;
          }

          // Process each project – if not in video-only mode, also retrieve matching images
          const processedProjects = await Promise.all(
            (projects || []).map(async (project: any) => {
              let images = [];
              if (contentType !== "videos") {
                const { data: imageData, error: imagesError } =
                  await supabase.rpc("match_project_images", {
                    query_embedding: queryEmbedding.values,
                    target_project_id: project.id,
                    match_limit: 4,
                  });

                if (imagesError) {
                  logger.error("Images fetch error:", imagesError);
                  throw imagesError;
                }
                images = imageData || [];
              }

              // For video searches, the RPC returns aggregated videos in the "matched_videos" field
              const videos = project.matched_videos || [];

              return {
                ...project,
                images,
                videos,
                matched_videos: undefined, // Remove raw field if not needed
              };
            })
          );

          return {
            profile: creator,
            projects: processedProjects || [],
            score: match.final_score,
          };
        })
      );

      // Remove any creators that were skipped (returned null)
      const filteredResults = results.filter((result) => result !== null);

      res.json({
        success: true,
        data: {
          results: filteredResults,
          page,
          limit,
          total: filteredResults.length,
          query,
          content_type: contentType,
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
