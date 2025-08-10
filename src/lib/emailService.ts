import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { sendNotificationEmail, getUserNotificationPreferences } from '@/lib/notification-utils';
import { SessionType } from '@/lib/scheduling/types/booking';

// Simple initializer – edge function + Resend are configured via Supabase secrets
export function createEmailService() {
  return {
    provider: 'resend',
    status: 'ready',
  } as const;
}

// Helper to fetch session with tutor/student profile
async function fetchSession(sessionId: string) {
  const { data: session, error } = await supabase
    .from('sessions')
    .select(
      `*,
       tutor:profiles!sessions_tutor_id_fkey(id, first_name, last_name),
       student:profiles!sessions_student_id_fkey(id, first_name, last_name)`
    )
    .eq('id', sessionId)
    .single();
  if (error) throw new Error(`Error fetching session: ${error.message}`);
  if (!session) throw new Error('Session not found');
  return session as any;
}

// Helper to get user email via admin API (consistent with current project usage)
async function getUserEmail(userId: string) {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) throw new Error(`Error fetching user by id: ${error.message}`);
  return data?.user?.email || '';
}

function fmtDate(date: Date) {
  return format(date, 'EEEE, MMMM d, yyyy');
}
function fmtTime(date: Date) {
  return format(date, 'h:mm a');
}

export async function sendBookingConfirmation(sessionId: string) {
  try {
    const session = await fetchSession(sessionId);

    const start = new Date(session.start_time);
    const end = new Date(session.end_time);

    const sessionDate = fmtDate(start);
    const startTime = fmtTime(start);
    const endTime = fmtTime(end);

    const tutorName = `${session.tutor?.first_name || ''} ${session.tutor?.last_name || ''}`.trim();
    const studentName = `${session.student?.first_name || ''} ${session.student?.last_name || ''}`.trim();
    const courseName = session.course_id || 'General tutoring';
    const location = session.session_type === 'virtual' || session.session_type === SessionType.VIRTUAL
      ? 'Virtual (Zoom)'
      : session.location || 'Not specified';

    // Tutor email – booking confirmation template
    const tutorEmail = await getUserEmail(session.tutor.id);
    const tutorPrefs = await getUserNotificationPreferences(session.tutor.id);
    if (tutorEmail && tutorPrefs.bookingNotifications !== false) {
      await sendNotificationEmail({
        recipientEmail: tutorEmail,
        recipientName: tutorName || 'Tutor',
        subject: `New Session Booked with ${studentName || 'a student'}`,
        notificationType: 'session_booked',
        data: {
          bookingInfo: {
            studentName: studentName || 'Student',
            date: sessionDate,
            startTime,
            endTime,
            courseName,
            location,
          },
        },
      });
    }

    // Student email – confirmation using reminder template for now
    const studentEmail = await getUserEmail(session.student.id);
    const studentPrefs = await getUserNotificationPreferences(session.student.id);
    if (studentEmail && studentPrefs.sessionReminders !== false) {
      await sendNotificationEmail({
        recipientEmail: studentEmail,
        recipientName: studentName || 'Student',
        subject: 'Your Tutoring Session is Confirmed',
        notificationType: 'session_reminder',
        data: {
          sessionId,
          sessionDate,
          tutorName: tutorName || 'Your tutor',
          courseName,
          location,
          startTime,
          endTime,
        },
      });
    }

    return { success: true } as const;
  } catch (error) {
    console.error('[emailService] sendBookingConfirmation error:', error);
    return { success: false, error: (error as Error).message } as const;
  }
}

export async function sendSessionReminder(sessionId: string) {
  try {
    const session = await fetchSession(sessionId);
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);

    const sessionDate = fmtDate(start);
    const startTime = fmtTime(start);
    const endTime = fmtTime(end);

    const tutorName = `${session.tutor?.first_name || ''} ${session.tutor?.last_name || ''}`.trim();
    const studentName = `${session.student?.first_name || ''} ${session.student?.last_name || ''}`.trim();
    const courseName = session.course_id || 'General tutoring';
    const location = session.session_type === 'virtual' || session.session_type === SessionType.VIRTUAL
      ? 'Virtual (Zoom)'
      : session.location || 'Not specified';

    // Student reminder
    const studentEmail = await getUserEmail(session.student.id);
    const studentPrefs = await getUserNotificationPreferences(session.student.id);
    if (studentEmail && studentPrefs.sessionReminders) {
      await sendNotificationEmail({
        recipientEmail: studentEmail,
        recipientName: studentName || 'Student',
        subject: 'Reminder: Upcoming Tutoring Session',
        notificationType: 'session_reminder',
        data: { sessionId, sessionDate, tutorName, courseName, location, startTime, endTime },
      });
    }

    // Tutor reminder
    const tutorEmail = await getUserEmail(session.tutor.id);
    const tutorPrefs = await getUserNotificationPreferences(session.tutor.id);
    if (tutorEmail && tutorPrefs.sessionReminders) {
      await sendNotificationEmail({
        recipientEmail: tutorEmail,
        recipientName: tutorName || 'Tutor',
        subject: 'Reminder: Upcoming Tutoring Session',
        notificationType: 'session_reminder',
        data: { sessionId, sessionDate, tutorName: tutorName, courseName, location, startTime, endTime },
      });
    }

    return { success: true } as const;
  } catch (error) {
    console.error('[emailService] sendSessionReminder error:', error);
    return { success: false, error: (error as Error).message } as const;
  }
}

