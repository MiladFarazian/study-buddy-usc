
import { Loader2 } from "lucide-react";

export const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal mb-4" />
      <p className="text-muted-foreground">Loading tutor's availability...</p>
    </div>
  );
};
