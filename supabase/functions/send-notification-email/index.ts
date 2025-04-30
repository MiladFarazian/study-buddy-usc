
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  notificationType: 'session_reminder' | 'new_message' | 'resource_update' | 'platform_update';
  data?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Notification request received");
    const payload = await req.json();
    console.log("Request payload:", JSON.stringify(payload, null, 2));
    
    const { recipientEmail, recipientName, subject, notificationType, data } = payload as NotificationRequest;
    
    if (!recipientEmail || !notificationType) {
      throw new Error("Missing required parameters: recipientEmail and notificationType");
    }

    // Generate email content based on notification type
    let htmlContent: string;
    
    switch (notificationType) {
      case 'session_reminder':
        const { sessionDate, tutorName, courseName, location } = data || {};
        console.log("Processing session reminder notification with data:", { sessionDate, tutorName, courseName, location });
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="background-color: #990000; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
              <h1 style="margin: 0;">Session Reminder</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
              <p>Hello ${recipientName},</p>
              <p>This is a friendly reminder about your upcoming tutoring session:</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Date:</strong> ${sessionDate || 'Not specified'}</p>
                <p><strong>Tutor:</strong> ${tutorName || 'Not specified'}</p>
                ${courseName ? `<p><strong>Course:</strong> ${courseName}</p>` : ''}
                ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
              </div>
              
              <p>Please be prepared and arrive on time for your session.</p>
              
              <p>Thank you for using USC Study Buddy!</p>
            </div>
            <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
              <p>&copy; 2025 USC Study Buddy. All rights reserved.</p>
            </div>
          </div>
        `;
        break;
      
      case 'new_message':
        const { senderName, messagePreview } = data || {};
        console.log("Processing new message notification with data:", { senderName, messagePreview });
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="background-color: #990000; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
              <h1 style="margin: 0;">New Message</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
              <p>Hello ${recipientName},</p>
              <p>You have received a new message from ${senderName || 'another user'}:</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p>${messagePreview || 'Click to view the message'}</p>
              </div>
              
              <p>Log in to your account to respond and see the full conversation.</p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="https://studybuddyusc.com/messages" style="background-color: #990000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Messages</a>
              </div>
              
              <p>Thank you for using USC Study Buddy!</p>
            </div>
            <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
              <p>&copy; 2025 USC Study Buddy. All rights reserved.</p>
            </div>
          </div>
        `;
        break;
      
      case 'resource_update':
        const { courseId, courseNumber, resourceName } = data || {};
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="background-color: #990000; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
              <h1 style="margin: 0;">Course Resource Update</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
              <p>Hello ${recipientName},</p>
              <p>A new resource has been added to your course:</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Course:</strong> ${courseNumber || 'Your course'}</p>
                <p><strong>Resource:</strong> ${resourceName || 'New study material'}</p>
              </div>
              
              <p>Log in to your account to view the new resource.</p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="${courseId ? `https://studybuddyusc.com/courses/${courseId}` : 'https://studybuddyusc.com/courses'}" style="background-color: #990000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Resource</a>
              </div>
              
              <p>Thank you for using USC Study Buddy!</p>
            </div>
            <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
              <p>&copy; 2025 USC Study Buddy. All rights reserved.</p>
            </div>
          </div>
        `;
        break;
      
      case 'platform_update':
        const { updateTitle, updateDetails } = data || {};
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="background-color: #990000; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
              <h1 style="margin: 0;">Platform Update</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
              <p>Hello ${recipientName},</p>
              <p>We have an important update about USC Study Buddy:</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h2 style="margin-top: 0; color: #990000;">${updateTitle || 'New Features Available!'}</h2>
                <p>${updateDetails || 'We\'ve made improvements to the platform to enhance your experience. Log in to see what\'s new!'}</p>
              </div>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="https://studybuddyusc.com" style="background-color: #990000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Visit Study Buddy</a>
              </div>
              
              <p>Thank you for being part of our community!</p>
            </div>
            <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
              <p>&copy; 2025 USC Study Buddy. All rights reserved.</p>
            </div>
          </div>
        `;
        break;
      
      default:
        console.log("Using default notification template");
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="background-color: #990000; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
              <h1 style="margin: 0;">${subject || 'Notification'}</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
              <p>Hello ${recipientName},</p>
              <p>You have a new notification from USC Study Buddy.</p>
              <p>Please log in to your account to see more details.</p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="https://studybuddyusc.com" style="background-color: #990000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Visit Study Buddy</a>
              </div>
              
              <p>Thank you for using USC Study Buddy!</p>
            </div>
            <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
              <p>&copy; 2025 USC Study Buddy. All rights reserved.</p>
            </div>
          </div>
        `;
    }

    console.log("Sending email to:", recipientEmail);
    
    // Send email through Resend
    const emailResponse = await resend.emails.send({
      from: "USC Study Buddy <notifications@studybuddyusc.com>",
      to: [recipientEmail],
      subject: subject || `Study Buddy: ${notificationType.replace('_', ' ')}`,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      id: emailResponse.id 
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
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
