
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
        // Use a direct SQL query to get terms
        const { data, error } = await supabase
          .rpc('query_terms')
          .then(response => {
            if (response.error) throw response.error;
            return { data: response.data as Term[], error: null };
          })
          .catch(error => {
            console.error('Error executing query_terms RPC:', error);
            
            // Fallback: Try a direct query to the terms table
            return supabase.from('terms')
              .select('*')
              .order('code', { ascending: false });
          });

        if (error) {
          console.error('Error fetching terms:', error);
          return;
        }

        // Cast the data to Term[] type
        setTerms(data as Term[]);
        
        // If no term is selected, select the current term
        if (!selectedTerm && data.length > 0) {
          const currentTerm = data.find(term => (term as any).is_current);
          if (currentTerm) {
            onTermChange((currentTerm as Term).code);
          } else {
            onTermChange((data[0] as Term).code);
          }
        }
      } catch (error) {
        console.error('Error fetching terms:', error);
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
