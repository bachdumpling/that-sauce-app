import { UploadedFile } from "express-fileupload";
import { supabase } from "../lib/supabase";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

interface UploadOptions {
  userId: string;
  projectId: string;
  creatorId: string;
}

/**
 * Upload media file to storage and create a record in the appropriate table (images or videos)
 */
export const uploadMedia = async (file: UploadedFile, options: UploadOptions) => {
  const { userId, projectId, creatorId } = options;
  
  // Generate a unique filename
  const fileExtension = path.extname(file.name);
  const fileName = `${uuidv4()}${fileExtension}`;
  const filePath = `${userId}/${fileName}`;
  
  // Determine file type
  const isImage = file.mimetype.startsWith("image/");
  const fileType = isImage ? "image" : "video";
  
  try {
    // Upload file to storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from("media")
      .upload(filePath, fs.createReadStream(file.tempFilePath), {
        contentType: file.mimetype,
        cacheControl: "3600",
      });
    
    if (storageError) {
      throw storageError;
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("media")
      .getPublicUrl(filePath);
    
    const storageUrl = publicUrlData.publicUrl;
    
    let mediaData;
    
    if (isImage) {
      // Create image record
      const { data: imageData, error: imageError } = await supabase
        .from("images")
        .insert([
          {
            project_id: projectId,
            creator_id: creatorId,
            url: storageUrl,
            alt_text: file.name,
            resolutions: {},
            order: 0 // Default order, can be updated later
          },
        ])
        .select()
        .single();
      
      if (imageError) {
        throw imageError;
      }
      
      mediaData = {
        ...imageData,
        file_type: fileType,
        mime_type: file.mimetype,
        size_bytes: file.size,
      };
    } else {
      // Create video record
      const { data: videoData, error: videoError } = await supabase
        .from("videos")
        .insert([
          {
            project_id: projectId,
            creator_id: creatorId,
            url: storageUrl,
            title: path.basename(file.name, fileExtension),
            description: ""
          },
        ])
        .select()
        .single();
      
      if (videoError) {
        throw videoError;
      }
      
      mediaData = {
        ...videoData,
        file_type: fileType,
        mime_type: file.mimetype,
        size_bytes: file.size,
      };
    }
    
    // Clean up temp file
    fs.unlinkSync(file.tempFilePath);
    
    return mediaData;
  } catch (error) {
    // Clean up temp file if it exists
    if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
      fs.unlinkSync(file.tempFilePath);
    }
    
    throw error;
  }
}; 