import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInHours } from "date-fns";

interface StudentAnalyticsData {
  totalSessions: number;
  hoursStudied: number;
  stressReduction: number | null;
  totalSpent: number;
  sessionsByMonth: { month: string; sessions: number }[];
  wellnessData: {
    stressBefore: number;
    stressAfter: number;
    confidenceImprovement: number;
    anxietyReduction: number;
  } | null;
  favoriteSubjects: { course: string; count: number }[];
  tutors: { id: string; name: string; sessions: number; avatar_url: string | null }[];
}

export const useStudentAnalytics = () => {
  const { user } = useAuth();
  const [data, setData] = useState<StudentAnalyticsData | null>(null);
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

        // Fetch sessions
        const { data: sessions, error: sessionsError } = await supabase
          .from("sessions")
          .select("*")
          .eq("student_id", user.id)
          .eq("status", "completed");

        if (sessionsError) throw sessionsError;

        // Calculate total sessions
        const totalSessions = sessions?.length || 0;

        // Calculate hours studied
        const hoursStudied = sessions?.reduce((total, session) => {
          const hours = differenceInHours(new Date(session.end_time), new Date(session.start_time));
          return total + hours;
        }, 0) || 0;

        // Fetch student reviews for wellness data
        const { data: reviews, error: reviewsError } = await supabase
          .from("student_reviews")
          .select("stress_before, stress_after, confidence_improvement, learning_anxiety_reduction")
          .eq("student_id", user.id);

        if (reviewsError) throw reviewsError;

        // Calculate stress reduction
        const stressReduction = reviews && reviews.length > 0
          ? reviews.reduce((sum, r) => sum + ((r.stress_before || 0) - (r.stress_after || 0)), 0) / reviews.length
          : null;

        // Calculate wellness data
        const wellnessData = reviews && reviews.length > 0
          ? {
              stressBefore: reviews.reduce((sum, r) => sum + (r.stress_before || 0), 0) / reviews.length,
              stressAfter: reviews.reduce((sum, r) => sum + (r.stress_after || 0), 0) / reviews.length,
              confidenceImprovement: reviews.reduce((sum, r) => sum + (r.confidence_improvement || 0), 0) / reviews.length,
              anxietyReduction: reviews.reduce((sum, r) => sum + (r.learning_anxiety_reduction || 0), 0) / reviews.length,
            }
          : null;

        // Fetch payment transactions
        const { data: payments, error: paymentsError } = await supabase
          .from("payment_transactions")
          .select("amount")
          .eq("student_id", user.id)
          .eq("status", "completed");

        if (paymentsError) throw paymentsError;

        // Calculate total spent (convert from cents to dollars)
        const totalSpent = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) / 100 || 0;

        // Group sessions by month
        const sessionsByMonth = sessions?.reduce((acc: { [key: string]: number }, session) => {
          const month = new Date(session.start_time).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {});

        const sessionsByMonthArray = Object.entries(sessionsByMonth || {}).map(([month, sessions]) => ({
          month,
          sessions: sessions as number,
        }));

        // Group sessions by course
        const courseCount = sessions?.reduce((acc: { [key: string]: number }, session) => {
          const course = session.course_id || "Other";
          acc[course] = (acc[course] || 0) + 1;
          return acc;
        }, {});

        const favoriteSubjects = Object.entries(courseCount || {})
          .map(([course, count]) => ({ course, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Get tutors
        const tutorIds = [...new Set(sessions?.map(s => s.tutor_id))];
        const { data: tutorProfiles, error: tutorsError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", tutorIds);

        if (tutorsError) throw tutorsError;

        const tutors = tutorProfiles?.map(tutor => {
          const sessionCount = sessions?.filter(s => s.tutor_id === tutor.id).length || 0;
          return {
            id: tutor.id,
            name: `${tutor.first_name || ''} ${tutor.last_name || ''}`.trim() || 'Unknown',
            sessions: sessionCount,
            avatar_url: tutor.avatar_url,
          };
        }).sort((a, b) => b.sessions - a.sessions) || [];

        setData({
          totalSessions,
          hoursStudied,
          stressReduction,
          totalSpent,
          sessionsByMonth: sessionsByMonthArray,
          wellnessData,
          favoriteSubjects,
          tutors,
        });
      } catch (err) {
        console.error("Error fetching student analytics:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  return { data, loading, error };
};
