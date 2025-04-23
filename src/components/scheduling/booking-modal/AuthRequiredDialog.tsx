
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AuthRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
  returnPath?: string;
}

export function AuthRequiredDialog({ isOpen, onClose, returnPath }: AuthRequiredDialogProps) {
  const navigate = useNavigate();
  
  const handleLogin = () => {
    // Store the return path in sessionStorage
    if (returnPath) {
      sessionStorage.setItem('redirectAfterAuth', returnPath);
    }
    onClose();
    navigate('/login');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Authentication Required</DialogTitle>
          <DialogDescription>
            You need to be logged in to book a tutoring session.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-muted-foreground mb-4">
            Please log in or create an account to continue with booking your session.
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleLogin} className="bg-usc-cardinal hover:bg-usc-cardinal-dark">
            Go to Login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
