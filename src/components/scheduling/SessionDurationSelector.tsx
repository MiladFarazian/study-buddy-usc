
import React from 'react';
import { SESSION_DURATIONS } from '../../utils/mockData';

interface SessionDurationSelectorProps {
  selectedDuration: string;
  onSelectDuration: (duration: string) => void;
}

const SessionDurationSelector: React.FC<SessionDurationSelectorProps> = ({
  selectedDuration,
  onSelectDuration
}) => {
  return (
    <div className="w-full rounded-xl bg-white shadow-sm mt-4">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-medium">Select Session Duration</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SESSION_DURATIONS.map((duration) => (
            <button
              key={duration.value}
              onClick={() => onSelectDuration(duration.value)}
              className={`py-4 px-4 rounded-xl border transition-all duration-200 ease-in-out ${
                selectedDuration === duration.value
                  ? 'border-usc-cardinal bg-red-50 text-usc-cardinal'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">{duration.label}</div>
              <div className="text-sm text-muted-foreground">${duration.price}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SessionDurationSelector;
