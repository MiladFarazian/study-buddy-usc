
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogIn } from "lucide-react";

interface NoAvailabilityDisplayProps {
  reason: string;
  onRetry: () => void;
  onLogin: () => void;
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
          <h3 className="text-lg font-medium mb-2">No Availability</h3>
          <p className="text-muted-foreground max-w-md mb-4">{reason}</p>
          <div className="flex space-x-4 mt-2">
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={onLogin} variant="default" className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white">
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
