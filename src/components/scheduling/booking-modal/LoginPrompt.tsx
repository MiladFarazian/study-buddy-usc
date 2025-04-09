
import React from 'react';
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useNavigate } from 'react-router-dom';

interface LoginPromptProps {
  onClose: () => void;
  onLogin?: () => void;
}

export const LoginPrompt = ({ onClose, onLogin }: LoginPromptProps) => {
  const navigate = useNavigate();
  
  const handleLogin = () => {
    // Store current path to redirect back after login
    sessionStorage.setItem('redirectAfterAuth', window.location.pathname);
    
    if (onLogin) {
      onLogin();
    } else {
      navigate('/login');
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-blue-100 p-3 mb-4">
        <LogIn className="h-8 w-8 text-usc-cardinal" />
      </div>
      <h3 className="text-xl font-medium mb-2">Login Required</h3>
      <p className="text-gray-600 mb-6">
        You need to be logged in to book a tutoring session.
      </p>
      
      <div className="flex gap-4">
        <Button onClick={handleLogin} className="bg-usc-cardinal hover:bg-usc-cardinal-dark">
          Login
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
