
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SlotSelectionFooterProps {
  onProceed: () => void;
  onCancel: () => void;
  isLoading: boolean;
  isDisabled: boolean;
}

export const SlotSelectionFooter = ({ 
  onProceed, 
  onCancel, 
  isLoading, 
  isDisabled 
}: SlotSelectionFooterProps) => {
  return (
    <div className="flex justify-between gap-2 mt-6 pt-2 border-t">
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button 
        onClick={onProceed} 
        disabled={isDisabled || isLoading} 
        className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white min-w-[140px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Confirm Booking'
        )}
      </Button>
    </div>
  );
};
