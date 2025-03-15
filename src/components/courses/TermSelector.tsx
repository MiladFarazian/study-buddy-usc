
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Term } from "@/integrations/supabase/types-extension";

interface TermSelectorProps {
  selectedTerm: string;
  onTermChange: (termCode: string) => void;
}

const TermSelector = ({ selectedTerm, onTermChange }: TermSelectorProps) => {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setLoading(true);
        
        // First try to fetch from database
        const { data, error } = await supabase
          .from('terms')
          .select('*')
          .order('code', { ascending: false });
        
        if (error) {
          console.error('Error fetching terms from database:', error);
          
          // Fallback to edge function if database table doesn't exist
          const functionResponse = await supabase.functions.invoke('query_terms');
          
          if (functionResponse.error) {
            console.error('Error fetching terms from function:', functionResponse.error);
            
            // Ultimate fallback: hardcoded terms
            setTerms([
              { id: '1', code: '20251', name: 'Spring 2025', is_current: true },
              { id: '2', code: '20252', name: 'Summer 2025', is_current: false },
              { id: '3', code: '20253', name: 'Fall 2025', is_current: false }
            ]);
          } else {
            setTerms(functionResponse.data as Term[]);
          }
        } else if (data && data.length > 0) {
          setTerms(data as Term[]);
        } else {
          // Fallback if database returned empty result
          setTerms([
            { id: '1', code: '20251', name: 'Spring 2025', is_current: true },
            { id: '2', code: '20252', name: 'Summer 2025', is_current: false },
            { id: '3', code: '20253', name: 'Fall 2025', is_current: false }
          ]);
        }
        
        // If no term is selected, select the current term
        if (!selectedTerm && terms.length > 0) {
          const currentTerm = terms.find(term => term.is_current);
          if (currentTerm) {
            onTermChange(currentTerm.code);
          } else {
            onTermChange(terms[0].code);
          }
        }
      } catch (error) {
        console.error('Error fetching terms:', error);
        
        // Last resort fallback
        setTerms([
          { id: '1', code: '20251', name: 'Spring 2025', is_current: true },
          { id: '2', code: '20252', name: 'Summer 2025', is_current: false },
          { id: '3', code: '20253', name: 'Fall 2025', is_current: false }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, [selectedTerm, onTermChange]);

  return (
    <Select
      value={selectedTerm}
      onValueChange={onTermChange}
      disabled={loading || terms.length === 0}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select Term" />
      </SelectTrigger>
      <SelectContent>
        {terms.map((term) => (
          <SelectItem key={term.id} value={term.code}>
            {term.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TermSelector;
