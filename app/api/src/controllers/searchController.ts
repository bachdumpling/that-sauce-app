import { query } from "express-validator";
// src/controllers/searchController.ts
import { Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { generateEmbedding } from "../lib/embedding";
import logger from "../config/logger";
import { AuthenticatedRequest } from "../middleware/extractUser";
import { SearchQueryParams } from "../models/Search";
import { sendError, sendSuccess } from "../utils/responseUtils";
import { ErrorCode } from "../models/ApiResponse";
import { groupSearchResultsByCreator } from "../utils/searchUtils";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../config/env";

export class SearchController {
  /**
   * Search for creative content across all creators, images, and videos
   */
  async searchCreativeContent(
    req: AuthenticatedRequest<{}, any, any, SearchQueryParams>,
    res: Response
  ) {
    try {
      // Make sure contentType is exactly one of the expected values
      let contentType = req.query.contentType || "all";
      if (!["all", "images", "videos"].includes(contentType)) {
        contentType = "all";
      }

      const { q: query } = req.query;
      const limit = Number(req.query.limit) || 10;
      const page = Number(req.query.page) || 1;

      logger.info(`Search request initiated`, {
        query,
        contentType,
        limit,
        page,
      });

      if (!query) {
        return sendError(
          res,
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Search query is required",
          400
        );
      }

      // Generate embedding for the search query
      logger.info(`Generating embedding for query: "${query}"`);
      const queryEmbedding = await generateEmbedding(query, "creators");

      if (!queryEmbedding?.values?.length) {
        logger.warn("Failed to generate embedding for query:", query);
        return sendSuccess(res, {
          results: [],
          page,
          limit,
          total: 0,
          query,
          content_type: contentType,
        });
      }

      // Get search results using our RPC
      const { data: rawResults, error: searchError } = await supabase.rpc(
        "search_creative_content",
        {
          query_embedding: queryEmbedding.values,
          match_threshold: 0.1,
          match_limit: limit,
          content_filter: contentType,
        }
      );

      if (searchError) {
        logger.error("Search error:", searchError);
        throw searchError;
      }

      // Get the total count from the first result (all results have the same total_count)
      const totalCount =
        rawResults && rawResults.length > 0
          ? Number(rawResults[0].total_count)
          : 0;

      // Group results by creator
      const groupedResults = groupSearchResultsByCreator(rawResults || []);

      return sendSuccess(res, {
        results: groupedResults,
        page,
        limit,
        total: totalCount,
        query,
        content_type: contentType,
        processed_query: queryEmbedding.processed_text,
      });
    } catch (error) {
      logger.error("Search error:", error);
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Search failed",
        error,
        500
      );
    }
  }

  async enhanceSearchPrompt(
    req: AuthenticatedRequest<{}, any, any, { query: string }>,
    res: Response
  ) {
    try {
      const { query } = req.query;

      console.log(req.query);

      if (!query) {
        return sendError(
          res,
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Search query is required",
          null,
          400
        );
      }

      logger.info(`Prompt enhancement requested for query: "${query}"`);

      // Format the prompt for Gemini
      const promptTemplate = `
    You are an expert creative industry search assistant. Help improve this initial search query to find the perfect creators. 
    
    Initial query: "${query}"
    
    Step 1: Identify what's missing from this query that would help find better matches. Consider:
    - Specific style details (e.g., "minimalist" vs just "design")
    - Technical specifications (e.g., "natural lighting portrait photography" vs just "photography")
    - Industry verticals (e.g., "luxury fashion" vs just "fashion")
    - Tone/mood (e.g., "bold, vibrant branding" vs just "branding")
    - Visual elements (e.g., "flat illustration with geometric shapes" vs just "illustration")
    - Do not suggest a creative role like: photographer, illustrator, etc... because the user already select the role they want to find beforehand

    Step 2: Generate 3 thoughtful questions that would help the user refine their search.
    
    Step 3: Suggest very brief phrases or short terms as answers to the previous questions.
    
    Format your response as a JSON object with the following structure:
      [
        {
          "question": "First question to help refine search",
          "options": ["option1", "option2", "option3"]
        },
        {
          "question": "Second question to help refine search",
          "options": ["option1", "option2", "option3"]
        },
        {
          "question": "Third question to help refine search",
          "options": ["option1", "option2", "option3"]
        }
      ]
    
    Only return valid JSON without any additional text.
    `;

      // Call Gemini API to process the prompt
      const geminiResponse =
        await this.callGeminiForPromptEnhancement(promptTemplate);

      console.log(geminiResponse);

      // Parse the response
      let parsedResponse;
      try {
        // Clean the response string to remove any markdown formatting or additional text
        const cleanResponse = geminiResponse
          .replace(/```json\s*|\s*```/g, "")
          .trim();

        // Check if response starts with [ and ends with ] to ensure it's an array
        const validJsonString =
          cleanResponse.startsWith("[") && cleanResponse.endsWith("]")
            ? cleanResponse
            : geminiResponse;

        parsedResponse = JSON.parse(validJsonString);

        // Validate the structure of the parsed response
        if (!Array.isArray(parsedResponse)) {
          throw new Error("Response is not an array");
        }
      } catch (parseError) {
        logger.error("Failed to parse Gemini response as JSON:", parseError);
        logger.error("Received response:", geminiResponse);
        return sendError(
          res,
          ErrorCode.SERVER_ERROR,
          "Failed to process prompt enhancement",
          null,
          500
        );
      }

      // Return the enhancement suggestions
      return sendSuccess(res, {
        original_query: query,
        enhancement: parsedResponse,
      });
    } catch (error) {
      logger.error("Prompt enhancement error:", error);
      return sendError(
        res,
        ErrorCode.SERVER_ERROR,
        "Failed to enhance prompt",
        error,
        500
      );
    }
  }

  // Helper method to call Gemini API
  private async callGeminiForPromptEnhancement(
    prompt: string
  ): Promise<string> {
    try {
      // Use the existing GoogleGenerativeAI setup from EmbeddingRepository
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      logger.error("Error calling Gemini API:", error);
      throw new Error("Failed to process prompt with Gemini API");
    }
  }

  /**
   * Search for creators - uses the unified search function
   */
  async searchCreators(
    req: AuthenticatedRequest<{}, any, any, SearchQueryParams>,
    res: Response
  ) {
    // For backwards compatibility - just call the main search function
    return this.searchCreativeContent(req, res);
  }

  /**
   * Search for projects - uses the unified search function
   */
  async searchProjects(
    req: AuthenticatedRequest<{}, any, any, SearchQueryParams>,
    res: Response
  ) {
    // For backwards compatibility - just call the main search function
    return this.searchCreativeContent(req, res);
  }

  /**
   * Search for media (images and videos) - uses the unified search function
   */
  async searchMedia(
    req: AuthenticatedRequest<{}, any, any, SearchQueryParams>,
    res: Response
  ) {
    // For backwards compatibility - just call the main search function
    return this.searchCreativeContent(req, res);
  }
}
