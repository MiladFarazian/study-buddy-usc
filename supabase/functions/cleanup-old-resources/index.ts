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

    console.log("Starting resource cleanup job");

    let cleanupSummary = {
      rejectedFilesDeleted: 0,
      oldUnusedFilesDeleted: 0,
      errors: [] as string[],
    };

    // Clean up rejected resources older than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: rejectedResources, error: rejectedError } = await supabase
      .from("resources")
      .select("id, file_path")
      .eq("status", "rejected")
      .lt("reviewed_at", twentyFourHoursAgo);

    if (rejectedError) {
      console.error("Error fetching rejected resources:", rejectedError);
      cleanupSummary.errors.push(`Rejected fetch error: ${rejectedError.message}`);
    } else if (rejectedResources && rejectedResources.length > 0) {
      console.log(`Found ${rejectedResources.length} rejected resources to clean up`);

      for (const resource of rejectedResources) {
        try {
          // Delete file from storage
          const { error: deleteError } = await supabase.storage
            .from("pending-resources")
            .remove([resource.file_path]);

          if (deleteError) {
            console.error(`Error deleting file ${resource.file_path}:`, deleteError);
            cleanupSummary.errors.push(`Delete error for ${resource.id}: ${deleteError.message}`);
          }

          // Update status to deleted
          await supabase
            .from("resources")
            .update({ status: "deleted" })
            .eq("id", resource.id);

          cleanupSummary.rejectedFilesDeleted++;
        } catch (error) {
          console.error(`Error processing resource ${resource.id}:`, error);
          cleanupSummary.errors.push(`Process error for ${resource.id}: ${error.message}`);
        }
      }

      console.log(`Cleaned up ${cleanupSummary.rejectedFilesDeleted} rejected resources`);
    }

    // Clean up old unused approved resources (older than 6 months with 0 downloads)
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: oldResources, error: oldError } = await supabase
      .from("resources")
      .select("id, file_path")
      .eq("status", "approved")
      .eq("download_count", 0)
      .lt("uploaded_at", sixMonthsAgo);

    if (oldError) {
      console.error("Error fetching old resources:", oldError);
      cleanupSummary.errors.push(`Old resources fetch error: ${oldError.message}`);
    } else if (oldResources && oldResources.length > 0) {
      console.log(`Found ${oldResources.length} old unused resources to clean up`);

      for (const resource of oldResources) {
        try {
          // Delete file from storage
          const { error: deleteError } = await supabase.storage
            .from("approved-resources")
            .remove([resource.file_path]);

          if (deleteError) {
            console.error(`Error deleting file ${resource.file_path}:`, deleteError);
            cleanupSummary.errors.push(`Delete error for ${resource.id}: ${deleteError.message}`);
          }

          // Delete resource record
          await supabase
            .from("resources")
            .delete()
            .eq("id", resource.id);

          cleanupSummary.oldUnusedFilesDeleted++;
        } catch (error) {
          console.error(`Error processing resource ${resource.id}:`, error);
          cleanupSummary.errors.push(`Process error for ${resource.id}: ${error.message}`);
        }
      }

      console.log(`Cleaned up ${cleanupSummary.oldUnusedFilesDeleted} old unused resources`);
    }

    console.log("Cleanup job completed:", cleanupSummary);

    // Notify admins of cleanup results
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const message = `Resource cleanup completed: ${cleanupSummary.rejectedFilesDeleted} rejected files deleted, ${cleanupSummary.oldUnusedFilesDeleted} old unused files deleted${cleanupSummary.errors.length > 0 ? `, ${cleanupSummary.errors.length} errors` : ''}`;

      const adminNotifications = admins.map((admin) => ({
        user_id: admin.user_id,
        title: "Resource Cleanup Complete",
        message,
        type: "system",
        metadata: cleanupSummary,
      }));

      await supabase.from("notifications").insert(adminNotifications);
    }

    return new Response(
      JSON.stringify({ success: true, summary: cleanupSummary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in cleanup-old-resources:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
