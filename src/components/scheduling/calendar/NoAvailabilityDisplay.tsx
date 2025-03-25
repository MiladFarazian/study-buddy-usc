
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, UserX, Clock } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useAuth } from "@/contexts/AuthContext";

interface NoAvailabilityDisplayProps {
  reason?: string;
  onRetry?: () => void;
  onLogin?: () => void;
}

export const NoAvailabilityDisplay: React.FC<NoAvailabilityDisplayProps> = ({ 
  reason,
  onRetry,
  onLogin
}) => {
  const { user } = useAuth();
  const isAuthError = reason?.includes("Authentication error") || reason?.includes("sign in");
  const isNoSlotsError = reason?.includes("No available booking slots");
  
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col justify-center items-center h-64 text-center">
          {isAuthError ? (
            <UserX className="h-12 w-12 text-muted-foreground mb-4" />
          ) : isNoSlotsError ? (
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          ) : (
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          )}
          
          <h3 className="text-lg font-medium mb-2">
            {isAuthError ? "Authentication Required" : 
             isNoSlotsError ? "No Available Times" : 
             "No Availability Set"}
          </h3>
          
          <p className="text-muted-foreground max-w-md mb-4">
            {reason || "This tutor hasn't set their availability yet. Please check back later or try another tutor."}
          </p>
          
          {isAuthError && !user && onLogin && (
            <Button 
              variant="default" 
              onClick={onLogin}
              className="mt-2"
            >
              Sign In
            </Button>
          )}
          
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
