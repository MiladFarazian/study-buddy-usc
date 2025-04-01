
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { memo } from "react";

interface SlotSelectionFooterProps {
  onProceed: () => void;
  onCancel: () => void;
  isLoading: boolean;
  isDisabled: boolean;
}

export const SlotSelectionFooter = memo(({
  onProceed,
  onCancel,
  isLoading,
  isDisabled
}: SlotSelectionFooterProps) => {
  return (
    <div className="flex justify-between items-center pt-4 mt-4 border-t">
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isLoading}
      >
        Cancel
      </Button>
      
      <Button
        onClick={onProceed}
        disabled={isDisabled || isLoading}
        className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing
          </>
        ) : (
          "Book Session"
        )}
      </Button>
    </div>
  );
});

// Add display name for debugging
SlotSelectionFooter.displayName = "SlotSelectionFooter";
