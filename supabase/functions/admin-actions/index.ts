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

        // First, query future scheduled sessions that will be cancelled
        const { data: futureSessions, error: futureSessionsError } = await supabaseAdmin
          .from('sessions')
          .select(`
            id,
            start_time,
            end_time,
            student_id,
            course_id,
            profiles:student_id (
              first_name,
              last_name
            )
          `)
          .eq('tutor_id', tutorId)
          .eq('status', 'scheduled')
          .gt('start_time', new Date().toISOString());

        if (futureSessionsError) {
          console.error('Error fetching future sessions:', futureSessionsError);
          return new Response(JSON.stringify({ error: 'Failed to fetch future sessions' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log(`Found ${futureSessions?.length || 0} future sessions to cancel`);

        // Step 1: Suspend the tutor
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

        console.log('Tutor suspended successfully');

        // Step 2: Cancel all future scheduled sessions
        const { error: cancelError } = await supabaseAdmin
          .from('sessions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
            notes: 'Session cancelled due to tutor account suspension'
          })
          .eq('tutor_id', tutorId)
          .eq('status', 'scheduled')
          .gt('start_time', new Date().toISOString());

        if (cancelError) {
          console.error('Error cancelling sessions:', cancelError);
          
          // If session cancellation fails, try to revert tutor suspension
          const { error: revertError } = await supabaseAdmin
            .from('profiles')
            .update({ approved_tutor: true })
            .eq('id', tutorId);
          
          if (revertError) {
            console.error('Failed to revert tutor suspension after session cancel error:', revertError);
          }
          
          return new Response(JSON.stringify({ error: 'Failed to cancel sessions, suspension reverted' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log(`Successfully cancelled ${futureSessions?.length || 0} future sessions`);

        // Send notifications to affected students
        let studentsNotified = 0;
        const suspendTutorName = [suspendTutorProfile.first_name, suspendTutorProfile.last_name].filter(Boolean).join(' ') || 'Tutor';
        
        if (futureSessions && futureSessions.length > 0) {
          for (const session of futureSessions) {
            try {
              // Get student auth data for email
              const { data: studentAuthUser, error: studentAuthError } = await supabaseAdmin.auth.admin.getUserById(session.student_id);
              
              if (studentAuthUser && !studentAuthError) {
                const profiles = Array.isArray(session.profiles) ? session.profiles[0] : session.profiles;
                const studentName = profiles ? 
                  [profiles.first_name, profiles.last_name].filter(Boolean).join(' ') || 'Student' 
                  : 'Student';
                
                const sessionDate = new Date(session.start_time).toLocaleDateString();
                const sessionTime = new Date(session.start_time).toLocaleTimeString();
                
                // Send cancellation notification to student
                const { error: studentEmailError } = await supabaseAdmin.functions.invoke('send-notification-email', {
                  body: {
                    recipientUserId: session.student_id,
                    recipientName: studentName,
                    recipientEmail: studentAuthUser.user.email,
                    subject: 'Session Cancelled - Tutor Unavailable',
                    notificationType: 'session_cancelled_tutor_suspended',
                    data: {
                      sessionId: session.id,
                      sessionDate: sessionDate,
                      sessionTime: sessionTime,
                      tutorName: suspendTutorName,
                      startTime: session.start_time,
                      endTime: session.end_time
                    }
                  }
                });

                if (!studentEmailError) {
                  studentsNotified++;
                } else {
                  console.error(`Failed to notify student ${session.student_id}:`, studentEmailError);
                }
              }
            } catch (error) {
              console.error(`Error notifying student for session ${session.id}:`, error);
            }
          }
        }

        // Send suspension notification email to tutor
        const { error: suspensionEmailError } = await supabaseAdmin.functions.invoke('send-notification-email', {
          body: {
            recipientUserId: tutorId,
            recipientName: suspendTutorName,
            recipientEmail: suspendAuthUser.user.email,
            subject: 'Account Suspended',
            notificationType: 'admin_suspension',
            data: {
              reason: 'Multiple no-show reports received',
              sessionsCancelled: futureSessions?.length || 0
            }
          }
        });

        if (suspensionEmailError) {
          console.error('Error sending suspension email:', suspensionEmailError);
          // Don't fail the entire operation if email fails
        }

        console.log(`Tutor suspended successfully. Cancelled ${futureSessions?.length || 0} future sessions. Notified ${studentsNotified} students.`);
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