
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@/types/session";

/**
 * Sends confirmation emails to both tutor and student for a session
 * @param sessionId The ID of the session
 * @returns Promise with success status
 */
export async function sendSessionConfirmationEmails(sessionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Fetch detailed session information
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        tutor:profiles!tutor_id(id, first_name, last_name, hourly_rate),
        student:profiles!student_id(id, first_name, last_name)
      `)
      .eq('id', sessionId)
      .single();
    
    if (sessionError) {
      throw new Error(`Error fetching session details: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error(`Session not found with ID: ${sessionId}`);
    }
    
    // Get tutor and student details
    const tutorName = `${session.tutor.first_name || ''} ${session.tutor.last_name || ''}`.trim();
    const studentName = `${session.student.first_name || ''} ${session.student.last_name || ''}`.trim();
    
    // Calculate session duration in hours for price
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const price = session.tutor.hourly_rate ? session.tutor.hourly_rate * durationHours : 0;
    
    // Call the edge function directly to send emails
    // This edge function will handle fetching the emails on the server side with admin privileges
    const { data, error } = await supabase.functions.invoke('send-session-emails', {
      body: {
        sessionId: session.id,
        tutorId: session.tutor.id,
        tutorName,
        studentId: session.student.id,
        studentName,
        startTime: session.start_time,
        endTime: session.end_time,
        location: session.location,
        notes: session.notes,
        price,
        emailType: 'confirmation'
      }
    });
    
    if (error) {
      throw new Error(`Error invoking send-session-emails function: ${error.message}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending confirmation emails:', error);
    return { 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Sends cancellation emails to both tutor and student for a session
 * @param sessionId The ID of the session
 * @returns Promise with success status
 */
export async function sendSessionCancellationEmails(sessionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Fetch detailed session information
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        tutor:profiles!tutor_id(id, first_name, last_name, hourly_rate),
        student:profiles!student_id(id, first_name, last_name)
      `)
      .eq('id', sessionId)
      .single();
    
    if (sessionError) {
      throw new Error(`Error fetching session details: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error(`Session not found with ID: ${sessionId}`);
    }
    
    // Get tutor and student details
    const tutorName = `${session.tutor.first_name || ''} ${session.tutor.last_name || ''}`.trim();
    const studentName = `${session.student.first_name || ''} ${session.student.last_name || ''}`.trim();
    
    // Calculate session duration in hours for price
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const price = session.tutor.hourly_rate ? session.tutor.hourly_rate * durationHours : 0;
    
    // Call the edge function directly to send emails
    // This edge function will handle fetching the emails on the server side with admin privileges
    const { data, error } = await supabase.functions.invoke('send-session-emails', {
      body: {
        sessionId: session.id,
        tutorId: session.tutor.id,
        tutorName,
        studentId: session.student.id,
        studentName,
        startTime: session.start_time,
        endTime: session.end_time,
        location: session.location,
        notes: session.notes,
        price,
        emailType: 'cancellation'
      }
    });
    
    if (error) {
      throw new Error(`Error invoking send-session-emails function: ${error.message}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending cancellation emails:', error);
    return { 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
