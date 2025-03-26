
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Profile } from "@/integrations/supabase/types-extension";
import { Tutor } from "@/types/tutor";

interface MessageButtonProps {
  recipient: Profile | Tutor;
  className?: string;
  variant?: "outline" | "default" | "destructive" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function MessageButton({ recipient, className, variant = "outline", size = "sm" }: MessageButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Don't show message button to yourself
  if (user && user.id === recipient.id) {
    return null;
  }
  
  const handleClick = () => {
    if (!user) {
      // Redirect to login if user is not authenticated
      navigate("/login");
      return;
    }
    
    // Handle different recipient types
    const isTutor = 'role' in recipient ? recipient.role === 'tutor' : true;
    
    navigate(`/messages?user=${recipient.id}&isTutor=${isTutor}`);
  };
  
  return (
    <Button 
      onClick={handleClick}
      variant={variant}
      size={size}
      className={className}
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      Message
    </Button>
  );
}
