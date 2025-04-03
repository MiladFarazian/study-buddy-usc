
import React from 'react';
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({ message = "Loading..." }: LoadingScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal mb-4" />
      <p className="text-center text-gray-600">{message}</p>
    </div>
  );
};
