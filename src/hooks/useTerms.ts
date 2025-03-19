
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Term } from "@/types/CourseTypes";

export function useTerms() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTerm, setCurrentTerm] = useState<string>("");

  useEffect(() => {
    async function fetchTerms() {
      setLoading(true);
      setError(null);
      
      try {
        // Direct database query for terms
        const { data, error } = await supabase
          .from('terms')
          .select('*')
          .order('code', { ascending: false });
        
        if (error) throw error;
        
        let termsList: Term[];
        
        if (data && data.length > 0) {
          termsList = data as Term[];
        } else {
          // Fallback terms if database is empty
          termsList = [
            { id: '1', code: '20251', name: 'Spring 2025', is_current: true },
            { id: '2', code: '20252', name: 'Summer 2025', is_current: false },
            { id: '3', code: '20253', name: 'Fall 2025', is_current: false }
          ];
        }
        
        setTerms(termsList);
        
        // Set current term
        const current = termsList.find(term => term.is_current);
        if (current) {
          setCurrentTerm(current.code);
        } else if (termsList.length > 0) {
          // Default to the first term if no current term is marked
          setCurrentTerm(termsList[0].code);
        }
      } catch (err) {
        console.error('Error fetching terms:', err);
        setError(err instanceof Error ? err.message : "Failed to load terms");
        
        // More comprehensive fallback terms if error
        const fallbackTerms: Term[] = [
          { id: '1', code: '20251', name: 'Spring 2025', is_current: true },
          { id: '2', code: '20252', name: 'Summer 2025', is_current: false },
          { id: '3', code: '20253', name: 'Fall 2025', is_current: false }
        ];
        setTerms(fallbackTerms);
        setCurrentTerm('20251'); // Default to Spring 2025
      } finally {
        setLoading(false);
      }
    }

    fetchTerms();
  }, []);

  return { terms, currentTerm, loading, error };
}
