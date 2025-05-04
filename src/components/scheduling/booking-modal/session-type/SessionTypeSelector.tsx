
import { useState } from "react";
import { useScheduling, SessionType } from "@/contexts/SchedulingContext";
import { Video, MapPin, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SessionTypeSelector() {
  const { state, setSessionType, setLocation } = useScheduling();
  const [locationInput, setLocationInput] = useState(state.location || '');
  const [showLocationInput, setShowLocationInput] = useState(state.sessionType === SessionType.IN_PERSON);
  
  // Handle session type selection
  const handleSessionTypeSelect = (type: SessionType) => {
    setSessionType(type);
    
    if (type === SessionType.IN_PERSON) {
      setShowLocationInput(true);
    } else {
      setShowLocationInput(false);
      setLocation(null);
    }
  };

  // Handle location input change
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocationInput(value);
    setLocation(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Session Location</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how you want to meet with your tutor.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className={cn(
            "p-4 cursor-pointer border-2 hover:border-usc-cardinal",
            state.sessionType === SessionType.IN_PERSON ? "border-usc-cardinal" : "border-gray-200"
          )}
          onClick={() => handleSessionTypeSelect(SessionType.IN_PERSON)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-usc-cardinal" />
              <h4 className="font-medium">In-person</h4>
            </div>
            {state.sessionType === SessionType.IN_PERSON && (
              <Check className="h-5 w-5 text-usc-cardinal" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Meet on campus or at a location of your choice
          </p>
        </Card>

        <Card 
          className={cn(
            "p-4 cursor-pointer border-2 hover:border-usc-cardinal",
            state.sessionType === SessionType.VIRTUAL ? "border-usc-cardinal" : "border-gray-200"
          )}
          onClick={() => handleSessionTypeSelect(SessionType.VIRTUAL)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Video className="h-5 w-5 mr-2 text-usc-cardinal" />
              <h4 className="font-medium">Virtual</h4>
            </div>
            {state.sessionType === SessionType.VIRTUAL && (
              <Check className="h-5 w-5 text-usc-cardinal" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Meet via Zoom video call
          </p>
        </Card>
      </div>

      {showLocationInput && (
        <div className="space-y-2 mt-4">
          <Label htmlFor="location">Meeting Location</Label>
          <Input
            id="location"
            placeholder="Enter a meeting location (e.g., Doheny Library, Leavey Library)"
            value={locationInput}
            onChange={handleLocationChange}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
