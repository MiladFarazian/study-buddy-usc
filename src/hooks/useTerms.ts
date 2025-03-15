
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
        // Fetch from database
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
            { id: '1', code: '20251', name: 'Spring 2025', is_current: true },
            { id: '2', code: '20252', name: 'Summer 2025', is_current: false },
            { id: '3', code: '20253', name: 'Fall 2025', is_current: false }
          ];
          setTerms(fallbackTerms);
        }
      } catch (err) {
        console.error('Error fetching terms:', err);
        setError(err instanceof Error ? err.message : "Failed to load terms");
        
        // Fallback terms if error
        const fallbackTerms: Term[] = [
          { id: '1', code: '20251', name: 'Spring 2025', is_current: true },
          { id: '2', code: '20252', name: 'Summer 2025', is_current: false },
          { id: '3', code: '20253', name: 'Fall 2025', is_current: false }
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