export async function sendCancellationNotification(sessionId: string) {
  try {
    const session = await fetchSession(sessionId);
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);

    const sessionDate = fmtDate(start);
    const startTime = fmtTime(start);
    const endTime = fmtTime(end);

    const tutorName = `${session.tutor?.first_name || ''} ${session.tutor?.last_name || ''}`.trim();
    const studentName = `${session.student?.first_name || ''} ${session.student?.last_name || ''}`.trim();
    const courseName = session.course_id || 'General tutoring';
    const location = session.session_type === 'virtual' || session.session_type === SessionType.VIRTUAL
      ? 'Virtual (Zoom)'
      : session.location || 'Not specified';

    // Tutor
    const tutorEmail = await getUserEmail(session.tutor.id);
    const tutorPrefs = await getUserNotificationPreferences(session.tutor.id);
    if (tutorEmail && tutorPrefs.sessionReminders) {
      await sendNotificationEmail({
        recipientEmail: tutorEmail,
        recipientName: tutorName || 'Tutor',
        subject: 'Session Cancelled',
        notificationType: 'session_cancellation',
        data: { sessionDate, startTime, endTime, courseName, location, counterpartName: studentName },
      });
    }

    // Student
    const studentEmail = await getUserEmail(session.student.id);
    const studentPrefs = await getUserNotificationPreferences(session.student.id);
    if (studentEmail && studentPrefs.sessionReminders) {
      await sendNotificationEmail({
        recipientEmail: studentEmail,
        recipientName: studentName || 'Student',
        subject: 'Session Cancelled',
        notificationType: 'session_cancellation',
        data: { sessionDate, startTime, endTime, courseName, location, counterpartName: tutorName },
      });
    }

    return { success: true } as const;
  } catch (error) {
    console.error('[emailService] sendCancellationNotification error:', error);
    return { success: false, error: (error as Error).message } as const;
  }
}

export async function sendRescheduleNotification(
  sessionId: string,
  opts?: { oldStartTime?: string; oldEndTime?: string }
) {
  try {
    const session = await fetchSession(sessionId);

    const oldStart = opts?.oldStartTime ? new Date(opts.oldStartTime) : new Date(session.start_time);
    const oldEnd = opts?.oldEndTime ? new Date(opts.oldEndTime) : new Date(session.end_time);
    const newStart = new Date(session.start_time);
    const newEnd = new Date(session.end_time);

    const oldDate = fmtDate(oldStart);
    const oldStartTime = fmtTime(oldStart);
    const oldEndTime = fmtTime(oldEnd);
    const newDate = fmtDate(newStart);
    const newStartTime = fmtTime(newStart);
    const newEndTime = fmtTime(newEnd);

    const tutorName = `${session.tutor?.first_name || ''} ${session.tutor?.last_name || ''}`.trim();
    const studentName = `${session.student?.first_name || ''} ${session.student?.last_name || ''}`.trim();
    const courseName = session.course_id || 'General tutoring';
    const location = session.session_type === 'virtual' || session.session_type === SessionType.VIRTUAL
      ? 'Virtual (Zoom)'
      : session.location || 'Not specified';

    // Tutor
    const tutorEmail = await getUserEmail(session.tutor.id);
    const tutorPrefs = await getUserNotificationPreferences(session.tutor.id);
    if (tutorEmail && tutorPrefs.sessionReminders) {
      await sendNotificationEmail({
        recipientEmail: tutorEmail,
        recipientName: tutorName || 'Tutor',
        subject: 'Session Rescheduled',
        notificationType: 'session_reschedule',
        data: { oldDate, oldStartTime, oldEndTime, newDate, newStartTime, newEndTime, courseName, location },
      });
    }

    // Student
    const studentEmail = await getUserEmail(session.student.id);
    const studentPrefs = await getUserNotificationPreferences(session.student.id);
    if (studentEmail && studentPrefs.sessionReminders) {
      await sendNotificationEmail({
        recipientEmail: studentEmail,
        recipientName: studentName || 'Student',
        subject: 'Session Rescheduled',
        notificationType: 'session_reschedule',
        data: { oldDate, oldStartTime, oldEndTime, newDate, newStartTime, newEndTime, courseName, location },
      });
    }

    return { success: true } as const;
  } catch (error) {
    console.error('[emailService] sendRescheduleNotification error:', error);
    return { success: false, error: (error as Error).message } as const;
  }
}
