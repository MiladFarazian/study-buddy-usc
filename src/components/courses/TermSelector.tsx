
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
        const response = await supabase
          .from('terms')
          .select('*')
          .order('code', { ascending: false });
        
        if (response.error) {
          console.error('Error fetching terms from database:', response.error);
          
          // Fallback to hardcoded terms
          const fallbackTerms: Term[] = [
            { id: '1', code: '20251', name: 'Spring 2025', is_current: true },
            { id: '2', code: '20252', name: 'Summer 2025', is_current: false },
            { id: '3', code: '20253', name: 'Fall 2025', is_current: false }
          ];
          
          setTerms(fallbackTerms);
        } else if (response.data && response.data.length > 0) {
          // Use a simple approach to avoid type issues
          setTerms(response.data as unknown as Term[]);
        } else {
          // Fallback if database returned empty result
          const fallbackTerms: Term[] = [
            { id: '1', code: '20251', name: 'Spring 2025', is_current: true },
            { id: '2', code: '20252', name: 'Summer 2025', is_current: false },
            { id: '3', code: '20253', name: 'Fall 2025', is_current: false }
          ];
          
          setTerms(fallbackTerms);
        }
      } catch (error) {
        console.error('Error fetching terms:', error);
        
        // Last resort fallback
        const fallbackTerms: Term[] = [
          { id: '1', code: '20251', name: 'Spring 2025', is_current: true },
          { id: '2', code: '20252', name: 'Summer 2025', is_current: false },
          { id: '3', code: '20253', name: 'Fall 2025', is_current: false }
        ];
        
        setTerms(fallbackTerms);
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  // Select the current term if no term is selected and terms are loaded
  useEffect(() => {
    if (!selectedTerm && terms.length > 0) {
      const currentTerm = terms.find(term => term.is_current);
      if (currentTerm) {
        onTermChange(currentTerm.code);
      } else {
        onTermChange(terms[0].code);
      }
    }
  }, [terms, selectedTerm, onTermChange]);

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
