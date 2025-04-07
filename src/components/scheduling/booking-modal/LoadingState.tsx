
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal mb-4" />
      <p className="text-center text-muted-foreground">{message}</p>
    </div>
  );
}
