
// Mock data for time slots
export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

// Mock data for available time slots for each date
export const TIME_SLOTS: Record<string, TimeSlot[]> = {
  "2024-08-01": [
    { id: "1", time: "09:00", available: true },
    { id: "2", time: "10:00", available: true },
    { id: "3", time: "11:00", available: false },
    { id: "4", time: "12:00", available: true },
    { id: "5", time: "13:00", available: true },
    { id: "6", time: "14:00", available: true },
    { id: "7", time: "15:00", available: true },
    { id: "8", time: "16:00", available: true },
  ],
  "2024-08-02": [
    { id: "9", time: "09:00", available: true },
    { id: "10", time: "10:00", available: true },
    { id: "11", time: "11:00", available: true },
    { id: "12", time: "12:00", available: false },
    { id: "13", time: "13:00", available: false },
    { id: "14", time: "14:00", available: true },
    { id: "15", time: "15:00", available: true },
    { id: "16", time: "16:00", available: true },
  ],
  "2024-08-03": [
    { id: "17", time: "10:00", available: true },
    { id: "18", time: "11:00", available: true },
    { id: "19", time: "12:00", available: true },
    { id: "20", time: "14:00", available: true },
    { id: "21", time: "15:00", available: false },
    { id: "22", time: "16:00", available: true },
  ],
  "2024-08-04": [
    { id: "23", time: "09:00", available: true },
    { id: "24", time: "10:00", available: true },
    { id: "25", time: "11:00", available: true },
    { id: "26", time: "12:00", available: true },
  ],
  "2024-08-05": [
    { id: "27", time: "13:00", available: true },
    { id: "28", time: "14:00", available: true },
    { id: "29", time: "15:00", available: true },
    { id: "30", time: "16:00", available: true },
  ],
  "2024-08-06": [
    { id: "31", time: "09:00", available: true },
    { id: "32", time: "11:00", available: true },
    { id: "33", time: "13:00", available: true },
    { id: "34", time: "15:00", available: true },
  ],
  "2024-08-07": [
    { id: "35", time: "09:00", available: true },
    { id: "36", time: "10:00", available: true },
    { id: "37", time: "11:00", available: true },
    { id: "38", time: "12:00", available: true },
    { id: "39", time: "13:00", available: true },
    { id: "40", time: "14:00", available: true },
    { id: "41", time: "15:00", available: true },
    { id: "42", time: "16:00", available: true },
  ],
};

// Session durations with prices
export const SESSION_DURATIONS = [
  { value: "30", label: "30 minutes", price: 30 },
  { value: "60", label: "60 minutes", price: 60 },
  { value: "90", label: "90 minutes", price: 90 },
];
