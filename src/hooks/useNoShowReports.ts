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
  topTutors: Array<{
    id: string;
    name: string;
    count: number;
  }>;
  recentReports: number;
}

export const useNoShowReports = () => {
  const [reports, setReports] = useState<NoShowReport[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalReports: 0,
    topTutors: [],
    recentReports: 0
  });
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'7days' | '30days' | 'all'>('all');
  const [showResolved, setShowResolved] = useState(false);
  const { toast } = useToast();

  const fetchNoShowReports = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching no-show reports directly from DB...');

      // Build base query for sessions with a no_show_report
      let query = supabase
        .from('sessions')
        .select(`
          id,
          start_time,
          no_show_report,
          course_id,
          created_at,
          tutor_id,
          student_id,
          tutor_first_name,
          tutor_last_name,
          student_first_name,
          student_last_name
        `)
        .not('no_show_report', 'is', null)
        .order('created_at', { ascending: false });

      // Apply date filter if needed
      if (dateFilter !== 'all') {
        const days = dateFilter === '7days' ? 7 : 30;
        const fromIso = subDays(new Date(), days).toISOString();
        query = query.gte('created_at', fromIso);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Map to previously expected shape (with nested tutor/student)
      const mapped = (data as any[] | null)?.map((r: any) => ({
        id: r.id,
        start_time: r.start_time,
        no_show_report: r.no_show_report,
        course_id: r.course_id,
        created_at: r.created_at,
        tutor: {
          id: r.tutor_id,
          first_name: r.tutor_first_name || '',
          last_name: r.tutor_last_name || '',
        },
        student: {
          id: r.student_id,
          first_name: r.student_first_name || '',
          last_name: r.student_last_name || '',
        },
      })) ?? [];

      setReports(mapped);

      // Compute simple summary stats
      const totalReports = mapped.length;
      const recentReports = mapped.filter((r) => new Date(r.created_at) >= subDays(new Date(), 7)).length;

      const tutorCounts = new Map<string, { id: string; name: string; count: number }>();
      for (const r of mapped) {
        const key = r.tutor.id;
        const name = `${r.tutor.first_name} ${r.tutor.last_name}`.trim();
        const entry = tutorCounts.get(key) || { id: key, name, count: 0 };
        entry.count += 1;
        tutorCounts.set(key, entry);
      }
      const topTutors = Array.from(tutorCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      setSummaryStats({ totalReports, topTutors, recentReports });
    } catch (error) {
      console.error('Error fetching no-show reports (direct DB):', error);
      toast({
        title: "Error",
        description: "Failed to fetch no-show reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Summary stats are now calculated in the edge function

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