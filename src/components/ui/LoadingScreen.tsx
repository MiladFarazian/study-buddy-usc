
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen = ({ message = "Loading..." }: LoadingScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <Loader2 className="h-12 w-12 animate-spin text-usc-cardinal mb-4" />
      <p className="text-lg font-medium text-gray-700">{message}</p>
    </div>
  );
};

export default LoadingScreen;
