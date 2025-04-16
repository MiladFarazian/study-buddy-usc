
import { Button } from "@/components/ui/button";

interface EmptySessionStateProps {
  message: string;
  buttonText?: string;
  onAction?: () => void;
  showButton?: boolean;
}

export const EmptySessionState = ({ 
  message, 
  buttonText = "Book a Session", 
  onAction,
  showButton = true
}: EmptySessionStateProps) => {
  return (
    <div className="text-center py-8 text-gray-500">
      <p>{message}</p>
      {showButton && onAction && (
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={onAction}
        >
          {buttonText}
        </Button>
      )}
    </div>
  );
};
