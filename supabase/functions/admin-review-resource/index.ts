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

    console.log("Review request from user:", user.id);

    // Check if user is admin
    const { data: roleCheck } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleCheck) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { resourceId, action, rejectionReason } = await req.json();

    console.log("Reviewing resource:", resourceId, "Action:", action);

    // Get resource
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("*")
      .eq("id", resourceId)
      .single();

    if (resourceError || !resource) {
      throw new Error("Resource not found");
    }

    if (resource.status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Resource is not pending review" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "approve") {
      console.log("Approving resource:", resourceId);

      // Get course numbers for organizing file path
      const { data: courses } = await supabase
        .from("resource_courses")
        .select("course_number")
        .eq("resource_id", resourceId)
        .limit(1);

      const courseNumber = courses?.[0]?.course_number || "uncategorized";
      
      // Move file from pending to approved bucket
      const newFilePath = `${courseNumber}/${resource.resource_type}/${resource.file_name}`;

      // Download from pending bucket
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("pending-resources")
        .download(resource.file_path);

      if (downloadError) {
        console.error("Download error:", downloadError);
        throw downloadError;
      }

      console.log("File downloaded from pending bucket");

      // Upload to approved bucket
      const { error: uploadError } = await supabase.storage
        .from("approved-resources")
        .upload(newFilePath, fileData, {
          contentType: resource.file_type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      console.log("File uploaded to approved bucket:", newFilePath);

      // Delete from pending bucket
      await supabase.storage
        .from("pending-resources")
        .remove([resource.file_path]);

      console.log("File removed from pending bucket");

      // Update resource record
      const { error: updateError } = await supabase
        .from("resources")
        .update({
          status: "approved",
          file_path: newFilePath,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", resourceId);

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }

      // Notify uploader
      const { data: uploaderProfile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", resource.uploader_id)
        .single();

      await supabase.from("notifications").insert({
        user_id: resource.uploader_id,
        title: "Resource Approved!",
        message: `Your resource "${resource.title}" has been approved and is now available to students`,
        type: "resource_approved",
        metadata: { resource_id: resourceId },
      });

      console.log("Resource approved successfully");

    } else if (action === "reject") {
      console.log("Rejecting resource:", resourceId, "Reason:", rejectionReason);

      // Update resource record
      const { error: updateError } = await supabase
        .from("resources")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", resourceId);

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }

      // Schedule file deletion (will be handled by cleanup function)
      // For now, just notify uploader
      await supabase.from("notifications").insert({
        user_id: resource.uploader_id,
        title: "Resource Not Approved",
        message: `Your resource "${resource.title}" was not approved. ${rejectionReason || "Please try again with a different file."}`,
        type: "resource_rejected",
        metadata: { resource_id: resourceId, reason: rejectionReason },
      });

      console.log("Resource rejected successfully");
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in admin-review-resource:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
