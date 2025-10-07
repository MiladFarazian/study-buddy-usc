import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    console.log("Download request from user:", user.id);

    // Check referral count
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("referral_count")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || (profile.referral_count ?? 0) < 1) {
      return new Response(
        JSON.stringify({ error: "You need at least 1 referral to download resources" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { resourceId } = await req.json();

    console.log("Downloading resource:", resourceId);

    // Get resource
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("*")
      .eq("id", resourceId)
      .single();

    if (resourceError || !resource) {
      throw new Error("Resource not found");
    }

    if (resource.status !== "approved") {
      return new Response(
        JSON.stringify({ error: "Resource is not available for download" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment download count
    await supabase
      .from("resources")
      .update({ download_count: resource.download_count + 1 })
      .eq("id", resourceId);

    console.log("Download count incremented");

    // Generate signed URL (24 hour expiry)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("approved-resources")
      .createSignedUrl(resource.file_path, 86400); // 24 hours

    if (signedUrlError) {
      console.error("Signed URL error:", signedUrlError);
      throw signedUrlError;
    }

    console.log("Signed URL generated successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        signedUrl: signedUrlData.signedUrl,
        fileName: resource.file_name 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in download-resource:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
