// src/controllers/mediaAnalysisController.ts
import { Request, Response } from "express";
import { analyzeMedia } from "../services/mediaAnalysisService";
import logger from "../config/logger";
import supabase from "../lib/supabase";

export const analyzeMediaController = async (req: Request, res: Response) => {
  try {
    const { storage_url, file_type, mime_type, record } = req.body;

    logger.info({
      msg: "Starting media analysis request",
      file_type,
      mime_type,
    });

    // Validate required fields
    if (!storage_url || !file_type || !mime_type) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "storage_url, file_type, and mime_type are required",
      });
    }

    // Analyze media and get result
    const result = await analyzeMedia(storage_url, file_type, mime_type);

    if (!result) {
      return res.status(500).json({
        error: "Analysis failed",
        details: "Media analysis returned null result",
      });
    }

    // If record update is requested
    if (record) {
      const mediaTable = file_type === "image" ? "images" : "videos";
      const mediaId = file_type === "image" ? record.image_id : record.video_id;

      const { error: updateError } = await supabase
        .from(mediaTable)
        .update({
          ai_analysis: result.analysis,
          embedding: result.embedding,
        })
        .eq("id", mediaId);

      if (updateError) {
        logger.error("Database update error:", updateError);
        return res.status(500).json({
          error: "Database update failed",
          details: updateError.message,
        });
      }

      logger.info("Successfully updated database record");
    }

    logger.info("Media analysis completed successfully");

    return res.status(200).json({
      success: true,
      result,
      message: "Analysis completed",
    });
  } catch (error) {
    logger.error("Error in media analysis controller:", error);
    return res.status(500).json({
      error: "Media analysis failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
