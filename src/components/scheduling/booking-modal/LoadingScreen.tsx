
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-12 w-12 animate-spin text-usc-cardinal mb-6" />
      <p className="text-lg text-center text-muted-foreground">{message}</p>
    </div>
  );
}
