
import { Button } from "@/components/ui/button";
import { TimeSelector } from "@/lib/scheduling/ui/TimeSelector";

interface TimeStepProps {
  timeSlots: Array<{ time: string; available: boolean }>;
  selectedTime: string | null;
  onTimeChange: (time: string) => void;
  onContinue: () => void;
}

export function TimeStep({ 
  timeSlots, 
  selectedTime, 
  onTimeChange,
  onContinue 
}: TimeStepProps) {
  return (
    <>
      <TimeSelector 
        timeSlots={timeSlots}
        selectedTime={selectedTime}
        onTimeChange={onTimeChange}
      />
      
      <div className="mt-8 flex justify-end">
        <Button 
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
          disabled={!selectedTime}
          onClick={onContinue}
        >
          Continue
        </Button>
      </div>
    </>
  );
}
