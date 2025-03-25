
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export const NoAvailabilityDisplay: React.FC = () => {
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Availability Set</h3>
          <p className="text-muted-foreground max-w-md">
            This tutor hasn't set their availability yet. Please check back later or try another tutor.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
