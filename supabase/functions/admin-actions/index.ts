import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Admin credentials - in production this would be from a secure admin table
const ADMIN_EMAIL = "noah@studybuddyusc.com";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { action, adminEmail, sessionId, tutorId } = await req.json();
    
    // Verify admin credentials
    if (adminEmail !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing admin action: ${action} for session ${sessionId}`);

    switch (action) {
      case 'warn':
        // Get tutor profile and email details
        const { data: tutorProfile, error: tutorError } = await supabaseAdmin
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', tutorId)
          .single();

        if (tutorError || !tutorProfile) {
          console.error('Error fetching tutor profile:', tutorError);
          return new Response(JSON.stringify({ error: 'Failed to fetch tutor profile' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Get email from auth.users
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(tutorId);
        
        if (authError || !authUser) {
          console.error('Error fetching tutor auth data:', authError);
          return new Response(JSON.stringify({ error: 'Failed to fetch tutor email' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Send warning email via send-notification-email function
        const tutorName = [tutorProfile.first_name, tutorProfile.last_name].filter(Boolean).join(' ') || 'Tutor';
        const { error: emailError } = await supabaseAdmin.functions.invoke('send-notification-email', {
          body: {
            recipientUserId: tutorId,
            recipientName: tutorName,
            recipientEmail: authUser.user.email,
            subject: 'Warning: No-Show Report',
            notificationType: 'admin_warning',
            data: {
              reason: 'No-show report received'
            }
          }
        });

        if (emailError) {
          console.error('Error sending warning email:', emailError);
          return new Response(JSON.stringify({ error: 'Failed to send warning email' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Warning email sent successfully');
        break;

      case 'suspend':
        // Get tutor profile for email details before suspension
        const { data: suspendTutorProfile, error: suspendTutorError } = await supabaseAdmin
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', tutorId)
          .single();

        if (suspendTutorError || !suspendTutorProfile) {
          console.error('Error fetching tutor profile for suspension:', suspendTutorError);
          return new Response(JSON.stringify({ error: 'Failed to fetch tutor profile' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Get email from auth.users for suspension
        const { data: suspendAuthUser, error: suspendAuthError } = await supabaseAdmin.auth.admin.getUserById(tutorId);
        
        if (suspendAuthError || !suspendAuthUser) {
          console.error('Error fetching tutor auth data for suspension:', suspendAuthError);
          return new Response(JSON.stringify({ error: 'Failed to fetch tutor email for suspension' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Update tutor profile to suspend them
        const { error: suspendError } = await supabaseAdmin
          .from('profiles')
          .update({ approved_tutor: false })
          .eq('id', tutorId);

        if (suspendError) {
          console.error('Error suspending tutor:', suspendError);
          return new Response(JSON.stringify({ error: 'Failed to suspend tutor' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Also send suspension notification email
        const suspendTutorName = [suspendTutorProfile.first_name, suspendTutorProfile.last_name].filter(Boolean).join(' ') || 'Tutor';
        const { error: suspensionEmailError } = await supabaseAdmin.functions.invoke('send-notification-email', {
          body: {
            recipientUserId: tutorId,
            recipientName: suspendTutorName,
            recipientEmail: suspendAuthUser.user.email,
            subject: 'Account Suspended',
            notificationType: 'admin_suspension',
            data: {
              reason: 'Multiple no-show reports received'
            }
          }
        });

        if (suspensionEmailError) {
          console.error('Error sending suspension email:', suspensionEmailError);
          // Don't fail the entire operation if email fails - suspension should still complete
        }

        console.log('Tutor suspended successfully');
        break;

      case 'dismiss':
        // Clear the no_show_report field for the session
        const { error: dismissError } = await supabaseAdmin
          .from('sessions')
          .update({ no_show_report: null })
          .eq('id', sessionId);

        if (dismissError) {
          console.error('Error dismissing report:', dismissError);
          return new Response(JSON.stringify({ error: 'Failed to dismiss report' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Report dismissed successfully');
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in admin-actions function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);