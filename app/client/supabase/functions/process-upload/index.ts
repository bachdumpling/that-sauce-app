import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    const { record } = payload;

    // Get creator ID from user's auth ID
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id")
      .eq("profile_id", record.user_id)
      .single();

    if (creatorError || !creator) {
      throw new Error(`Creator not found for user ${record.user_id}`);
    }

    const projectId = record.metadata?.project_id;
    if (!projectId) {
      throw new Error("No project ID found in metadata");
    }

    // Create queue entry
    const { data: queueEntry, error: queueError } = await supabase
      .from("media_queue")
      .insert({
        media_id: record.id,
        file_path: record.file_path,
        file_type: record.file_type,
        status: "processing",
        metadata: {
          mime_type: record.mime_type,
          size_bytes: record.size_bytes,
          storage_url: record.storage_url,
          project_id: projectId,
        },
      })
      .select()
      .single();

    if (queueError) throw queueError;

    let referenceId;

    if (record.file_type === "image") {
      // Create image entry
      const { data: image, error: imageError } = await supabase
        .from("images")
        .insert({
          project_id: projectId,
          creator_id: creator.id, // Use resolved creator.id
          url: record.storage_url,
          alt_text: record.metadata.original_name || "Uploaded image",
        })
        .select()
        .single();

      if (imageError) throw imageError;
      referenceId = { image_id: image.id };
    } else {
      // Create video entry with random vimeo_id and actual storage url
      const { data: video, error: videoError } = await supabase
        .from("videos")
        .insert({
          project_id: projectId,
          creator_id: creator.id, // Use resolved creator.id
          vimeo_id: null,
          url: record.storage_url,
          title: record.metadata.original_name || "Uploaded video",
          description: "Uploaded via project",
          categories: [],
        })
        .select()
        .single();

      if (videoError) throw videoError;
      referenceId = { video_id: video.id };
    }

    // Update media record with the reference
    const { error: mediaError } = await supabase
      .from("media")
      .update({
        status: "completed",
        ...referenceId,
      })
      .eq("id", record.id);

    if (mediaError) throw mediaError;

    // Update queue status to completed
    const { error: updateError } = await supabase
      .from("media_queue")
      .update({
        status: "completed",
        last_attempted_at: new Date().toISOString(),
        processing_attempts: 1,
      })
      .eq("id", queueEntry.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        message: "Processing completed",
        queue_id: queueEntry.id,
        media_url: record.storage_url,
        status: "completed",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
