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
      console.log('🔍 Fetching no-show reports via edge function...');
      
      // Call admin edge function to fetch no-show reports
      const { data, error } = await supabase.functions.invoke('admin-no-show-reports', {
        body: {
          adminEmail: 'noah@studybuddyusc.com', // In production, get from admin auth context
          dateFilter: dateFilter === '7days' ? 'week' : dateFilter === '30days' ? 'month' : 'all',
          showResolved
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      console.log('📊 Edge function result:', data);

      setReports(data?.reports || []);
      setSummaryStats(data?.summaryStats || {
        totalReports: 0,
        topTutors: [],
        recentReports: 0
      });

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