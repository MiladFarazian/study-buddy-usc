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

    const { adminEmail, dateFilter, showResolved } = await req.json();
    
    // Verify admin credentials
    if (adminEmail !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Fetching no-show reports with filters:', { dateFilter, showResolved });

    // Build query for no-show reports
    let query = supabaseAdmin
      .from('sessions')
      .select(`
        *,
        tutor:profiles!sessions_tutor_id_fkey(id, first_name, last_name),
        student:profiles!sessions_student_id_fkey(id, first_name, last_name)
      `)
      .not('no_show_report', 'is', null)
      .neq('no_show_report', '');

    // Apply date filter
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }

      query = query.gte('created_at', startDate.toISOString());
    }

    query = query.order('created_at', { ascending: false });

    const { data: reports, error } = await query;

    if (error) {
      console.error('Error fetching no-show reports:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${reports?.length || 0} no-show reports`);

    // Calculate summary stats
    const totalReports = reports?.length || 0;
    const recentReports = reports?.filter(r => {
      const reportDate = new Date(r.created_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return reportDate >= weekAgo;
    }).length || 0;

    // Get top problematic tutors
    const tutorCounts: Record<string, { count: number; name: string }> = {};
    reports?.forEach(report => {
      if (report.tutor?.id) {
        const tutorId = report.tutor.id;
        const tutorName = `${report.tutor.first_name || ''} ${report.tutor.last_name || ''}`.trim();
        tutorCounts[tutorId] = tutorCounts[tutorId] || { count: 0, name: tutorName };
        tutorCounts[tutorId].count++;
      }
    });

    const topTutors = Object.entries(tutorCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 3)
      .map(([id, data]) => ({ id, name: data.name, count: data.count }));

    const summaryStats = {
      totalReports,
      recentReports,
      topTutors
    };

    return new Response(JSON.stringify({ reports, summaryStats }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in admin-no-show-reports function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);