
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useScheduling, SessionType } from "@/contexts/SchedulingContext";
import { MapPin, Video } from "lucide-react";

interface SessionTypeSelectorProps {
  onContinue: () => void;
  onBack: () => void;
}

export function SessionTypeSelector({ onContinue, onBack }: SessionTypeSelectorProps) {
  const { state, dispatch } = useScheduling();
  const [selectedType, setSelectedType] = useState<SessionType>(
    state.sessionType || SessionType.IN_PERSON
  );

  const handleContinue = () => {
    dispatch({ type: 'SET_SESSION_TYPE', payload: selectedType });
    onContinue();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Choose Session Type</h2>
        <p className="text-gray-500 mt-2">
          Would you prefer an in-person or virtual session?
        </p>
      </div>

      <RadioGroup
        value={selectedType}
        onValueChange={(value) => setSelectedType(value as SessionType)}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <Label
          htmlFor="in-person"
          className={`flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer hover:bg-gray-50 
            ${selectedType === SessionType.IN_PERSON ? 'border-usc-cardinal bg-red-50' : 'border-gray-200'}`}
        >
          <RadioGroupItem
            value={SessionType.IN_PERSON}
            id="in-person"
            className="sr-only"
          />
          <div className="mb-2 rounded-full bg-gray-100 p-2">
            <MapPin className="h-6 w-6 text-usc-cardinal" />
          </div>
          <div className="text-center">
            <div className="text-base font-medium text-gray-900">In Person</div>
            <div className="text-sm text-gray-500 mt-1">Meet face-to-face on campus</div>
          </div>
        </Label>

        <Label
          htmlFor="virtual"
          className={`flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer hover:bg-gray-50 
            ${selectedType === SessionType.VIRTUAL ? 'border-usc-cardinal bg-red-50' : 'border-gray-200'}`}
        >
          <RadioGroupItem
            value={SessionType.VIRTUAL}
            id="virtual"
            className="sr-only"
          />
          <div className="mb-2 rounded-full bg-gray-100 p-2">
            <Video className="h-6 w-6 text-usc-cardinal" />
          </div>
          <div className="text-center">
            <div className="text-base font-medium text-gray-900">Virtual</div>
            <div className="text-sm text-gray-500 mt-1">Connect via Zoom video call</div>
          </div>
        </Label>
      </RadioGroup>

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
