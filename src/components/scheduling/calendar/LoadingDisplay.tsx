
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface LoadingDisplayProps {
  message?: string;
}

export const LoadingDisplay: React.FC<LoadingDisplayProps> = ({ 
  message = "Loading..." 
}) => {
  return (
    <Card className="w-full">
      <CardContent className="py-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2">{message}</span>
        </div>
      </CardContent>
    </Card>
  );
};
