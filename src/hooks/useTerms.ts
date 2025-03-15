
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Term } from "@/types/CourseTypes";

export function useTerms() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTerms() {
      setLoading(true);
      setError(null);
      
      try {
        // First try to fetch from the functions endpoint
        try {
          const { data: functionData, error: functionError } = await supabase.functions.invoke('query_terms');
          
          if (!functionError && functionData && functionData.length > 0) {
            setTerms(functionData as Term[]);
            setLoading(false);
            return;
          }
        } catch (functionErr) {
          console.log('Function endpoint unavailable, falling back to database query');
        }
        
        // Fallback to direct database query
        const { data, error } = await supabase
          .from('terms')
          .select('*')
          .order('code', { ascending: false });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setTerms(data as Term[]);
        } else {
          // Fallback terms if empty result
          const fallbackTerms: Term[] = [
            { id: '1', code: '20231', name: 'Spring 2023', is_current: false },
            { id: '2', code: '20232', name: 'Summer 2023', is_current: false },
            { id: '3', code: '20233', name: 'Fall 2023', is_current: true },
            { id: '4', code: '20241', name: 'Spring 2024', is_current: false },
            { id: '5', code: '20242', name: 'Summer 2024', is_current: false },
            { id: '6', code: '20243', name: 'Fall 2024', is_current: false }
          ];
          setTerms(fallbackTerms);
        }
      } catch (err) {
        console.error('Error fetching terms:', err);
        setError(err instanceof Error ? err.message : "Failed to load terms");
        
        // More comprehensive fallback terms if error
        const fallbackTerms: Term[] = [
          { id: '1', code: '20231', name: 'Spring 2023', is_current: false },
          { id: '2', code: '20232', name: 'Summer 2023', is_current: false },
          { id: '3', code: '20233', name: 'Fall 2023', is_current: true },
          { id: '4', code: '20241', name: 'Spring 2024', is_current: false },
          { id: '5', code: '20242', name: 'Summer 2024', is_current: false },
          { id: '6', code: '20243', name: 'Fall 2024', is_current: false }
        ];
        setTerms(fallbackTerms);
      } finally {
        setLoading(false);
      }
    }

    fetchTerms();
  }, []);

  return { terms, loading, error };
}
