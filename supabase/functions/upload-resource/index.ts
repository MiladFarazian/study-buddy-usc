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

    console.log("Upload request from user:", user.id);

    // Check referral count
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("referral_count")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || (profile.referral_count ?? 0) < 1) {
      return new Response(
        JSON.stringify({ error: "You need at least 1 referral to upload resources" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const resourceType = formData.get("resourceType") as string;
    const courseNumbers = JSON.parse(formData.get("courseNumbers") as string);

    // Validate file size (50MB limit)
    if (file.size > 52428800) {
      return new Response(
        JSON.stringify({ error: "File size exceeds 50MB limit" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Uploading file:", file.name, "Size:", file.size, "Type:", file.type);

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const uniqueId = crypto.randomUUID();
    const fileName = `${uniqueId}_${file.name}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload to pending-resources bucket
    const { error: uploadError } = await supabase.storage
      .from("pending-resources")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    console.log("File uploaded successfully to:", filePath);

    // Create resource record
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .insert({
        title,
        description,
        uploader_id: user.id,
        status: "pending",
        resource_type: resourceType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
      })
      .select()
      .single();

    if (resourceError) {
      console.error("Resource creation error:", resourceError);
      // Clean up uploaded file
      await supabase.storage.from("pending-resources").remove([filePath]);
      throw resourceError;
    }

    console.log("Resource record created:", resource.id);

    // Create resource_courses records
    const courseRecords = courseNumbers.map((courseNum: string) => ({
      resource_id: resource.id,
      course_number: courseNum,
    }));

    const { error: coursesError } = await supabase
      .from("resource_courses")
      .insert(courseRecords);

    if (coursesError) {
      console.error("Courses linking error:", coursesError);
      // Clean up resource and file
      await supabase.from("resources").delete().eq("id", resource.id);
      await supabase.storage.from("pending-resources").remove([filePath]);
      throw coursesError;
    }

    console.log("Resource courses linked successfully");

    // Create notification for admins
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const adminNotifications = admins.map((admin) => ({
        user_id: admin.user_id,
        title: "New Resource Pending Review",
        message: `${profile.first_name || "A student"} uploaded "${title}" for review`,
        type: "admin_action",
        metadata: { resource_id: resource.id },
      }));

      await supabase.from("notifications").insert(adminNotifications);
      console.log("Admin notifications created");
    }

    return new Response(
      JSON.stringify({ success: true, resource }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in upload-resource:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
