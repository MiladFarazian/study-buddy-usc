
import { Loader2 } from "lucide-react";

export interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
