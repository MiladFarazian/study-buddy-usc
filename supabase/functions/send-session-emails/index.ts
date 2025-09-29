
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@4.0.0';

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

interface EmailRequest {
  sessionId: string;
  emailType: 'confirmation' | 'cancellation' | 'reminder';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { sessionId, emailType }: EmailRequest = await req.json();
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    if (!['confirmation', 'cancellation', 'reminder'].includes(emailType)) {
      throw new Error('Invalid email type. Must be confirmation, cancellation, or reminder');
    }
    
    // Fetch the session with related data
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        tutor:tutor_id(id, first_name, last_name),
        student:student_id(id, first_name, last_name)
      `)
      .eq('id', sessionId)
      .single();
      
    if (sessionError || !session) {
      throw new Error(`Error fetching session: ${sessionError?.message || 'Session not found'}`);
    }
    
    // Fetch user emails using service role
    const { data: tutorData, error: tutorError } = await supabase.auth.admin.getUserById(session.tutor_id);
    if (tutorError) throw new Error(`Error fetching tutor data: ${tutorError.message}`);

    const { data: studentData, error: studentError } = await supabase.auth.admin.getUserById(session.student_id);
    if (studentError) throw new Error(`Error fetching student data: ${studentError.message}`);

    const tutorEmail = tutorData.user.email;
    const studentEmail = studentData.user.email;
    
    if (!tutorEmail || !studentEmail) {
      throw new Error('Missing email for tutor or student');
    }

    // Check notification preferences for both users
    const { data: tutorPrefs } = await supabase
      .from('notification_preferences')
      .select('session_reminders')
      .eq('user_id', session.tutor_id)
      .maybeSingle();
      
    const { data: studentPrefs } = await supabase
      .from('notification_preferences')
      .select('session_reminders')
      .eq('user_id', session.student_id)
      .maybeSingle();

    const sendToTutor = tutorPrefs?.session_reminders !== false; // Default to true if not set
    const sendToStudent = studentPrefs?.session_reminders !== false; // Default to true if not set
    
    // Format dates for display
    const startDate = new Date(session.start_time);
    const endDate = new Date(session.end_time);
    
    const formattedDate = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    
    const formattedStartTime = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    const formattedEndTime = endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Build the email information based on type
    let tutorSubject, studentSubject, tutorHtml, studentHtml;
    const tutorName = `${session.tutor.first_name} ${session.tutor.last_name}`;
    const studentName = `${session.student.first_name} ${session.student.last_name}`;

    if (emailType === 'confirmation') {
      tutorSubject = `New Tutoring Session Booked - ${formattedDate}`;
      studentSubject = `Your Tutoring Session is Confirmed - ${formattedDate}`;
    } else if (emailType === 'cancellation') {
      tutorSubject = `Tutoring Session Cancelled - ${formattedDate}`;
      studentSubject = `Tutoring Session Cancelled - ${formattedDate}`;
    } else {
      tutorSubject = `Reminder: Upcoming Tutoring Session - ${formattedDate}`;
      studentSubject = `Reminder: Upcoming Tutoring Session - ${formattedDate}`;
    }

    const results = [];
    
    // Send email to tutor if enabled
    if (sendToTutor) {
      try {
        const tutorEmailResponse = await resend.emails.send({
          from: FROM_ADDRESS,
          to: [tutorEmail],
          subject: tutorSubject,
          html: generateEmailHtml({
            recipientName: tutorName,
            sessionDate: formattedDate,
            startTime: formattedStartTime,
            endTime: formattedEndTime,
            courseName: session.course_id,
            location: session.location,
            notes: session.notes,
            counterpartName: studentName,
            counterpartRole: 'student',
            emailType,
            sessionType: session.session_type,
            zoomJoinUrl: session.zoom_join_url,
            zoomMeetingId: session.zoom_meeting_id,
            zoomPassword: session.zoom_password
          }),
          replyTo: REPLY_TO,
        });

        console.log("Tutor email sent successfully:", tutorEmailResponse);
        results.push({ recipient: 'tutor', id: (tutorEmailResponse as any).id });
      } catch (error) {
        const err = error as any;
        console.error("Error sending tutor email:", error);
        results.push({ recipient: 'tutor', error: err.message || 'Unknown error' });
      }
    } else {
      console.log("Tutor has disabled session notifications");
      results.push({ recipient: 'tutor', skipped: true });
    }
    
    // Send email to student if enabled
    if (sendToStudent) {
      try {
        const studentEmailResponse = await resend.emails.send({
          from: FROM_ADDRESS,
          to: [studentEmail],
          subject: studentSubject,
          html: generateEmailHtml({
            recipientName: studentName,
            sessionDate: formattedDate,
            startTime: formattedStartTime,
            endTime: formattedEndTime,
            courseName: session.course_id,
            location: session.location,
            notes: session.notes,
            counterpartName: tutorName,
            counterpartRole: 'tutor',
            emailType,
            sessionType: session.session_type,
            zoomJoinUrl: session.zoom_join_url,
            zoomMeetingId: session.zoom_meeting_id,
            zoomPassword: session.zoom_password
          }),
          replyTo: REPLY_TO,
        });

        console.log("Student email sent successfully:", studentEmailResponse);
        results.push({ recipient: 'student', id: (studentEmailResponse as any).id });
      } catch (error) {
        const err = error as any;
        console.error("Error sending student email:", error);
        results.push({ recipient: 'student', error: err.message || 'Unknown error' });
      }
    } else {
      console.log("Student has disabled session notifications");
      results.push({ recipient: 'student', skipped: true });
    }

    return new Response(JSON.stringify({ 
      success: true,
      results
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    const err = error as any;
    console.error("Error sending emails:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: err.message || "An unknown error occurred"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

// Helper function to generate email HTML
function generateEmailHtml({
  recipientName,
  sessionDate,
  startTime,
  endTime,
  courseName,
  location,
  notes,
  counterpartName,
  counterpartRole,
  emailType,
  sessionType,
  zoomJoinUrl,
  zoomMeetingId,
  zoomPassword
}: {
  recipientName: string,
  sessionDate: string,
  startTime: string,
  endTime: string,
  courseName?: string,
  location?: string,
  notes?: string,
  counterpartName: string,
  counterpartRole: 'tutor' | 'student',
  emailType: 'confirmation' | 'cancellation' | 'reminder',
  sessionType?: string,
  zoomJoinUrl?: string,
  zoomMeetingId?: string,
  zoomPassword?: string
}): string {
  let title, message, actionText;
  
  if (emailType === 'confirmation') {
    title = counterpartRole === 'tutor' ? 'Tutoring Session Confirmed' : 'New Tutoring Session Booked';
    message = counterpartRole === 'tutor' ? 
      `Your tutoring session has been confirmed. Here are the details:` : 
      `A new tutoring session has been booked with you. Here are the details:`;
    actionText = counterpartRole === 'tutor' ? 
      `Please be on time for your session. If you need to reschedule or cancel, please do so at least 24 hours in advance.` :
      `Please make sure to be available at the scheduled time. If you need to reschedule or have any questions, please contact the student directly.`;
  } else if (emailType === 'cancellation') {
    title = 'Session Cancelled';
    message = counterpartRole === 'tutor' ? 
      `We're writing to confirm that your tutoring session has been cancelled:` : 
      `We're writing to inform you that the following tutoring session has been cancelled:`;
    actionText = counterpartRole === 'tutor' ? 
      `If this cancellation was unexpected, please contact us for assistance.` :
      `Your schedule has been updated accordingly.`;
  } else {
    title = 'Upcoming Session Reminder';
    message = counterpartRole === 'tutor' ? 
      `This is a reminder of your upcoming tutoring session:` : 
      `This is a reminder that you have an upcoming tutoring session:`;
    actionText = counterpartRole === 'tutor' ? 
      `Please arrive on time and be prepared for your session.` :
      `Please ensure you're prepared and available for this session.`;
  }

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
        <h1 style="margin: 0;">${title}</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
        <p>Hello ${recipientName},</p>
        <p>${message}</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>${counterpartRole === 'tutor' ? 'Tutor' : 'Student'}:</strong> ${counterpartName}</p>
          <p><strong>Date:</strong> ${sessionDate}</p>
          <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
          ${courseName ? `<p><strong>Course:</strong> ${courseName}</p>` : ''}
          ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
        </div>
        
        ${sessionType === 'virtual' && zoomJoinUrl ? `
        <div style="background-color: #dbeafe; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #3b82f6;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e40af;">🎥 Virtual Meeting Details</p>
          <div style="margin: 10px 0;">
            <a href="${zoomJoinUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Zoom Meeting</a>
          </div>
          ${zoomMeetingId ? `<p style="margin: 5px 0;"><strong>Meeting ID:</strong> ${zoomMeetingId}</p>` : ''}
          ${zoomPassword ? `<p style="margin: 5px 0;"><strong>Password:</strong> ${zoomPassword}</p>` : ''}
        </div>
        ` : ''}
        
        <p>${actionText}</p>
        
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
