// supabase/functions/analyze-media/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");
const apiUrl = Deno.env.get("API_URL");

if (!apiUrl) {
  throw new Error("API_URL is not defined in environment variables");
}

// Warn if API_URL is set to localhost (it should be publicly accessible)
if (apiUrl.includes("localhost")) {
  console.warn(
    "API_URL is set to localhost. Make sure your Express server is publicly accessible from the Edge function."
  );
}

async function analyzeMedia(
  url: string,
  fileType: string,
  mimeType: string
): Promise<{ analysis: string; embedding: number[] | null } | null> {
  console.log("\nCalling Express API for media analysis...");
  console.log("URL:", url);
  console.log("File type:", fileType);

  // Call the Express server API for analysis
  const response = await fetch(`${apiUrl}/api/media/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      storage_url: url,
      file_type: fileType,
      mime_type: mimeType,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Media analysis API error: ${errorText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error("Media analysis failed on the Express server");
  }
  return data.result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Starting request processing");

    const supabase = createClient(
      supabaseUrl ?? "",
      supabaseServiceRoleKey ?? ""
    );
    const body = await req.json();
    console.log("Request body received", {
      hasRecord: !!body.record,
      fileType: body.record?.file_type,
      hasUrl: !!body.record?.storage_url,
    });

    const { record } = body;
    if (!record) {
      throw new Error("No record provided in request body");
    }

    // Determine the media table based on file type
    const mediaType = record.file_type;
    const mediaTable = mediaType === "image" ? "images" : "videos";
    console.log("Processing", mediaType, "from table:", mediaTable);

    // Call the Express API for media analysis
    const result = await analyzeMedia(
      record.storage_url,
      record.file_type,
      record.mime_type
    );
    if (!result) {
      throw new Error("Media analysis returned null result");
    }

    // Update the media record in Supabase
    const { error: updateError } = await supabase
      .from(mediaTable)
      .update({
        ai_analysis: result.analysis,
        embedding: result.embedding,
      })
      .eq("id", mediaType === "image" ? record.image_id : record.video_id);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw updateError;
    }

    console.log("Successfully updated database");

    return new Response(
      JSON.stringify({
        message: "Analysis completed",
        status: "completed",
        analysis: result.analysis,
        embedding: result.embedding?.slice(0, 10),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error in main handler:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
