
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from '@/components/ui/button';

interface NoAvailabilityDisplayProps {
  reason?: string;
  onRetry?: () => void;
}

export const NoAvailabilityDisplay: React.FC<NoAvailabilityDisplayProps> = ({ 
  reason,
  onRetry
}) => {
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Availability Set</h3>
          <p className="text-muted-foreground max-w-md mb-4">
            {reason || "This tutor hasn't set their availability yet. Please check back later or try another tutor."}
          </p>
          {onRetry && (
            <Button 
              variant="outline" 
              onClick={onRetry}
              className="mt-2"
            >
              Retry Loading
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
