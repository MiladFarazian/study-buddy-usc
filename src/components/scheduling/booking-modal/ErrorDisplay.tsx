
import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorDisplayProps {
  message?: string;
  onClose: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message = "No availability found for this tutor.",
  onClose
}) => {
  return (
    <div className="text-center py-8">
      <AlertCircle className="mx-auto h-10 w-10 text-usc-cardinal mb-2" />
      <p className="text-muted-foreground mb-4">
        {message}
      </p>
      <Button variant="outline" onClick={onClose}>
        Close
      </Button>
    </div>
  );
};
