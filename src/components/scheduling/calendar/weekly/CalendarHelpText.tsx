
import React from 'react';

interface CalendarHelpTextProps {
  readOnly: boolean;
}

export const CalendarHelpText: React.FC<CalendarHelpTextProps> = ({ readOnly }) => {
  return (
    <div className="mt-4 text-sm text-muted-foreground">
      {readOnly ? (
        <div>The colored cells indicate when the tutor is available each week.</div>
      ) : (
        <div>Click and drag to select or deselect time blocks. This pattern repeats every week.</div>
      )}
    </div>
  );
};
