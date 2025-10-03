
import React from "react";
import { useScheduling, SessionType } from "@/contexts/SchedulingContext";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { VideoIcon, MapPin, ArrowLeft } from "lucide-react";

interface SessionTypeSelectorProps {
  onBack?: () => void;
  onContinue?: () => void;
}

export function SessionTypeSelector({ onBack, onContinue }: SessionTypeSelectorProps) {
  const { state, setSessionType, setLocation, tutor } = useScheduling();
  const [locationInput, setLocationInput] = React.useState(state.location || "");
  
  // Get tutor's availability preferences (default to true if not set)
  const availableInPerson = tutor?.available_in_person ?? true;
  const availableOnline = tutor?.available_online ?? true;
  
  const handleSessionTypeChange = (value: string) => {
    setSessionType(value as SessionType);
    
    // Reset location if switching from in-person to virtual
    if (value === SessionType.VIRTUAL) {
      setLocation(null);
      setLocationInput("");
    }
  };
  
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationInput(e.target.value);
    setLocation(e.target.value);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="mr-2 p-0">
            <ArrowLeft className="h-4 w-4" />
            <span className="ml-2">Back</span>
          </Button>
        )}
        <h3 className="text-xl font-semibold">Session Location</h3>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Choose how you'd like to meet with your tutor.
      </p>
      
      <RadioGroup 
        value={state.sessionType} 
        onValueChange={handleSessionTypeChange}
        className="space-y-4"
      >
        <div className={`border rounded-md p-4 ${
          !availableInPerson ? "opacity-50 cursor-not-allowed bg-muted" : 
          state.sessionType === SessionType.IN_PERSON ? "border-usc-cardinal" : ""
        }`}>
          <div className="flex items-start space-x-3">
            <RadioGroupItem 
              value={SessionType.IN_PERSON} 
              id="in-person" 
              disabled={!availableInPerson}
            />
            <div className="grid gap-1.5">
              <Label 
                htmlFor="in-person" 
                className={`font-medium flex items-center ${!availableInPerson ? "cursor-not-allowed" : ""}`}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Meet In Person
              </Label>
              <p className="text-sm text-muted-foreground">
                {availableInPerson 
                  ? "Meet your tutor at an agreed location on campus."
                  : "This tutor is not available for in-person sessions."}
              </p>
              
              {state.sessionType === SessionType.IN_PERSON && (
                <div className="mt-3">
                  <Label htmlFor="location" className="text-sm font-medium">
                    Suggested Meeting Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g. USC Library, Leavey Library, etc."
                    className="mt-1"
                    value={locationInput}
                    onChange={handleLocationChange}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className={`border rounded-md p-4 ${
          !availableOnline ? "opacity-50 cursor-not-allowed bg-muted" : 
          state.sessionType === SessionType.VIRTUAL ? "border-usc-cardinal" : ""
        }`}>
          <div className="flex items-start space-x-3">
            <RadioGroupItem 
              value={SessionType.VIRTUAL} 
              id="virtual" 
              disabled={!availableOnline}
            />
            <div className="grid gap-1.5">
              <Label 
                htmlFor="virtual" 
                className={`font-medium flex items-center ${!availableOnline ? "cursor-not-allowed" : ""}`}
              >
                <VideoIcon className="h-4 w-4 mr-2" />
                Meet Online
              </Label>
              <p className="text-sm text-muted-foreground">
                {availableOnline
                  ? "Connect virtually through Zoom, Google Meet, or other platforms."
                  : "This tutor is not available for online sessions."}
              </p>
              
              {state.sessionType === SessionType.VIRTUAL && (
                <p className="mt-2 text-sm">
                  We'll set up the virtual meeting details after booking.
                </p>
              )}
            </div>
          </div>
        </div>
      </RadioGroup>
      
      {onBack && onContinue && (
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          
          <Button 
            className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
            onClick={onContinue}
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
