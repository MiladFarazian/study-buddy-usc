
import { Button } from "@/components/ui/button";
import { BookingSummary } from "@/lib/scheduling/ui/BookingSummary";

interface ConfirmationStepProps {
  selectedDate: Date;
  selectedTime: string;
  selectedDuration: number;
  cost: number;
  notes: string;
  onNotesChange: (notes: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  creating: boolean;
}

export function ConfirmationStep({
  selectedDate,
  selectedTime,
  selectedDuration,
  cost,
  notes,
  onNotesChange,
  onBack,
  onConfirm,
  creating
}: ConfirmationStepProps) {
  return (
    <>
      <BookingSummary 
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        durationMinutes={selectedDuration}
        cost={cost}
        notes={notes}
        onNotesChange={onNotesChange}
      />
      
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={creating}>
          Back
        </Button>
        <Button 
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
          onClick={onConfirm}
          disabled={creating}
        >
          {creating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            "Confirm Booking"
          )}
        </Button>
      </div>
    </>
  );
}
