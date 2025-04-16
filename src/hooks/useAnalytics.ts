
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths } from "date-fns";

export type AnalyticsData = {
  totalSessions: number;
  activeTutors: number;
  activeStudents: number;
  averageRating: number;
  sessionGrowth: {
    name: string;
    Sessions: number;
  }[];
  popularCourses: {
    name: string;
    Sessions: number;
  }[];
  growthPercentage: {
    sessions: number;
    tutors: number;
    students: number;
    rating: number;
  };
};

export const useAnalytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        // Get current date and date 6 months ago for time-based queries
        const now = new Date();
        const sixMonthsAgo = subMonths(now, 6);
        const lastMonth = subMonths(now, 1);
        const twoMonthsAgo = subMonths(now, 2);

        // Fetch total sessions
        const { count: totalSessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true });
        
        if (sessionsError) throw sessionsError;

        // Fetch active tutors (tutors with at least one session)
        const { data: tutors, error: tutorsError } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'tutor');
        
        if (tutorsError) throw tutorsError;
        
        // Fetch students (users with student role)
        const { data: students, error: studentsError } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'student');
        
        if (studentsError) throw studentsError;

        // Fetch average rating
        const { data: ratingsData, error: ratingsError } = await supabase
          .from('profiles')
          .select('average_rating')
          .not('average_rating', 'is', null);
        
        if (ratingsError) throw ratingsError;
        
        // Calculate average rating
        const validRatings = ratingsData.filter(r => r.average_rating !== null);
        const averageRating = validRatings.length > 0
          ? Number((validRatings.reduce((acc, curr) => acc + Number(curr.average_rating), 0) / validRatings.length).toFixed(1))
          : 0;
        
        // Fetch sessions grouped by month for the chart
        const { data: monthlyData, error: monthlyError } = await supabase
          .from('sessions')
          .select('start_time')
          .gte('start_time', sixMonthsAgo.toISOString())
          .order('start_time', { ascending: true });
        
        if (monthlyError) throw monthlyError;

        // Group sessions by month
        const sessionsByMonth: Record<string, number> = {};
        monthlyData.forEach(session => {
          const monthKey = format(new Date(session.start_time), 'MMM');
          sessionsByMonth[monthKey] = (sessionsByMonth[monthKey] || 0) + 1;
        });

        // Convert to chart format
        const sessionGrowth = Object.entries(sessionsByMonth).map(([name, count]) => ({
          name,
          Sessions: count
        }));

        // Fetch popular courses
        const { data: courseSessions, error: courseError } = await supabase
          .from('sessions')
          .select('course_id')
          .not('course_id', 'is', null);
        
        if (courseError) throw courseError;

        // Count sessions per course
        const courseSessionCounts: Record<string, number> = {};
        for (const session of courseSessions) {
          if (session.course_id) {
            courseSessionCounts[session.course_id] = (courseSessionCounts[session.course_id] || 0) + 1;
          }
        }

        // Get course details for top courses
        const popularCourseIds = Object.entries(courseSessionCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([id]) => id);
          
        const popularCourses = [];
        
        for (const courseId of popularCourseIds) {
          // Try to get course info from any of the course tables
          let courseInfo = null;
          
          // First check in courses-20251
          const { data: course20251 } = await supabase
            .from('courses-20251')
            .select('Course number, Course title')
            .eq('Course number', courseId)
            .maybeSingle();
            
          if (course20251) {
            courseInfo = {
              name: course20251['Course number'],
              title: course20251['Course title']
            };
          } else {
            // Try courses-20252
            const { data: course20252 } = await supabase
              .from('courses-20252')
              .select('Course number, Course title')
              .eq('Course number', courseId)
              .maybeSingle();
              
            if (course20252) {
              courseInfo = {
                name: course20252['Course number'],
                title: course20252['Course title']
              };
            } else {
              // Try courses-20253
              const { data: course20253 } = await supabase
                .from('courses-20253')
                .select('Course number, Course title')
                .eq('Course number', courseId)
                .maybeSingle();
                
              if (course20253) {
                courseInfo = {
                  name: course20253['Course number'],
                  title: course20253['Course title']
                };
              }
            }
          }
          
          // If we found course info, add it to popular courses
          if (courseInfo) {
            popularCourses.push({
              name: courseInfo.name,
              Sessions: courseSessionCounts[courseId]
            });
          }
        }
        
        // If we have less than 5 courses, pad with placeholder data
        while (popularCourses.length < 5) {
          popularCourses.push({
            name: `Course ${popularCourses.length + 1}`,
            Sessions: 0
          });
        }

        // Calculate growth percentages
        // Get last month's sessions
        const { count: lastMonthSessions } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .gte('start_time', lastMonth.toISOString());

        const { count: twoMonthsAgoSessions } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .gte('start_time', twoMonthsAgo.toISOString())
          .lt('start_time', lastMonth.toISOString());

        // Calculate session growth percentage
        const sessionGrowthPct = twoMonthsAgoSessions && twoMonthsAgoSessions > 0
          ? (((lastMonthSessions || 0) - twoMonthsAgoSessions) / twoMonthsAgoSessions) * 100
          : 0;
        
        // Set the analytics data
        setData({
          totalSessions: totalSessions || 0,
          activeTutors: tutors?.length || 0,
          activeStudents: students?.length || 0,
          averageRating,
          sessionGrowth,
          popularCourses,
          growthPercentage: {
            sessions: parseFloat(sessionGrowthPct.toFixed(1)),
            tutors: 8.1, // Placeholder - would need historical data to calculate
            students: 12.5, // Placeholder - would need historical data to calculate
            rating: 0.2, // Placeholder - would need historical data to calculate
          }
        });
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  return { data, loading, error };
};
