
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useTerms } from "@/hooks/useTerms";

interface TermSelectorProps {
  selectedTerm: string;
  onTermChange: (termCode: string) => void;
}

const TermSelector = ({ selectedTerm, onTermChange }: TermSelectorProps) => {
  const { terms, loading } = useTerms();

  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">Term:</span>
      <Select
        value={selectedTerm}
        onValueChange={onTermChange}
        disabled={loading || terms.length === 0}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Select Term" />
        </SelectTrigger>
        <SelectContent>
          {terms.map((term) => (
            <SelectItem key={term.id} value={term.code}>
              {term.name} {term.is_current && "(Current)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TermSelector;
