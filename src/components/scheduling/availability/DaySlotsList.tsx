import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import { AvailabilitySlot } from "@/lib/scheduling/types";

interface DaySlotsListProps {
  day: string;
  slots: AvailabilitySlot[];
  removeTimeSlot: (day: string, slot: AvailabilitySlot) => void;
  readOnly: boolean;
}

export const DaySlotsList: React.FC<DaySlotsListProps> = ({
  day,
  slots,
  removeTimeSlot,
  readOnly
}) => {
  return (
    <div key={day}>
      <h3 className="text-lg font-semibold capitalize">{day}</h3>
      <Separator className="my-2" />
      
      <div className="space-y-2 mt-2">
        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No availability set for this day.
          </p>
        ) : (
          slots.map((slot, index) => (
            <div 
              key={`${day}-${index}`}
              className="flex items-center justify-between rounded-md border p-2"
            >
              <span>
                {slot.start} - {slot.end}
              </span>
              {!readOnly && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeTimeSlot(day, slot)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
