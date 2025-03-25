
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
    <div className="flex justify-end gap-2 mt-4 pt-2">
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button 
        onClick={onProceed} 
        disabled={isDisabled || isLoading} 
        className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Proceed to Payment'
        )}
      </Button>
    </div>
  );
};
