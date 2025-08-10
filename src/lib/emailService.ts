import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { sendNotificationEmailToUserId, getUserNotificationPreferences } from '@/lib/notification-utils';
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

    const sessionType = (session.session_type === 'virtual' || session.session_type === SessionType.VIRTUAL) ? 'virtual' : 'in_person';
    const location = sessionType === 'virtual' ? 'Virtual (Zoom)' : session.location || 'Not specified';
    const zoomJoinUrl = session.zoom_join_url || undefined;
    const zoomMeetingId = session.zoom_meeting_id || undefined;
    const zoomPassword = session.zoom_password || undefined;

    const typeTag = sessionType === 'virtual' ? '[Virtual]' : '[In-Person]';

    // Tutor email – booking confirmation template (resolve email server-side)
    const tutorPrefs = await getUserNotificationPreferences(session.tutor.id);
    console.log('[emailService] Booking confirmation - tutor prefs:', tutorPrefs);
    if (tutorPrefs.bookingNotifications !== false) {
      console.log('[emailService] Sending booking confirmation to tutor by userId', { sessionId: session.id, tutorId: session.tutor.id });
      await sendNotificationEmailToUserId({
        recipientUserId: session.tutor.id,
        recipientName: tutorName || 'Tutor',
        subject: `${typeTag} New Session Booked with ${studentName || 'a student'}`,
        notificationType: 'session_booked',
        data: {
          bookingInfo: {
            studentName: studentName || 'Student',
            date: sessionDate,
            startTime,
            endTime,
            courseName,
            location,
            sessionType,
            zoomJoinUrl,
            zoomMeetingId,
            zoomPassword,
          },
        },
      });
    }

    // Student email – booking confirmation (resolve email server-side)
    const studentPrefs = await getUserNotificationPreferences(session.student.id);
    console.log('[emailService] Booking confirmation - student prefs:', studentPrefs);
    if (studentPrefs.sessionReminders !== false) {
      console.log('[emailService] Sending booking confirmation to student by userId', { sessionId: session.id, studentId: session.student.id });
      await sendNotificationEmailToUserId({
        recipientUserId: session.student.id,
        recipientName: studentName || 'Student',
        subject: `${typeTag} Your Tutoring Session is Confirmed`,
        notificationType: 'session_booked',
        data: {
          bookingInfo: {
            studentName: studentName || 'Student',
            date: sessionDate,
            startTime,
            endTime,
            courseName,
            location,
            sessionType,
            zoomJoinUrl,
            zoomMeetingId,
            zoomPassword,
          },
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

    const sessionType = (session.session_type === 'virtual' || session.session_type === SessionType.VIRTUAL) ? 'virtual' : 'in_person';
    const location = sessionType === 'virtual' ? 'Virtual (Zoom)' : session.location || 'Not specified';
    const zoomJoinUrl = session.zoom_join_url || undefined;
    const zoomMeetingId = session.zoom_meeting_id || undefined;
    const zoomPassword = session.zoom_password || undefined;
    const typeTag = sessionType === 'virtual' ? '[Virtual]' : '[In-Person]';

    // Student reminder (resolve email server-side)
    const studentPrefs = await getUserNotificationPreferences(session.student.id);
    if (studentPrefs.sessionReminders) {
      console.log('[emailService] Sending session reminder to student by userId', { sessionId, studentId: session.student.id });
      await sendNotificationEmailToUserId({
        recipientUserId: session.student.id,
        recipientName: studentName || 'Student',
        subject: `${typeTag} Reminder: Upcoming Tutoring Session`,
        notificationType: 'session_reminder',
        data: { sessionId, sessionDate, tutorName, courseName, location, startTime, endTime, sessionType, zoomJoinUrl, zoomMeetingId, zoomPassword },
      });
    }

    // Tutor reminder (resolve email server-side)
    const tutorPrefs = await getUserNotificationPreferences(session.tutor.id);
    if (tutorPrefs.sessionReminders) {
      console.log('[emailService] Sending session reminder to tutor by userId', { sessionId, tutorId: session.tutor.id });
      await sendNotificationEmailToUserId({
        recipientUserId: session.tutor.id,
        recipientName: tutorName || 'Tutor',
        subject: `${typeTag} Reminder: Upcoming Tutoring Session`,
        notificationType: 'session_reminder',
        data: { sessionId, sessionDate, tutorName: tutorName, courseName, location, startTime, endTime, sessionType, zoomJoinUrl, zoomMeetingId, zoomPassword },
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

    const sessionType = (session.session_type === 'virtual' || session.session_type === SessionType.VIRTUAL) ? 'virtual' : 'in_person';
    const location = sessionType === 'virtual' ? 'Virtual (Zoom)' : session.location || 'Not specified';
    const typeTag = sessionType === 'virtual' ? '[Virtual]' : '[In-Person]';
    const tutorName = `${session.tutor?.first_name || ''} ${session.tutor?.last_name || ''}`.trim();
    const studentName = `${session.student?.first_name || ''} ${session.student?.last_name || ''}`.trim();
    const courseName = session.course_id || 'General tutoring';

    // Tutor (resolve email server-side)
    const tutorPrefs = await getUserNotificationPreferences(session.tutor.id);
    if (tutorPrefs.sessionReminders) {
      console.log('[emailService] Sending cancellation to tutor by userId', { sessionId, tutorId: session.tutor.id });
      await sendNotificationEmailToUserId({
        recipientUserId: session.tutor.id,
        recipientName: tutorName || 'Tutor',
        subject: `${typeTag} Session Cancelled`,
        notificationType: 'session_cancellation',
        data: { sessionDate, startTime, endTime, courseName, location, counterpartName: studentName, sessionType },
      });
    }

    // Student (resolve email server-side)
    const studentPrefs = await getUserNotificationPreferences(session.student.id);
    if (studentPrefs.sessionReminders) {
      console.log('[emailService] Sending cancellation to student by userId', { sessionId, studentId: session.student.id });
      await sendNotificationEmailToUserId({
        recipientUserId: session.student.id,
        recipientName: studentName || 'Student',
        subject: `${typeTag} Session Cancelled`,
        notificationType: 'session_cancellation',
        data: { sessionDate, startTime, endTime, courseName, location, counterpartName: tutorName, sessionType },
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
    const sessionType = (session.session_type === 'virtual' || session.session_type === SessionType.VIRTUAL) ? 'virtual' : 'in_person';
    const location = sessionType === 'virtual' ? 'Virtual (Zoom)' : session.location || 'Not specified';
    const zoomJoinUrl = session.zoom_join_url || undefined;
    const zoomMeetingId = session.zoom_meeting_id || undefined;
    const zoomPassword = session.zoom_password || undefined;
    const typeTag = sessionType === 'virtual' ? '[Virtual]' : '[In-Person]';

    // Tutor (resolve email server-side)
    const tutorPrefs = await getUserNotificationPreferences(session.tutor.id);
    if (tutorPrefs.sessionReminders) {
      console.log('[emailService] Sending reschedule to tutor by userId', { sessionId, tutorId: session.tutor.id });
      await sendNotificationEmailToUserId({
        recipientUserId: session.tutor.id,
        recipientName: tutorName || 'Tutor',
        subject: `${typeTag} Session Rescheduled`,
        notificationType: 'session_reschedule',
        data: { oldDate, oldStartTime, oldEndTime, newDate, newStartTime, newEndTime, courseName, location, sessionType, zoomJoinUrl, zoomMeetingId, zoomPassword },
      });
    }

    // Student (resolve email server-side)
    const studentPrefs = await getUserNotificationPreferences(session.student.id);
    if (studentPrefs.sessionReminders) {
      console.log('[emailService] Sending reschedule to student by userId', { sessionId, studentId: session.student.id });
      await sendNotificationEmailToUserId({
        recipientUserId: session.student.id,
        recipientName: studentName || 'Student',
        subject: `${typeTag} Session Rescheduled`,
        notificationType: 'session_reschedule',
        data: { oldDate, oldStartTime, oldEndTime, newDate, newStartTime, newEndTime, courseName, location, sessionType, zoomJoinUrl, zoomMeetingId, zoomPassword },
      });
    }

    return { success: true } as const;
  } catch (error) {
    console.error('[emailService] sendRescheduleNotification error:', error);
    return { success: false, error: (error as Error).message } as const;
  }
}
