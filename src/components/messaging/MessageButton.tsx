
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Profile } from "@/integrations/supabase/types-extension";

interface MessageButtonProps {
  recipient: Profile;
  className?: string;
}

export default function MessageButton({ recipient, className }: MessageButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Don't show message button to yourself or unauthenticated users
  if (!isAuthenticated || user?.id === recipient.id) {
    return null;
  }
  
  const handleClick = () => {
    navigate(`/messages?user=${recipient.id}&isTutor=${recipient.role === 'tutor'}`);
  };
  
  return (
    <Button 
      onClick={handleClick}
      variant="outline"
      size="sm"
      className={className}
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      Message
    </Button>
  );
}
