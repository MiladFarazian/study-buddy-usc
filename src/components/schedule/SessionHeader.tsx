
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface SessionHeaderProps {
  title?: string;
  description?: string;
}

export const SessionHeader = ({ 
  title = "Schedule", 
  description = "Book and manage your tutoring sessions" 
}: SessionHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Button 
        className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
        onClick={() => navigate('/tutors')}
      >
        Book New Session
      </Button>
    </div>
  );
};
