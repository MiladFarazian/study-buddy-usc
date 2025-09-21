
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Initialize Supabase client with service role for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configurable sender and reply-to via Supabase secrets (with safe fallbacks)
const FROM_ADDRESS = Deno.env.get("RESEND_FROM") || "USC Study Buddy <notifications@studybuddyusc.com>";
const REPLY_TO = Deno.env.get("RESEND_REPLY_TO") || undefined;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  recipientEmail?: string;
  recipientUserId?: string;
  recipientName: string;
  subject: string;
  notificationType: 'session_reminder' | 'new_message' | 'resource_update' | 'platform_update' | 'session_booked' | 'session_cancellation' | 'session_reschedule' | 'admin_warning' | 'admin_suspension';
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
      recipientUserId,
      recipientName,
      subject,
      notificationType,
      data
    }: NotificationEmailRequest = await req.json();

    let toEmail = recipientEmail?.trim() || '';
    if (!toEmail && recipientUserId) {
      console.log('[send-notification-email] Resolving recipient email by userId:', recipientUserId);
      const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(recipientUserId);
      if (userErr) {
        console.error('[send-notification-email] Failed to fetch user by id:', userErr);
        throw new Error('Unable to resolve recipient email');
      }
      toEmail = userData?.user?.email || '';
    }

    if (!toEmail) {
      throw new Error('Recipient email is required');
    }

    console.log('[send-notification-email] Sending email', { notificationType, toEmail, via: recipientEmail ? 'email' : 'userId' });
    
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
          location: data.bookingInfo.location || 'Not specified',
          sessionType: data.bookingInfo.sessionType || 'in_person',
          zoomJoinUrl: data.bookingInfo.zoomJoinUrl || '',
          zoomMeetingId: data.bookingInfo.zoomMeetingId || '',
          zoomPassword: data.bookingInfo.zoomPassword || ''
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
          location: data?.location || 'Not specified',
          sessionType: data?.sessionType || 'in_person',
          zoomJoinUrl: data?.zoomJoinUrl || '',
          zoomMeetingId: data?.zoomMeetingId || '',
          zoomPassword: data?.zoomPassword || ''
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
      
      case 'session_cancellation':
        htmlContent = generateSessionCancellationEmail({
          recipientName,
          sessionDate: data?.sessionDate || '',
          startTime: data?.startTime || '',
          endTime: data?.endTime || '',
          courseName: data?.courseName || 'General tutoring',
          location: data?.location || 'Not specified',
          counterpartName: data?.counterpartName || '',
          sessionType: data?.sessionType || 'in_person'
        });
        break;
      
      case 'session_reschedule':
        htmlContent = generateSessionRescheduleEmail({
          recipientName,
          oldDate: data?.oldDate || '',
          oldStartTime: data?.oldStartTime || '',
          oldEndTime: data?.oldEndTime || '',
          newDate: data?.newDate || '',
          newStartTime: data?.newStartTime || '',
          newEndTime: data?.newEndTime || '',
          courseName: data?.courseName || 'General tutoring',
          location: data?.location || 'Not specified',
          sessionType: data?.sessionType || 'in_person',
          zoomJoinUrl: data?.zoomJoinUrl || '',
          zoomMeetingId: data?.zoomMeetingId || '',
          zoomPassword: data?.zoomPassword || ''
        });
        break;
      
      case 'admin_warning':
        htmlContent = generateAdminWarningEmail({
          recipientName,
          reason: data?.reason || 'No-show report'
        });
        break;
      
      case 'admin_suspension':
        htmlContent = generateAdminSuspensionEmail({
          recipientName,
          reason: data?.reason || 'Multiple no-show reports'
        });
        break;
      
      default:
        throw new Error(`Unsupported notification type: ${notificationType}`);
    }

    // Send the email using configured from address with fallback
    const primaryFrom = FROM_ADDRESS;
    console.log("[send-notification-email] Attempting send", { toEmail, from: primaryFrom, notificationType });

    const { data: sendData, error: sendError } = await resend.emails.send({
      from: primaryFrom,
      to: [toEmail],
      subject,
      html: htmlContent,
      reply_to: REPLY_TO,
    });

    if (sendError) {
      const msg = (sendError as any)?.error || (sendError as any)?.message || String(sendError);
      console.error("[send-notification-email] Primary send failed", { from: primaryFrom, error: sendError });

      // If domain not verified or validation error, retry with Resend dev domain
      if (String(msg).toLowerCase().includes("domain is not verified") || (sendError as any)?.name === "validation_error") {
        const fallbackFrom = "Lovable Preview <onboarding@resend.dev>";
        console.log("[send-notification-email] Retrying with fallback from address", { fallbackFrom });
        const retry = await resend.emails.send({
          from: fallbackFrom,
          to: [toEmail],
          subject,
          html: htmlContent,
          reply_to: REPLY_TO,
        });
        if (retry.error) {
          console.error("[send-notification-email] Fallback send failed", { from: fallbackFrom, error: retry.error });
          throw new Error(retry.error.error || retry.error.message || "Email send failed");
        }
        console.log("[send-notification-email] Email sent with fallback domain", { id: retry.data?.id, from: fallbackFrom });
        return new Response(JSON.stringify({ success: true, id: retry.data?.id, from: fallbackFrom }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }

      throw new Error(typeof msg === "string" ? msg : "Email send failed");
    }

    console.log("[send-notification-email] Email sent", { id: sendData?.id, from: primaryFrom });

    return new Response(JSON.stringify({ 
      success: true,
      id: sendData?.id,
      from: primaryFrom,
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
  location,
  sessionType,
  zoomJoinUrl,
  zoomMeetingId,
  zoomPassword
}: {
  recipientName: string,
  studentName: string,
  date: string,
  startTime: string,
  endTime: string,
  courseName: string,
  location: string,
  sessionType?: 'virtual' | 'in_person' | string,
  zoomJoinUrl?: string,
  zoomMeetingId?: string,
  zoomPassword?: string
}): string {
  const isVirtual = sessionType === 'virtual';
  const zoomSection = isVirtual && zoomJoinUrl ? `
    <div style="background-color: #fff7f7; border: 1px solid #ffd6d6; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #990000;">Join Zoom Meeting</h3>
      <p style="margin: 0 0 10px 0;">
        <a href="${zoomJoinUrl}" style="background-color: #990000; color: white; padding: 10px 16px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Join Zoom Meeting
        </a>
      </p>
      ${zoomMeetingId ? `<p style="margin: 6px 0;"><strong>Meeting ID:</strong> ${zoomMeetingId}</p>` : ''}
      ${zoomPassword ? `<p style="margin: 6px 0;"><strong>Password:</strong> ${zoomPassword}</p>` : ''}
      <p style="margin: 10px 0 0 0; font-size: 13px; color: #555;">
        • Test your setup: <a href="https://zoom.us/test">https://zoom.us/test</a><br/>
        • iOS app: <a href="https://apps.apple.com/app/zoom-one-platform-to-connect/id546505307">App Store</a> · Android app: <a href="https://play.google.com/store/apps/details?id=us.zoom.videomeetings">Google Play</a><br/>
        • Dial-in (backup): +1 669-900-6833 (US). Enter Meeting ID and password when prompted.
      </p>
    </div>
  ` : '';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; color: #333;">
      <!-- Header with branding -->
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
        <a href="https://studybuddyusc.com" style="text-decoration: none; color: #990000; font-size: 24px; font-weight: bold;">
          🎓 StudyBuddy USC
        </a>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Your Premier Tutoring Marketplace</p>
      </div>
      <!-- Main content -->
      <div style="background-color: #990000; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">New Tutoring Session Booked${isVirtual ? ' (Virtual)' : ''}</h1>
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
        ${zoomSection}
        <p>Please be prepared for your session. Log in to view more details or make changes if needed.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://studybuddyusc.com/schedule" style="background-color: #990000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Your Schedule
          </a>
        </div>
        <p>Thank you for being a tutor with USC Study Buddy!</p>
      </div>
      <!-- Enhanced footer -->
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 5px 5px; border-top: 1px solid #ddd;">
        <div style="margin-bottom: 15px;">
          <a href="https://studybuddyusc.com" style="background-color: #990000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Visit StudyBuddy USC</a>
        </div>
        <p style="margin: 0; color: #666; font-size: 12px;">&copy; 2025 USC Study Buddy. All rights reserved.</p>
        <p style="margin: 5px 0 0 0; color: #999; font-size: 11px;">
          <a href="https://studybuddyusc.com" style="color: #990000; text-decoration: none;">studybuddyusc.com</a> | 
          The premier tutoring marketplace for USC students
        </p>
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
  location,
  sessionType,
  zoomJoinUrl,
  zoomMeetingId,
  zoomPassword
}: {
  recipientName: string,
  sessionDate: string,
  tutorName: string,
  startTime: string,
  endTime: string,
  courseName: string,
  location: string,
  sessionType?: 'virtual' | 'in_person' | string,
  zoomJoinUrl?: string,
  zoomMeetingId?: string,
  zoomPassword?: string
}): string {
  const isVirtual = sessionType === 'virtual';
  const zoomSection = isVirtual && zoomJoinUrl ? `
    <div style="background-color: #fff7f7; border: 1px solid #ffd6d6; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #990000;">Join Zoom Meeting</h3>
      <p style="margin: 0 0 10px 0;">
        <a href="${zoomJoinUrl}" style="background-color: #990000; color: white; padding: 10px 16px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Join Zoom Meeting
        </a>
      </p>
      ${zoomMeetingId ? `<p style="margin: 6px 0;"><strong>Meeting ID:</strong> ${zoomMeetingId}</p>` : ''}
      ${zoomPassword ? `<p style="margin: 6px 0;"><strong>Password:</strong> ${zoomPassword}</p>` : ''}
      <p style="margin: 10px 0 0 0; font-size: 13px; color: #555;">
        • Mobile: open the Zoom app and paste the Meeting ID if the button doesn't work.<br/>
        • Test your setup: <a href="https://zoom.us/test">https://zoom.us/test</a><br/>
        • Dial-in (backup): +1 669-900-6833 (US). Enter Meeting ID and password when prompted.
      </p>
    </div>
  ` : '';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; color: #333;">
      <!-- Header with branding -->
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
        <a href="https://studybuddyusc.com" style="text-decoration: none; color: #990000; font-size: 24px; font-weight: bold;">
          🎓 StudyBuddy USC
        </a>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Your Premier Tutoring Marketplace</p>
      </div>
      <!-- Main content -->
      <div style="background-color: #990000; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Session Reminder${isVirtual ? ' (Virtual)' : ''}</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p>Hello ${recipientName},</p>
        <p>This is a reminder of your upcoming tutoring session:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Tutor:</strong> ${tutorName}</p>
          <p><strong>Date:</strong> ${sessionDate}</p>
          <p><strong>Time:</strong> ${startTime} to ${endTime}</p>
          <p><strong>Course:</strong> ${courseName}</p>
          <p><strong>Location:</strong> ${location}</p>
        </div>
        
        ${zoomSection}
        
        <p>Please arrive on time and be prepared for your session.</p>
        
        <p>Thank you for using USC Study Buddy!</p>
      </div>
      <!-- Enhanced footer -->
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 5px 5px; border-top: 1px solid #ddd;">
        <div style="margin-bottom: 15px;">
          <a href="https://studybuddyusc.com" style="background-color: #990000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Visit StudyBuddy USC</a>
        </div>
        <p style="margin: 0; color: #666; font-size: 12px;">&copy; 2025 USC Study Buddy. All rights reserved.</p>
        <p style="margin: 5px 0 0 0; color: #999; font-size: 11px;">
          <a href="https://studybuddyusc.com" style="color: #990000; text-decoration: none;">studybuddyusc.com</a> | 
          The premier tutoring marketplace for USC students
        </p>
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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; color: #333;">
      <!-- Header with branding -->
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
        <a href="https://studybuddyusc.com" style="text-decoration: none; color: #990000; font-size: 24px; font-weight: bold;">
          🎓 StudyBuddy USC
        </a>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Your Premier Tutoring Marketplace</p>
      </div>
      <!-- Main content -->
      <div style="background-color: #990000; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">New Message</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
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
      <!-- Enhanced footer -->
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 5px 5px; border-top: 1px solid #ddd;">
        <div style="margin-bottom: 15px;">
          <a href="https://studybuddyusc.com" style="background-color: #990000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Visit StudyBuddy USC</a>
        </div>
        <p style="margin: 0; color: #666; font-size: 12px;">&copy; 2025 USC Study Buddy. All rights reserved.</p>
        <p style="margin: 5px 0 0 0; color: #999; font-size: 11px;">
          <a href="https://studybuddyusc.com" style="color: #990000; text-decoration: none;">studybuddyusc.com</a> | 
          The premier tutoring marketplace for USC students
        </p>
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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; color: #333;">
      <!-- Header with branding -->
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
        <a href="https://studybuddyusc.com" style="text-decoration: none; color: #990000; font-size: 24px; font-weight: bold;">
          🎓 StudyBuddy USC
        </a>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Your Premier Tutoring Marketplace</p>
      </div>
      <!-- Main content -->
      <div style="background-color: #990000; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Resource Update</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
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
      <!-- Enhanced footer -->
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 5px 5px; border-top: 1px solid #ddd;">
        <div style="margin-bottom: 15px;">
          <a href="https://studybuddyusc.com" style="background-color: #990000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Visit StudyBuddy USC</a>
        </div>
        <p style="margin: 0; color: #666; font-size: 12px;">&copy; 2025 USC Study Buddy. All rights reserved.</p>
        <p style="margin: 5px 0 0 0; color: #999; font-size: 11px;">
          <a href="https://studybuddyusc.com" style="color: #990000; text-decoration: none;">studybuddyusc.com</a> | 
          The premier tutoring marketplace for USC students
        </p>
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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; color: #333;">
      <!-- Header with branding -->
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
        <a href="https://studybuddyusc.com" style="text-decoration: none; color: #990000; font-size: 24px; font-weight: bold;">
          🎓 StudyBuddy USC
        </a>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Your Premier Tutoring Marketplace</p>
      </div>
      <!-- Main content -->
      <div style="background-color: #990000; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Platform Update</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p>Hello ${recipientName},</p>
        <p>We have some updates about the Study Buddy platform:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h2 style="margin-top: 0;">${updateTitle}</h2>
          <p>${updateDetails}</p>
        </div>
        
        <p>Thank you for using USC Study Buddy!</p>
      </div>
      <!-- Enhanced footer -->
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 5px 5px; border-top: 1px solid #ddd;">
        <div style="margin-bottom: 15px;">
          <a href="https://studybuddyusc.com" style="background-color: #990000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Visit StudyBuddy USC</a>
        </div>
        <p style="margin: 0; color: #666; font-size: 12px;">&copy; 2025 USC Study Buddy. All rights reserved.</p>
        <p style="margin: 5px 0 0 0; color: #999; font-size: 11px;">
          <a href="https://studybuddyusc.com" style="color: #990000; text-decoration: none;">studybuddyusc.com</a> | 
          The premier tutoring marketplace for USC students
        </p>
      </div>
    </div>
  `;
}

function generateSessionCancellationEmail({
  recipientName,
  sessionDate,
  startTime,
  endTime,
  courseName,
  location,
  counterpartName,
  sessionType
}: {
  recipientName: string,
  sessionDate: string,
  startTime: string,
  endTime: string,
  courseName: string,
  location: string,
  counterpartName?: string,
  sessionType?: 'virtual' | 'in_person' | string
}): string {
  const isVirtual = sessionType === 'virtual';
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; color: #333;">
      <!-- Header with branding -->
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
        <a href="https://studybuddyusc.com" style="text-decoration: none; color: #990000; font-size: 24px; font-weight: bold;">
          🎓 StudyBuddy USC
        </a>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Your Premier Tutoring Marketplace</p>
      </div>
      <!-- Main content -->
      <div style="background-color: #990000; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Session Cancelled${isVirtual ? ' (Virtual)' : ''}</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p>Hello ${recipientName},</p>
        <p>Your tutoring session has been cancelled.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          ${counterpartName ? `<p><strong>With:</strong> ${counterpartName}</p>` : ''}
          <p><strong>Date:</strong> ${sessionDate}</p>
          <p><strong>Time:</strong> ${startTime} to ${endTime}</p>
          <p><strong>Course:</strong> ${courseName}</p>
          <p><strong>Location:</strong> ${location}</p>
        </div>
        ${isVirtual ? `<p style="margin: 10px 0; color: #555;">The Zoom meeting associated with this session has also been cancelled.</p>` : ''}
        <p>If this was a mistake or you need to book again, you can reschedule anytime.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://studybuddyusc.com/schedule" style="background-color: #990000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Book Another Session
          </a>
        </div>
      </div>
      <!-- Enhanced footer -->
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 5px 5px; border-top: 1px solid #ddd;">
        <div style="margin-bottom: 15px;">
          <a href="https://studybuddyusc.com" style="background-color: #990000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Visit StudyBuddy USC</a>
        </div>
        <p style="margin: 0; color: #666; font-size: 12px;">&copy; 2025 USC Study Buddy. All rights reserved.</p>
        <p style="margin: 5px 0 0 0; color: #999; font-size: 11px;">
          <a href="https://studybuddyusc.com" style="color: #990000; text-decoration: none;">studybuddyusc.com</a> | 
          The premier tutoring marketplace for USC students
        </p>
      </div>
    </div>
  `;
}

function generateSessionRescheduleEmail({
  recipientName,
  oldDate,
  oldStartTime,
  oldEndTime,
  newDate,
  newStartTime,
  newEndTime,
  courseName,
  location,
  sessionType,
  zoomJoinUrl,
  zoomMeetingId,
  zoomPassword
}: {
  recipientName: string,
  oldDate: string,
  oldStartTime: string,
  oldEndTime: string,
  newDate: string,
  newStartTime: string,
  newEndTime: string,
  courseName: string,
  location: string,
  sessionType?: 'virtual' | 'in_person' | string,
  zoomJoinUrl?: string,
  zoomMeetingId?: string,
  zoomPassword?: string
}): string {
  const isVirtual = sessionType === 'virtual';
  const zoomSection = isVirtual && zoomJoinUrl ? `
    <div style="background-color: #fff7f7; border: 1px solid #ffd6d6; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #990000;">Updated Zoom Details</h3>
      <p style="margin: 0 0 10px 0;">
        <a href="${zoomJoinUrl}" style="background-color: #990000; color: white; padding: 10px 16px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Join Zoom Meeting
        </a>
      </p>
      ${zoomMeetingId ? `<p style=\"margin: 6px 0;\"><strong>Meeting ID:</strong> ${zoomMeetingId}</p>` : ''}
      ${zoomPassword ? `<p style=\"margin: 6px 0;\"><strong>Password:</strong> ${zoomPassword}</p>` : ''}
      <p style="margin: 10px 0 0 0; font-size: 13px; color: #555;">
        • Test your setup: <a href="https://zoom.us/test">https://zoom.us/test</a>
      </p>
    </div>
  ` : '';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; color: #333;">
      <!-- Header with branding -->
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
        <a href="https://studybuddyusc.com" style="text-decoration: none; color: #990000; font-size: 24px; font-weight: bold;">
          🎓 StudyBuddy USC
        </a>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Your Premier Tutoring Marketplace</p>
      </div>
      <!-- Main content -->
      <div style="background-color: #990000; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Session Rescheduled${isVirtual ? ' (Virtual)' : ''}</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p>Hello ${recipientName},</p>
        <p>Your tutoring session has been rescheduled.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Previous:</strong> ${oldDate} from ${oldStartTime} to ${oldEndTime}</p>
          <p><strong>New:</strong> ${newDate} from ${newStartTime} to ${newEndTime}</p>
          <p><strong>Course:</strong> ${courseName}</p>
          <p><strong>Location:</strong> ${location}</p>
        </div>
        ${zoomSection}
        <p>Please update your calendar accordingly.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://studybuddyusc.com/schedule" style="background-color: #990000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Updated Session
          </a>
        </div>
      </div>
      <!-- Enhanced footer -->
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 5px 5px; border-top: 1px solid #ddd;">
        <div style="margin-bottom: 15px;">
          <a href="https://studybuddyusc.com" style="background-color: #990000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Visit StudyBuddy USC</a>
        </div>
        <p style="margin: 0; color: #666; font-size: 12px;">&copy; 2025 USC Study Buddy. All rights reserved.</p>
        <p style="margin: 5px 0 0 0; color: #999; font-size: 11px;">
          <a href="https://studybuddyusc.com" style="color: #990000; text-decoration: none;">studybuddyusc.com</a> | 
          The premier tutoring marketplace for USC students
        </p>
      </div>
    </div>
  `;
}

function generateAdminWarningEmail({
  recipientName,
  reason
}: {
  recipientName: string,
  reason: string
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; color: #333;">
      <!-- Header with branding -->
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
        <a href="https://studybuddyusc.com" style="text-decoration: none; color: #990000; font-size: 24px; font-weight: bold;">
          🎓 StudyBuddy USC
        </a>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Your Premier Tutoring Marketplace</p>
      </div>
      <!-- Main content -->
      <div style="background-color: #ff6b35; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">⚠️ Warning Notice</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
        <p>Hello ${recipientName},</p>
        <p>You have received a warning regarding your tutoring activities on USC Study Buddy.</p>
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Action Required:</strong> Please ensure you attend all scheduled sessions or cancel in advance with appropriate notice.</p>
        </div>
        <p>To maintain a high-quality experience for all students, we expect tutors to be reliable and professional. Multiple warnings may result in account suspension.</p>
        <p>If you have any questions or concerns, please contact our support team.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://studybuddyusc.com/schedule" style="background-color: #990000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Your Schedule
          </a>
        </div>
        <p>Thank you for your attention to this matter.</p>
      </div>
      <!-- Enhanced footer -->
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 5px 5px; border-top: 1px solid #ddd;">
        <div style="margin-bottom: 15px;">
          <a href="https://studybuddyusc.com" style="background-color: #990000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Visit StudyBuddy USC</a>
        </div>
        <p style="margin: 0; color: #666; font-size: 12px;">&copy; 2025 USC Study Buddy. All rights reserved.</p>
        <p style="margin: 5px 0 0 0; color: #999; font-size: 11px;">
          <a href="https://studybuddyusc.com" style="color: #990000; text-decoration: none;">studybuddyusc.com</a> | 
          The premier tutoring marketplace for USC students
        </p>
      </div>
    </div>
  `;
}

function generateAdminSuspensionEmail({
  recipientName,
  reason
}: {
  recipientName: string,
  reason: string
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; color: #333;">
      <!-- Header with branding -->
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
        <a href="https://studybuddyusc.com" style="text-decoration: none; color: #990000; font-size: 24px; font-weight: bold;">
          🎓 StudyBuddy USC
        </a>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Your Premier Tutoring Marketplace</p>
      </div>
      <!-- Main content -->
      <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">🚫 Account Suspended</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
        <p>Hello ${recipientName},</p>
        <p>Your tutor account has been suspended due to violations of our platform policies.</p>
        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Reason for Suspension:</strong> ${reason}</p>
          <p><strong>Effective Immediately:</strong> Your account has been temporarily deactivated and you will not be able to accept new tutoring sessions.</p>
        </div>
        <p>If you believe this suspension was made in error or if you would like to appeal this decision, please contact our support team with detailed information about your case.</p>
        <p>We take the quality and reliability of our tutoring services seriously to ensure the best experience for all students.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="mailto:support@studybuddyusc.com" style="background-color: #990000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Contact Support
          </a>
        </div>
        <p>Sincerely,<br>USC Study Buddy Administration</p>
      </div>
      <!-- Enhanced footer -->
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 5px 5px; border-top: 1px solid #ddd;">
        <div style="margin-bottom: 15px;">
          <a href="https://studybuddyusc.com" style="background-color: #990000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Visit StudyBuddy USC</a>
        </div>
        <p style="margin: 0; color: #666; font-size: 12px;">&copy; 2025 USC Study Buddy. All rights reserved.</p>
        <p style="margin: 5px 0 0 0; color: #999; font-size: 11px;">
          <a href="https://studybuddyusc.com" style="color: #990000; text-decoration: none;">studybuddyusc.com</a> | 
          The premier tutoring marketplace for USC students
        </p>
      </div>
    </div>
  `;
}
