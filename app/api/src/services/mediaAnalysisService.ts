// src/services/mediaAnalysisService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import axios from "axios";
import fs from "fs/promises";
import path from "path";
import os from "os";
import logger from "../config/logger";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define a union type for the embedding input.
export type TextInput = string | { description: string };

async function fetchAndSaveFile(
  url: string,
  fileType: string
): Promise<string> {
  logger.info("Downloading file from URL:", url);

  const response = await axios({
    method: "GET",
    url: url,
    responseType: "arraybuffer",
  });

  // Create temporary directory and file
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "media-analysis-"));
  const tmpFilePath = path.join(tmpDir, `temp_${Date.now()}.${fileType}`);

  await fs.writeFile(tmpFilePath, response.data);

  // Verify file
  const stats = await fs.stat(tmpFilePath);
  logger.info(
    `File downloaded. Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`
  );

  if (stats.size === 0) {
    throw new Error("Downloaded file is empty");
  }

  return tmpFilePath;
}

async function generateEmbedding(text: TextInput): Promise<number[] | null> {
  try {
    logger.info("Starting embedding generation");
    // Use the union type to safely extract description when needed.
    const inputText = typeof text === "object" ? text.description : text;

    const model = genAI.getGenerativeModel({
      model: "models/text-embedding-004",
    });
    const result = await model.embedContent(inputText);

    if (!result?.embedding?.values) {
      throw new Error("No embedding values in response");
    }

    const embedding = Array.from(result.embedding.values);
    logger.info("Embedding generated successfully");
    return embedding;
  } catch (error) {
    logger.error("Embedding generation failed:", error);
    return null;
  }
}

async function analyzeImage(url: string, mimeType: string) {
  let tmpFilePath: string | null = null;

  try {
    logger.info("Starting image analysis");
    tmpFilePath = await fetchAndSaveFile(url, "jpg");

    // Read the file and convert to base64
    const imageBuffer = await fs.readFile(tmpFilePath);
    const base64Data = imageBuffer.toString("base64");

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      },
    });

    const prompt = `Analyze this image using the following JSON schema:
{
  "description": As a professional creative curator, provide a detailed analysis of this image focusing on:

        1. Technical Aspects:
           - Composition and framing
           - Lighting techniques used
           - Color palette and treatment
           - Technical quality and execution

        2. Creative Elements:
           - Main subject and focal points
           - Style and artistic approach
           - Mood and atmosphere
           - Visual storytelling elements

        3. Professional Context:
           - Apparent purpose or commercial application
           - Target audience or market segment
           - Production value indicators
           - Industry-specific elements

        Keep the description objective, detailed, and focused on visually present elements.
        Use professional terminology while remaining clear and precise.
        Avoid assumptions about intent and focus on observable qualities.
        Format as a continuous paragraph without headers or sections.
}
Return: JSON response only`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ]);

    const responseText = await result.response.text();
    const cleanedText = responseText
      .replace(/```json\n/g, "")
      .replace(/```\n/g, "")
      .replace(/\n```/g, "")
      .trim();

    const analysisObj = JSON.parse(cleanedText);
    const analysis = analysisObj.description;
    const embedding = await generateEmbedding(analysis);

    if (!embedding) {
      throw new Error("Failed to generate embedding for image analysis");
    }

    return { analysis, embedding };
  } catch (error) {
    logger.error("Image analysis failed:", error);
    throw error;
  } finally {
    if (tmpFilePath) {
      try {
        await fs.unlink(tmpFilePath);
        logger.info("Temporary image file cleaned up");
      } catch (cleanupError) {
        logger.error("Error cleaning up temporary image file:", cleanupError);
      }
    }
  }
}

async function analyzeVideo(url: string, mimeType: string) {
  let tmpFilePath: string | null = null;

  try {
    logger.info("Starting video analysis");
    tmpFilePath = await fetchAndSaveFile(url, "mp4");

    logger.info("Initializing file manager");
    const fileManager = new GoogleAIFileManager(
      process.env.GEMINI_API_KEY || ""
    );

    // Upload with retries
    let uploadResponse: any | undefined;
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        logger.info(`Upload attempt ${i + 1}/${maxRetries}`);
        uploadResponse = await fileManager.uploadFile(tmpFilePath, {
          mimeType,
          displayName: "Video Analysis",
        });
        break;
      } catch (error) {
        logger.error(`Upload attempt ${i + 1} failed:`, error);
        if (i === maxRetries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    if (!uploadResponse) {
      throw new Error("Failed to upload video after maximum retries");
    }

    logger.info("Video uploaded successfully");

    // Poll for processing completion
    let file = await fileManager.getFile(uploadResponse.file.name);
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes with 10s intervals

    while (file.state === FileState.PROCESSING && attempts < maxAttempts) {
      logger.info("Video processing state:", file.state);
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 10000));
      file = await fileManager.getFile(uploadResponse.file.name);
    }

    if (file.state === FileState.FAILED || attempts >= maxAttempts) {
      throw new Error(
        `Video processing failed or timed out. State: ${file.state}`
      );
    }

    logger.info("Video processing completed");

    // Analyze video
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analyze this video using the following JSON schema:
    
VideoAnalysis = {
  "description": string  // Detailed analysis of the video including visual style, technical quality, storytelling, production value, and creative techniques
}

Return: VideoAnalysis`;

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: file.mimeType,
          fileUri: file.uri,
        },
      },
      { text: prompt },
    ]);

    const responseText = await result.response.text();

    // Clean and sanitize the response text
    const cleanedText = responseText
      .replace(/```json\n?/g, "") // Remove JSON code blocks
      .replace(/```\n?/g, "") // Remove any remaining code blocks
      .replace(/[\x00-\x1F\x7F-\x9F]/g, "") // Remove all control characters
      .trim();

    logger.info("Cleaned response text:", cleanedText);

    try {
      const analysisObj = JSON.parse(cleanedText);
      const analysis = analysisObj.description;

      if (!analysis || typeof analysis !== "string") {
        throw new Error("Invalid analysis format from Gemini API");
      }

      // Clean the analysis text as well
      const cleanedAnalysis = analysis
        .replace(/[\x00-\x1F\x7F-\x9F]/g, "") // Remove control characters
        .replace(/\n+/g, " ") // Replace multiple newlines with space
        .trim();

      const embedding = await generateEmbedding(cleanedAnalysis);

      if (!embedding) {
        throw new Error("Failed to generate embedding for video analysis");
      }

      return { analysis: cleanedAnalysis, embedding };
    } catch (error: any) {
      logger.error("Failed to parse Gemini API response:", {
        error,
        responseText: cleanedText,
      });
      throw new Error(
        `Failed to parse Gemini API response: ${error?.message || "Unknown error"}`
      );
    }
  } catch (error) {
    logger.error("Video analysis failed:", error);
    throw error;
  } finally {
    // Cleanup
    if (tmpFilePath) {
      try {
        await fs.unlink(tmpFilePath);
        logger.info("Temporary video file cleaned up");
      } catch (error) {
        logger.error("Error cleaning up temporary video file:", error);
      }
    }
  }
}

export async function analyzeMedia(
  url: string,
  fileType: string,
  mimeType: string
) {
  logger.info({
    msg: "Starting media analysis",
    fileType,
    mimeType,
    url,
  });

  if (fileType === "video") {
    return await analyzeVideo(url, mimeType);
  } else if (fileType === "image") {
    return await analyzeImage(url, mimeType);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
}
