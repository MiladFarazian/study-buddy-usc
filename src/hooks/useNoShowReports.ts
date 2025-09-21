import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { subDays } from "date-fns";

interface NoShowReport {
  id: string;
  start_time: string;
  no_show_report: string;
  course_id: string;
  created_at: string;
  tutor: {
    id: string;
    first_name: string;
    last_name: string;
  };
  student: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface SummaryStats {
  totalReports: number;
  topProblematicTutors: Array<{
    id: string;
    name: string;
    reportCount: number;
  }>;
  recentActivity: {
    last7Days: number;
    last30Days: number;
  };
}

export const useNoShowReports = () => {
  const [reports, setReports] = useState<NoShowReport[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalReports: 0,
    topProblematicTutors: [],
    recentActivity: { last7Days: 0, last30Days: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'7days' | '30days' | 'all'>('all');
  const [showResolved, setShowResolved] = useState(false);
  const { toast } = useToast();

  const fetchNoShowReports = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('sessions')
        .select(`
          id,
          start_time,
          no_show_report,
          course_id,
          created_at,
          tutor_id,
          student_id
        `);

      // Filter by resolved/unresolved status
      if (!showResolved) {
        query = query.not('no_show_report', 'is', null);
      } else {
        // For showing resolved, we need a different approach since we clear the field
        // For now, just show unresolved
        query = query.not('no_show_report', 'is', null);
      }

      // Apply date filter
      if (dateFilter !== 'all') {
        const daysBack = dateFilter === '7days' ? 7 : 30;
        const cutoffDate = subDays(new Date(), daysBack).toISOString();
        query = query.gte('created_at', cutoffDate);
      }

      const { data: sessionsData, error: sessionsError } = await query
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      if (!sessionsData || sessionsData.length === 0) {
        setReports([]);
        setSummaryStats({
          totalReports: 0,
          topProblematicTutors: [],
          recentActivity: { last7Days: 0, last30Days: 0 }
        });
        return;
      }

      // Fetch tutor and student profiles
      const tutorIds = [...new Set(sessionsData.map(s => s.tutor_id))];
      const studentIds = [...new Set(sessionsData.map(s => s.student_id))];

      const [tutorProfiles, studentProfiles] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', tutorIds),
        supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', studentIds)
      ]);

      if (tutorProfiles.error) throw tutorProfiles.error;
      if (studentProfiles.error) throw studentProfiles.error;

      // Create lookup maps
      const tutorMap = new Map(tutorProfiles.data?.map(t => [t.id, t]) || []);
      const studentMap = new Map(studentProfiles.data?.map(s => [s.id, s]) || []);

      // Combine data
      const reportsWithProfiles = sessionsData
        .filter(session => tutorMap.has(session.tutor_id) && studentMap.has(session.student_id))
        .map(session => ({
          ...session,
          tutor: tutorMap.get(session.tutor_id)!,
          student: studentMap.get(session.student_id)!,
        }));

      setReports(reportsWithProfiles);

      // Calculate summary stats
      await calculateSummaryStats(reportsWithProfiles);

    } catch (error) {
      console.error('Error fetching no-show reports:', error);
      toast({
        title: "Error",
        description: "Failed to fetch no-show reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSummaryStats = async (currentReports: NoShowReport[]) => {
    try {
      // Get all no-show reports for statistics (regardless of current filter)
      const { data: allReportsData } = await supabase
        .from('sessions')
        .select('tutor_id, created_at')
        .not('no_show_report', 'is', null);

      const last7Days = subDays(new Date(), 7);
      const last30Days = subDays(new Date(), 30);

      const recentActivity = {
        last7Days: allReportsData?.filter(r => new Date(r.created_at) >= last7Days).length || 0,
        last30Days: allReportsData?.filter(r => new Date(r.created_at) >= last30Days).length || 0,
      };

      // Calculate tutor report counts
      const tutorReportCounts = new Map<string, number>();
      allReportsData?.forEach(report => {
        const count = tutorReportCounts.get(report.tutor_id) || 0;
        tutorReportCounts.set(report.tutor_id, count + 1);
      });

      // Get top problematic tutors
      const topTutorIds = Array.from(tutorReportCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tutorId]) => tutorId);

      if (topTutorIds.length > 0) {
        const { data: topTutorProfiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', topTutorIds);

        const topProblematicTutors = topTutorIds.map(tutorId => {
          const profile = topTutorProfiles?.find(p => p.id === tutorId);
          return {
            id: tutorId,
            name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
            reportCount: tutorReportCounts.get(tutorId) || 0
          };
        });

        setSummaryStats({
          totalReports: currentReports.length,
          topProblematicTutors,
          recentActivity
        });
      } else {
        setSummaryStats({
          totalReports: currentReports.length,
          topProblematicTutors: [],
          recentActivity
        });
      }
    } catch (error) {
      console.error('Error calculating summary stats:', error);
    }
  };

  useEffect(() => {
    fetchNoShowReports();
  }, [dateFilter, showResolved]);

  return {
    reports,
    summaryStats,
    loading,
    dateFilter,
    setDateFilter,
    showResolved,
    setShowResolved,
    refetch: fetchNoShowReports
  };
};