
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorDisplayProps {
  message: string;
  onClose: () => void;
}

export const ErrorDisplay = ({ message, onClose }: ErrorDisplayProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertCircle className="h-10 w-10 text-destructive mb-4" />
      <h3 className="text-lg font-medium mb-2">Availability Not Found</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {message}
      </p>
      <Button variant="outline" onClick={onClose}>
        Close
      </Button>
    </div>
  );
};
