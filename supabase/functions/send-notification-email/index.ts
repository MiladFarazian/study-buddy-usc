
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Initialize Supabase client with service role for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  notificationType: 'session_reminder' | 'new_message' | 'resource_update' | 'platform_update' | 'session_booked';
  data?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const {
      recipientEmail,
      recipientName,
      subject,
      notificationType,
      data
    }: NotificationEmailRequest = await req.json();
    
    if (!recipientEmail) {
      throw new Error('Recipient email is required');
    }
    
    // Generate HTML content based on notification type
    let htmlContent;
    
    switch (notificationType) {
      case 'session_booked':
        if (!data?.bookingInfo) {
          throw new Error('Booking information is required for session_booked notifications');
        }
        htmlContent = generateSessionBookedEmail({
          recipientName,
          studentName: data.bookingInfo.studentName,
          date: data.bookingInfo.date,
          startTime: data.bookingInfo.startTime,
          endTime: data.bookingInfo.endTime,
          courseName: data.bookingInfo.courseName,
          location: data.bookingInfo.location || 'Not specified'
        });
        break;
        
      case 'session_reminder':
        htmlContent = generateSessionReminderEmail({
          recipientName,
          sessionDate: data?.sessionDate || '',
          tutorName: data?.tutorName || '',
          startTime: data?.startTime || '',
          endTime: data?.endTime || '',
          courseName: data?.courseName || 'General tutoring',
          location: data?.location || 'Not specified'
        });
        break;
      
      case 'new_message':
        htmlContent = generateNewMessageEmail({
          recipientName,
          senderName: data?.senderName || 'Someone',
          messagePreview: data?.messagePreview || '(No preview available)'
        });
        break;
      
      case 'resource_update':
        htmlContent = generateResourceUpdateEmail({
          recipientName,
          resourceName: data?.resourceName || 'A course resource',
          courseName: data?.courseName || 'your course'
        });
        break;
      
      case 'platform_update':
        htmlContent = generatePlatformUpdateEmail({
          recipientName,
          updateTitle: data?.updateTitle || 'Platform Update',
          updateDetails: data?.updateDetails || 'There have been updates to the Study Buddy platform.'
        });
        break;
      
      default:
        throw new Error(`Unsupported notification type: ${notificationType}`);
    }

    // Send the email
    const emailResult = await resend.emails.send({
      from: "USC Study Buddy <notifications@studybuddyusc.com>",
      to: [recipientEmail],
      subject,
      html: htmlContent
    });

    console.log("Email sent:", emailResult);

    return new Response(JSON.stringify({ 
      success: true,
      id: emailResult.id
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error sending notification email:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "An unknown error occurred" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

// Email template generators
function generateSessionBookedEmail({
  recipientName,
  studentName,
  date,
  startTime,
  endTime,
  courseName,
  location
}: {
  recipientName: string,
  studentName: string,
  date: string,
  startTime: string,
  endTime: string,
  courseName: string,
  location: string
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background-color: #990000; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">New Tutoring Session Booked</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
        <p>Hello ${recipientName},</p>
        <p>${studentName} has booked a tutoring session with you.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Student:</strong> ${studentName}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${startTime} to ${endTime}</p>
          <p><strong>Course:</strong> ${courseName}</p>
          <p><strong>Location:</strong> ${location}</p>
        </div>
        
        <p>Please be prepared for your session. Log in to view more details or make changes if needed.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://studybuddyusc.com/schedule" style="background-color: #990000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Your Schedule
          </a>
        </div>
        
        <p>Thank you for being a tutor with USC Study Buddy!</p>
      </div>
      <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
        <p>&copy; 2025 USC Study Buddy. All rights reserved.</p>
      </div>
    </div>
  `;
}

function generateSessionReminderEmail({
  recipientName,
  sessionDate,
  tutorName,
  startTime,
  endTime,
  courseName,
  location
}: {
  recipientName: string,
  sessionDate: string,
  tutorName: string,
  startTime: string,
  endTime: string,
  courseName: string,
  location: string
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background-color: #990000; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">Session Reminder</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
        <p>Hello ${recipientName},</p>
        <p>This is a reminder of your upcoming tutoring session:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Tutor:</strong> ${tutorName}</p>
          <p><strong>Date:</strong> ${sessionDate}</p>
          <p><strong>Time:</strong> ${startTime} to ${endTime}</p>
          <p><strong>Course:</strong> ${courseName}</p>
          <p><strong>Location:</strong> ${location}</p>
        </div>
        
        <p>Please arrive on time and be prepared for your session.</p>
        
        <p>Thank you for using USC Study Buddy!</p>
      </div>
      <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
        <p>&copy; 2025 USC Study Buddy. All rights reserved.</p>
      </div>
    </div>
  `;
}

function generateNewMessageEmail({
  recipientName,
  senderName,
  messagePreview
}: {
  recipientName: string,
  senderName: string,
  messagePreview: string
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background-color: #990000; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">New Message</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
        <p>Hello ${recipientName},</p>
        <p>You have received a new message from ${senderName}:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; font-style: italic;">
          "${messagePreview.substring(0, 150)}${messagePreview.length > 150 ? '...' : ''}"
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://studybuddyusc.com/messages" style="background-color: #990000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Message
          </a>
        </div>
        
        <p>Thank you for using USC Study Buddy!</p>
      </div>
      <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
        <p>&copy; 2025 USC Study Buddy. All rights reserved.</p>
      </div>
    </div>
  `;
}

function generateResourceUpdateEmail({
  recipientName,
  resourceName,
  courseName
}: {
  recipientName: string,
  resourceName: string,
  courseName: string
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background-color: #990000; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">Resource Update</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
        <p>Hello ${recipientName},</p>
        <p>A new resource has been added to ${courseName}:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>${resourceName}</strong> is now available.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://studybuddyusc.com/resources" style="background-color: #990000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Resources
          </a>
        </div>
        
        <p>Thank you for using USC Study Buddy!</p>
      </div>
      <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
        <p>&copy; 2025 USC Study Buddy. All rights reserved.</p>
      </div>
    </div>
  `;
}

function generatePlatformUpdateEmail({
  recipientName,
  updateTitle,
  updateDetails
}: {
  recipientName: string,
  updateTitle: string,
  updateDetails: string
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background-color: #990000; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">Platform Update</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
        <p>Hello ${recipientName},</p>
        <p>We have some updates about the Study Buddy platform:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h2 style="margin-top: 0;">${updateTitle}</h2>
          <p>${updateDetails}</p>
        </div>
        
        <p>Thank you for using USC Study Buddy!</p>
      </div>
      <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
        <p>&copy; 2025 USC Study Buddy. All rights reserved.</p>
      </div>
    </div>
  `;
}
