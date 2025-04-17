
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface StepNavigationProps {
  onBack: () => void;
  backLabel?: string;
}

export function StepNavigation({ onBack, backLabel = "Back" }: StepNavigationProps) {
  return (
    <div className="mb-6">
      <Button variant="ghost" onClick={onBack} className="pl-0">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {backLabel}
      </Button>
    </div>
  );
}
