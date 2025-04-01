
import React from 'react';
import { formatTime } from '../../utils/dateUtils';
import { TimeSlot as TimeSlotType, TIME_SLOTS } from '../../utils/mockData';

interface TimeSlotsProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}

const TimeSlots: React.FC<TimeSlotsProps> = ({ 
  selectedDate, 
  selectedTime, 
  onSelectTime 
}) => {
  if (!selectedDate) {
    return (
      <div className="w-full rounded-xl bg-white shadow-sm p-6 mt-4 text-center animate-fade-in">
        <p className="text-muted-foreground">Please select a date to view available time slots</p>
      </div>
    );
  }

  const dateStr = selectedDate.toISOString().split('T')[0];
  const availableSlots = TIME_SLOTS[dateStr] || [];

  if (availableSlots.length === 0) {
    return (
      <div className="w-full rounded-xl bg-white shadow-sm p-6 mt-4 text-center animate-fade-in">
        <p className="text-muted-foreground">No available time slots for this date</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl bg-white shadow-sm mt-4">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-medium">Select a Time</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {availableSlots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => slot.available && onSelectTime(slot.time)}
              disabled={!slot.available}
              className={`py-3 px-3 rounded-xl border transition-all duration-200 ease-in-out ${
                selectedTime === slot.time
                  ? 'bg-usc-cardinal text-white border-usc-cardinal'
                  : slot.available
                  ? 'border-gray-200 hover:border-gray-400'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {formatTime(slot.time)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeSlots;
