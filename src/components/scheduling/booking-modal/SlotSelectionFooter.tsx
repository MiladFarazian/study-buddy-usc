
import { Button } from "@/components/ui/button";

interface SlotSelectionFooterProps {
  disableContinue: boolean;
  disabled: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export function SlotSelectionFooter({
  disableContinue,
  disabled,
  onClose,
  onContinue
}: SlotSelectionFooterProps) {
  return (
    <div className="flex items-center justify-between mt-6">
      <Button 
        variant="outline" 
        onClick={onClose} 
        disabled={disabled}
      >
        Cancel
      </Button>
      <Button 
        onClick={onContinue} 
        disabled={disableContinue || disabled}
        className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
      >
        Continue
      </Button>
    </div>
  );
}
