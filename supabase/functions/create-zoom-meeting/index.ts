
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZoomMeetingRequest {
  tutor_id: string;
  student_name: string;
  course_name: string;
  start_time: string;
  end_time: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const zoomApiKey = Deno.env.get("ZOOM_API_KEY");
    const zoomApiSecret = Deno.env.get("ZOOM_API_SECRET");
    const zoomAccountId = Deno.env.get("ZOOM_ACCOUNT_ID");
    
    if (!zoomApiKey || !zoomApiSecret || !zoomAccountId) {
      console.error("Missing Zoom API configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Parse the request
    const { tutor_id, student_name, course_name, start_time, end_time } = await req.json() as ZoomMeetingRequest;
    
    if (!tutor_id || !start_time || !end_time) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Generate server-to-server OAuth token
    console.log("Generating Zoom OAuth token");
    const tokenResponse = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${zoomAccountId}`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${zoomApiKey}:${zoomApiSecret}`)}`,
        "Content-Type": "application/json"
      }
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Failed to generate Zoom token", tokenData);
      return new Response(
        JSON.stringify({ error: "Failed to authenticate with Zoom" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Format time for Zoom (expects ISO format)
    const startDateTime = new Date(start_time).toISOString();
    
    // Calculate duration in minutes
    const duration = Math.round(
      (new Date(end_time).getTime() - new Date(start_time).getTime()) / (1000 * 60)
    );
    
    // Create the meeting
    const meetingPayload = {
      topic: `USC Tutoring - ${course_name}`,
      type: 2, // Scheduled meeting
      start_time: startDateTime,
      duration: duration,
      timezone: "America/Los_Angeles",
      agenda: `Tutoring session with ${student_name} for ${course_name}`,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
        audio: "both",
        auto_recording: "none"
      }
    };
    
    // Call Zoom API to create meeting
    console.log("Creating Zoom meeting");
    const meetingResponse = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(meetingPayload)
    });
    
    const meetingData = await meetingResponse.json();
    
    if (!meetingResponse.ok) {
      console.error("Failed to create Zoom meeting", meetingData);
      return new Response(
        JSON.stringify({ error: "Failed to create Zoom meeting", details: meetingData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Return successful response with meeting details
    return new Response(
      JSON.stringify({
        id: meetingData.id,
        join_url: meetingData.join_url,
        host_url: meetingData.start_url,
        password: meetingData.password,
        topic: meetingData.topic
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    const err = error as any;
    console.error("Error in create-zoom-meeting:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
