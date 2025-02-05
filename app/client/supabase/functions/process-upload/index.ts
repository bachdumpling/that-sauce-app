import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get webhook payload
    const payload = await req.json();
    const { record } = payload;

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
        },
      })
      .select()
      .single();

    if (queueError) throw queueError;

    // For testing: Create appropriate entry based on file type
    let referenceId;
    if (record.file_type === "image") {
      // Create image entry
      const { data: image, error: imageError } = await supabase
        .from("images")
        .insert({
          project_id: "00000000-0000-0000-0000-000000000000", // Placeholder project ID
          creator_id: record.user_id,
          url: record.storage_url,
          alt_text: "Test image",
        })
        .select()
        .single();

      if (imageError) throw imageError;
      referenceId = { image_id: image.id };
    } else {
      // Create video entry
      const { data: video, error: videoError } = await supabase
        .from("videos")
        .insert({
          project_id: "00000000-0000-0000-0000-000000000000", // Placeholder project ID
          creator_id: record.user_id,
          vimeo_id: "test_" + Date.now(), // Placeholder vimeo ID
          title: "Test video",
          description: "Test upload",
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
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
