
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/scheduling/time-utils";

interface SessionDurationSelectorProps {
  sessionTimeRange: string;
  calculatedCost: number;
  sessionDuration: number;
  onDurationChange: (minutes: number) => void;
  onStartTimeChange: (time: string) => void;
  maxDuration: number;
  hourlyRate: number;
  availableStartTimes: string[];
  selectedStartTime: string | null;
  formatTimeForDisplay: (time24: string) => string;
}

export const SessionDurationSelector = ({
  sessionTimeRange,
  calculatedCost,
  sessionDuration,
  onDurationChange,
  onStartTimeChange,
  maxDuration,
  hourlyRate,
  availableStartTimes,
  selectedStartTime,
  formatTimeForDisplay
}: SessionDurationSelectorProps) => {
  // Define common durations
  const durations = [
    { value: 30, label: "30 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" }
  ].filter(d => d.value <= maxDuration);
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>3. Choose Start Time</Label>
        <Select
          value={selectedStartTime || undefined}
          onValueChange={onStartTimeChange}
          disabled={availableStartTimes.length <= 1}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select start time" />
          </SelectTrigger>
          <SelectContent>
            {availableStartTimes.map((time) => (
              <SelectItem key={time} value={time}>
                {formatTimeForDisplay(time)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>4. Select Session Duration</Label>
        <RadioGroup 
          className="grid grid-cols-2 gap-2"
          value={sessionDuration.toString()}
          onValueChange={(value) => onDurationChange(parseInt(value))}
        >
          {durations.map((duration) => (
            <div key={duration.value} className="flex items-center space-x-2">
              <RadioGroupItem 
                value={duration.value.toString()} 
                id={`duration-${duration.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`duration-${duration.value}`}
                className="flex-1 border rounded-md p-2 peer-data-[state=checked]:border-usc-cardinal peer-data-[state=checked]:bg-red-50 cursor-pointer"
              >
                <div className="font-medium">{duration.label}</div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(duration.value / 60 * hourlyRate)}
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      {maxDuration > 30 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Custom Duration</Label>
            <span className="text-sm font-medium">
              {Math.floor(sessionDuration / 60)} hr {sessionDuration % 60} min
            </span>
          </div>
          <Slider
            min={30}
            max={maxDuration}
            step={15}
            value={[sessionDuration]}
            onValueChange={(values) => onDurationChange(values[0])}
          />
        </div>
      )}
      
      <div className="mt-4 p-4 bg-muted/30 rounded-md">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Session Summary</p>
            <p className="text-sm text-muted-foreground">{sessionTimeRange}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-usc-cardinal">{formatCurrency(calculatedCost)}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(hourlyRate)}/hour × {sessionDuration / 60} hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
