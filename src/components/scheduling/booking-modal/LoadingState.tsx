
import React from "react";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Loading tutor availability..." 
}) => {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-usc-cardinal"></div>
      <span className="ml-2">{message}</span>
    </div>
  );
};
