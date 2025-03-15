
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
        // Use a direct RPC call to get terms
        const { data, error } = await supabase
          .rpc('query_terms')
          
        if (error) {
          console.error('Error fetching terms:', error);
          return;
        }

        setTerms(data as Term[]);
        
        // If no term is selected, select the current term
        if (!selectedTerm && data && data.length > 0) {
          const currentTerm = data.find((term: Term) => term.is_current);
          if (currentTerm) {
            onTermChange(currentTerm.code);
          } else {
            onTermChange(data[0].code);
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
