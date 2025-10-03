import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInHours } from "date-fns";

interface TutorAnalyticsData {
  totalSessions: number;
  wouldBookAgain: {
    count: number;
    percentage: number;
  } | null;
  averageRating: number | null;
  totalEarnings: number;
  sessionsByMonth: { month: string; sessions: number; date: Date }[];
  earningsByMonth: { month: string; earnings: number; date: Date }[];
  impactMetrics: {
    avgStressReduction: number;
    avgConfidenceImprovement: number;
    studentsHelped: number;
  } | null;
  topCourses: { course: string; count: number }[];
  students: { id: string; name: string; sessions: number; avatar_url: string | null }[];
}

export const useTutorAnalytics = () => {
  const { user } = useAuth();
  const [data, setData] = useState<TutorAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch sessions (exclude only cancelled sessions)
        const { data: sessions, error: sessionsError } = await supabase
          .from("sessions")
          .select("*")
          .eq("tutor_id", user.id)
          .neq("status", "cancelled")
          .lt("end_time", new Date().toISOString());

        if (sessionsError) throw sessionsError;

        // Calculate total sessions
        const totalSessions = sessions?.length || 0;

        // Get unique active students (students with at least one session)
        const uniqueStudents = [...new Set(sessions?.map(s => s.student_id))];

        // Fetch student reviews for ratings, impact, and would_book_again
        const { data: reviews, error: reviewsError } = await supabase
          .from("student_reviews")
          .select("teaching_quality, stress_before, stress_after, confidence_improvement, would_book_again, student_id")
          .eq("tutor_id", user.id);

        if (reviewsError) throw reviewsError;

        // Calculate would book again metric
        const reviewsWithBookAgain = reviews?.filter(r => r.would_book_again !== null) || [];
        const wouldBookAgainCount = reviewsWithBookAgain.filter(r => r.would_book_again === true).length;
        const wouldBookAgain = reviewsWithBookAgain.length > 0
          ? {
              count: wouldBookAgainCount,
              percentage: (wouldBookAgainCount / reviewsWithBookAgain.length) * 100,
            }
          : null;

        // Calculate average rating
        const averageRating = reviews && reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.teaching_quality || 0), 0) / reviews.length
          : null;

        // Calculate impact metrics
        const impactMetrics = reviews && reviews.length > 0
          ? {
              avgStressReduction: reviews.reduce((sum, r) => sum + ((r.stress_before || 0) - (r.stress_after || 0)), 0) / reviews.length,
              avgConfidenceImprovement: reviews.reduce((sum, r) => sum + (r.confidence_improvement || 0), 0) / reviews.length,
              studentsHelped: uniqueStudents.length,
            }
          : null;

        // Fetch payment transactions for earnings
        const { data: payments, error: paymentsError } = await supabase
          .from("payment_transactions")
          .select("amount, created_at")
          .eq("tutor_id", user.id)
          .eq("status", "completed");

        if (paymentsError) throw paymentsError;

        // Calculate total earnings (convert from cents to dollars)
        const totalEarnings = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) / 100 || 0;

        // Group sessions by month with proper date sorting
        const sessionsByMonthMap = sessions?.reduce((acc: { [key: string]: { count: number; date: Date } }, session) => {
          const date = new Date(session.start_time);
          const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (!acc[month]) {
            acc[month] = { count: 0, date: new Date(date.getFullYear(), date.getMonth(), 1) };
          }
          acc[month].count += 1;
          return acc;
        }, {});

        const sessionsByMonthArray = Object.entries(sessionsByMonthMap || {})
          .map(([month, data]) => ({
            month,
            sessions: data.count,
            date: data.date,
          }))
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        // Group earnings by month with proper date sorting
        const earningsByMonthMap = payments?.reduce((acc: { [key: string]: { earnings: number; date: Date } }, payment) => {
          const date = new Date(payment.created_at);
          const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (!acc[month]) {
            acc[month] = { earnings: 0, date: new Date(date.getFullYear(), date.getMonth(), 1) };
          }
          acc[month].earnings += (payment.amount || 0) / 100;
          return acc;
        }, {});

        const earningsByMonthArray = Object.entries(earningsByMonthMap || {})
          .map(([month, data]) => ({
            month,
            earnings: data.earnings,
            date: data.date,
          }))
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        // Group sessions by course
        const courseCount = sessions?.reduce((acc: { [key: string]: number }, session) => {
          const course = session.course_id || "Other";
          acc[course] = (acc[course] || 0) + 1;
          return acc;
        }, {});

        const topCourses = Object.entries(courseCount || {})
          .map(([course, count]) => ({ course, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Get students
        const { data: studentProfiles, error: studentsError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", uniqueStudents);

        if (studentsError) throw studentsError;

        const students = studentProfiles?.map(student => {
          const sessionCount = sessions?.filter(s => s.student_id === student.id).length || 0;
          return {
            id: student.id,
            name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown',
            sessions: sessionCount,
            avatar_url: student.avatar_url,
          };
        }).sort((a, b) => b.sessions - a.sessions) || [];

        setData({
          totalSessions,
          wouldBookAgain,
          averageRating,
          totalEarnings,
          sessionsByMonth: sessionsByMonthArray,
          earningsByMonth: earningsByMonthArray,
          impactMetrics,
          topCourses,
          students,
        });
      } catch (err) {
        console.error("Error fetching tutor analytics:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  return { data, loading, error };
};
