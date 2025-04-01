
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface NoAvailabilityDisplayProps {
  reason: string;
  onRetry?: () => void;
  onLogin?: () => void;
}

export const NoAvailabilityDisplay: React.FC<NoAvailabilityDisplayProps> = ({
  reason,
  onRetry,
  onLogin
}) => {
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Availability</h3>
          <p className="text-muted-foreground max-w-md mb-4">{reason}</p>
          
          <div className="flex space-x-4">
            {onRetry && (
              <Button 
                variant="outline" 
                onClick={onRetry}
                className="flex items-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            
            {onLogin && (
              <Button 
                variant="outline" 
                onClick={onLogin}
                className="flex items-center"
              >
                Log In
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
