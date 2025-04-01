
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

interface EmailRequest {
  sessionId: string;
  tutorId: string;
  tutorName: string;
  studentId: string;
  studentName: string;
  startTime: string;
  endTime: string;
  course?: string;
  location?: string;
  notes?: string;
  price: number;
  emailType: 'confirmation' | 'cancellation' | 'reminder';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const {
      sessionId,
      tutorId,
      tutorName,
      studentId,
      studentName,
      startTime,
      endTime,
      course,
      location,
      notes,
      price,
      emailType
    }: EmailRequest = await req.json();

    // Fetch user emails from auth.users using service role
    const { data: tutorData, error: tutorError } = await supabase.auth.admin.getUserById(tutorId);
    if (tutorError) throw new Error(`Error fetching tutor data: ${tutorError.message}`);

    const { data: studentData, error: studentError } = await supabase.auth.admin.getUserById(studentId);
    if (studentError) throw new Error(`Error fetching student data: ${studentError.message}`);

    const tutorEmail = tutorData.user.email;
    const studentEmail = studentData.user.email;

    if (!tutorEmail || !studentEmail) {
      throw new Error('Missing email for tutor or student');
    }

    // Format dates for display
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
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

    // Generate email content based on emailType
    let tutorSubject, studentSubject, tutorHtml, studentHtml;

    if (emailType === 'confirmation') {
      // Tutor email content
      tutorSubject = `New Tutoring Session Booked - ${formattedDate}`;
      tutorHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background-color: #990000; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">New Tutoring Session Booked</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
            <p>Hello ${tutorName},</p>
            <p>A new tutoring session has been booked with you. Here are the details:</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Student:</strong> ${studentName}</p>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
              ${course ? `<p><strong>Course:</strong> ${course}</p>` : ''}
              ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
              ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
              <p><strong>Payment:</strong> $${price.toFixed(2)}</p>
            </div>
            
            <p>Please make sure to be available at the scheduled time. If you need to reschedule or have any questions, please contact the student directly.</p>
            
            <p>Thank you for using USC Study Buddy!</p>
          </div>
          <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
            <p>&copy; 2025 USC Study Buddy. All rights reserved.</p>
          </div>
        </div>
      `;

      // Student email content
      studentSubject = `Your Tutoring Session is Confirmed - ${formattedDate}`;
      studentHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background-color: #990000; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">Tutoring Session Confirmed</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
            <p>Hello ${studentName},</p>
            <p>Your tutoring session has been confirmed. Here are the details:</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Tutor:</strong> ${tutorName}</p>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
              ${course ? `<p><strong>Course:</strong> ${course}</p>` : ''}
              ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
              ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
              <p><strong>Payment:</strong> $${price.toFixed(2)}</p>
            </div>
            
            <p>Please be on time for your session. If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
            
            <p>Thank you for using USC Study Buddy!</p>
          </div>
          <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
            <p>&copy; 2025 USC Study Buddy. All rights reserved.</p>
          </div>
        </div>
      `;
    } else if (emailType === 'cancellation') {
      // Implement cancellation email templates
      tutorSubject = `Tutoring Session Cancelled - ${formattedDate}`;
      tutorHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background-color: #990000; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">Session Cancelled</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
            <p>Hello ${tutorName},</p>
            <p>We're writing to inform you that the following tutoring session has been cancelled:</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Student:</strong> ${studentName}</p>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
              ${course ? `<p><strong>Course:</strong> ${course}</p>` : ''}
            </div>
            
            <p>Your schedule has been updated accordingly.</p>
            
            <p>Thank you for using USC Study Buddy!</p>
          </div>
          <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
            <p>&copy; 2025 USC Study Buddy. All rights reserved.</p>
          </div>
        </div>
      `;

      studentSubject = `Tutoring Session Cancelled - ${formattedDate}`;
      studentHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background-color: #990000; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">Session Cancelled</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
            <p>Hello ${studentName},</p>
            <p>We're writing to confirm that your tutoring session has been cancelled:</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Tutor:</strong> ${tutorName}</p>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
              ${course ? `<p><strong>Course:</strong> ${course}</p>` : ''}
            </div>
            
            <p>If this cancellation was unexpected, please contact us for assistance.</p>
            
            <p>Thank you for using USC Study Buddy!</p>
          </div>
          <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
            <p>&copy; 2025 USC Study Buddy. All rights reserved.</p>
          </div>
        </div>
      `;
    } else if (emailType === 'reminder') {
      // Implement reminder email templates
      tutorSubject = `Reminder: Upcoming Tutoring Session - ${formattedDate}`;
      tutorHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background-color: #990000; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">Upcoming Session Reminder</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
            <p>Hello ${tutorName},</p>
            <p>This is a reminder that you have an upcoming tutoring session:</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Student:</strong> ${studentName}</p>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
              ${course ? `<p><strong>Course:</strong> ${course}</p>` : ''}
              ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
            </div>
            
            <p>Please ensure you're prepared and available for this session.</p>
            
            <p>Thank you for using USC Study Buddy!</p>
          </div>
          <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
            <p>&copy; 2025 USC Study Buddy. All rights reserved.</p>
          </div>
        </div>
      `;

      studentSubject = `Reminder: Upcoming Tutoring Session - ${formattedDate}`;
      studentHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background-color: #990000; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">Upcoming Session Reminder</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
            <p>Hello ${studentName},</p>
            <p>This is a reminder of your upcoming tutoring session:</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Tutor:</strong> ${tutorName}</p>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
              ${course ? `<p><strong>Course:</strong> ${course}</p>` : ''}
              ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
            </div>
            
            <p>Please arrive on time and be prepared for your session.</p>
            
            <p>Thank you for using USC Study Buddy!</p>
          </div>
          <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
            <p>&copy; 2025 USC Study Buddy. All rights reserved.</p>
          </div>
        </div>
      `;
    } else {
      throw new Error(`Invalid email type: ${emailType}`);
    }

    console.log(`Sending ${emailType} emails to tutor (${tutorEmail}) and student (${studentEmail})`);

    // Send email to tutor
    const tutorEmailResponse = await resend.emails.send({
      from: "USC Study Buddy <notifications@studybuddyusc.com>",
      to: [tutorEmail],
      subject: tutorSubject,
      html: tutorHtml,
    });

    console.log("Tutor email sent successfully:", tutorEmailResponse);

    // Send email to student
    const studentEmailResponse = await resend.emails.send({
      from: "USC Study Buddy <notifications@studybuddyusc.com>",
      to: [studentEmail],
      subject: studentSubject,
      html: studentHtml,
    });

    console.log("Student email sent successfully:", studentEmailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      tutorEmail: tutorEmailResponse,
      studentEmail: studentEmailResponse
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error sending emails:", error);
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
