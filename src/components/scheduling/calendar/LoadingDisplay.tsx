
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface LoadingDisplayProps {
  message?: string;
}

export const LoadingDisplay: React.FC<LoadingDisplayProps> = ({ 
  message = "Loading availability..." 
}) => {
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
          <span className="text-muted-foreground">{message}</span>
        </div>
      </CardContent>
    </Card>
  );
};
