
import { useState } from "react";
import { useScheduling, SessionType } from "@/contexts/SchedulingContext";
import { MapPin, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SessionTypeSelectorProps {
  onBack?: () => void;
  onContinue?: () => void;
}

export function SessionTypeSelector({
  onBack,
  onContinue
}: SessionTypeSelectorProps) {
  const { state, setSessionType, setLocation } = useScheduling();
  const [customLocation, setCustomLocation] = useState(state.location || "");

  const handleSessionTypeChange = (type: SessionType) => {
    setSessionType(type);
    
    // Reset location if switching to virtual
    if (type === SessionType.VIRTUAL) {
      setLocation(null);
      setCustomLocation("");
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const location = e.target.value;
    setCustomLocation(location);
    setLocation(location);
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Session Format</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how you want to meet with your tutor.
        </p>
      </div>

      <div className="border rounded-md p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            type="button"
            onClick={() => handleSessionTypeChange(SessionType.IN_PERSON)}
            className={cn(
              "flex flex-col items-center h-auto py-6 px-4",
              state.sessionType === SessionType.IN_PERSON
                ? "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark"
                : "bg-white text-gray-800 border hover:bg-gray-100"
            )}
            variant={state.sessionType === SessionType.IN_PERSON ? "default" : "outline"}
          >
            <MapPin className="h-8 w-8 mb-2" />
            <span className="text-lg font-medium">In-Person</span>
            <span className="text-sm text-center mt-1">
              Meet on campus or another location
            </span>
          </Button>

          <Button
            type="button"
            onClick={() => handleSessionTypeChange(SessionType.VIRTUAL)}
            className={cn(
              "flex flex-col items-center h-auto py-6 px-4",
              state.sessionType === SessionType.VIRTUAL
                ? "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark"
                : "bg-white text-gray-800 border hover:bg-gray-100"
            )}
            variant={state.sessionType === SessionType.VIRTUAL ? "default" : "outline"}
          >
            <Video className="h-8 w-8 mb-2" />
            <span className="text-lg font-medium">Virtual</span>
            <span className="text-sm text-center mt-1">
              Meet online via video call
            </span>
          </Button>
        </div>

        {state.sessionType === SessionType.IN_PERSON && (
          <div className="pt-4 border-t">
            <Label htmlFor="location" className="mb-2 block">
              Meeting Location
            </Label>
            <Input
              id="location"
              placeholder="Enter a meeting location (e.g., Leavey Library)"
              value={customLocation}
              onChange={handleLocationChange}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Specify where on campus you'd like to meet your tutor
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        {onBack && (
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
        )}
        
        {onContinue && (
          <Button 
            className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white ml-auto"
            onClick={handleContinue}
            disabled={state.sessionType === SessionType.IN_PERSON && !customLocation.trim()}
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
