
import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SessionDurationSelectorProps {
  selectedDuration: number;
  onDurationChange: (duration: number) => void;
}

export function SessionDurationSelector({
  selectedDuration,
  onDurationChange
}: SessionDurationSelectorProps) {
  // Session duration options in minutes
  const durationOptions = [
    { value: 30, label: "30 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Session Duration
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how long you'd like your tutoring session to be.
        </p>
      </div>

      <div className="border rounded-md p-6">
        <div className="space-y-4">
          {durationOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              onClick={() => onDurationChange(option.value)}
              className={cn(
                "w-full justify-between",
                selectedDuration === option.value
                  ? "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark"
                  : "bg-white text-gray-800 border hover:bg-gray-100"
              )}
              variant={selectedDuration === option.value ? "default" : "outline"}
            >
              <span>{option.label}</span>
              <span className="text-sm">
                {option.value === 30 ? "Standard session" : option.value === 60 ? "Most popular" : ""}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
