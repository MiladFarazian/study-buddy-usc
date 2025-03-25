
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AuthRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthRequiredDialog = ({ isOpen, onClose }: AuthRequiredDialogProps) => {
  const navigate = useNavigate();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign In Required</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4">Please sign in to book a session with this tutor.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => navigate('/login')}>Sign In</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
