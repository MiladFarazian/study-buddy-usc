import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApprovalEmailRequest {
  tutorEmail: string;
  tutorName: string;
  tutorId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tutorEmail, tutorName, tutorId }: ApprovalEmailRequest = await req.json();

    console.log(`Sending approval email to ${tutorEmail} (${tutorName})`);

    const settingsUrl = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || 'https://studybuddy.lovable.app'}/settings?tab=profile`;

    const emailResponse = await resend.emails.send({
      from: `StudyBuddy <${Deno.env.get("RESEND_FROM") || "onboarding@resend.dev"}>`,
      reply_to: Deno.env.get("RESEND_REPLY_TO"),
      to: [tutorEmail],
      subject: "🎉 You've Been Approved as a StudyBuddy Tutor!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background-color: #ffffff;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .header h1 {
                color: #2563eb;
                font-size: 28px;
                margin: 0 0 10px 0;
              }
              .content {
                margin-bottom: 30px;
              }
              .content p {
                margin: 15px 0;
              }
              .cta-button {
                display: inline-block;
                background-color: #2563eb;
                color: #ffffff;
                text-decoration: none;
                padding: 14px 32px;
                border-radius: 6px;
                font-weight: 600;
                text-align: center;
                margin: 20px 0;
              }
              .cta-button:hover {
                background-color: #1d4ed8;
              }
              .next-steps {
                background-color: #f3f4f6;
                border-left: 4px solid #2563eb;
                padding: 20px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .next-steps h3 {
                margin-top: 0;
                color: #1f2937;
              }
              .next-steps ul {
                margin: 10px 0;
                padding-left: 20px;
              }
              .next-steps li {
                margin: 8px 0;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Congratulations, ${tutorName}!</h1>
                <p style="color: #059669; font-size: 18px; font-weight: 600;">You've Been Approved as a StudyBuddy Tutor</p>
              </div>
              
              <div class="content">
                <p>Great news! Your tutor application has been approved. You're now ready to start helping USC students succeed in their courses.</p>
                
                <div class="next-steps">
                  <h3>Next Steps to Get Started:</h3>
                  <ul>
                    <li><strong>Switch to Tutor View:</strong> Go to Settings and toggle to tutor mode</li>
                    <li><strong>Complete Your Profile:</strong> Add your bio, hourly rate, and availability</li>
                    <li><strong>Select Your Courses:</strong> Choose the courses you're qualified to tutor</li>
                    <li><strong>Start Tutoring:</strong> Students can now find and book sessions with you!</li>
                  </ul>
                </div>
                
                <div style="text-align: center;">
                  <a href="${settingsUrl}" class="cta-button">Set Up Your Tutor Account →</a>
                </div>
                
                <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
                
                <p>Welcome to the StudyBuddy community! We're excited to have you on board.</p>
              </div>
              
              <div class="footer">
                <p>StudyBuddy - Connecting USC Students with Expert Tutors</p>
                <p style="font-size: 12px; color: #9ca3af;">
                  If you didn't apply to be a tutor, please contact us immediately at 
                  <a href="mailto:support@studybuddy.com" style="color: #2563eb;">support@studybuddy.com</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Approval email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending tutor approval email:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
