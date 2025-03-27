
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

export interface DurationOption {
  minutes: number;
  cost: number;
}

interface DurationSelectorProps {
  options: DurationOption[];
  selectedDuration: number | null;
  onSelectDuration: (minutes: number) => void;
  hourlyRate: number;
}

export function DurationSelector({ 
  options, 
  selectedDuration, 
  onSelectDuration,
  hourlyRate
}: DurationSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Select Session Duration</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
        {options.map((option) => (
          <Button
            key={option.minutes}
            variant="outline"
            className={cn(
              "h-32 flex flex-col items-center justify-center p-6 border rounded-md",
              selectedDuration === option.minutes 
                ? "bg-red-50 border-usc-cardinal text-usc-cardinal" 
                : "bg-white hover:bg-gray-50"
            )}
            onClick={() => onSelectDuration(option.minutes)}
          >
            <span className="text-xl font-bold mb-2">
              {option.minutes} minutes
            </span>
            <span className="text-xl text-muted-foreground">
              ${option.cost}
            </span>
          </Button>
        ))}
      </div>
      
      <p className="text-sm text-muted-foreground">
        Rate: ${hourlyRate}/hour
      </p>
    </div>
  );
}
