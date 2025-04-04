
import { supabase } from "@/integrations/supabase/client";
import { WeeklyAvailability } from "./types";

// Get tutor's availability from their profile
export async function getTutorAvailability(tutorId: string): Promise<WeeklyAvailability | null> {
  try {
    if (!tutorId) {
      console.error("No tutor ID provided to getTutorAvailability");
      return null;
    }
    
    console.log("Fetching availability for tutor:", tutorId);
    
    // Check if we have an active session first
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.log("No active auth session when fetching tutor availability - public data access mode");
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('availability')
      .eq('id', tutorId)
      .single();
      
    if (error) {
      if (error.message.includes("JWT")) {
        console.error("Authentication error when fetching tutor availability:", error);
        throw new Error("Authentication required to view tutor availability");
      } else {
        console.error("Error fetching tutor availability:", error);
      }
      return null;
    }
    
    // Log the result for debugging
    console.log("Tutor availability data:", data?.availability);
    
    // Ensure we return the availability in the correct format
    if (data?.availability) {
      // Cast to WeeklyAvailability after validation
      const availabilityData = data.availability as any;
      
      // Check if it's a valid object with day properties
      if (typeof availabilityData === 'object' && !Array.isArray(availabilityData)) {
        const cleanAvailability: WeeklyAvailability = {};
        
        // Initialize with empty arrays if undefined
        const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        // Ensure all days exist in the availability object
        weekDays.forEach(day => {
          cleanAvailability[day] = Array.isArray(availabilityData[day]) ? availabilityData[day] : [];
        });
        
        return cleanAvailability;
      }
    }
    
    // If tutor has no availability set yet, return a default structure
    const defaultAvailability: WeeklyAvailability = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };
    
    return defaultAvailability;
  } catch (error) {
    console.error("Error fetching tutor availability:", error);
    return null;
  }
}

// Update tutor's availability in their profile
export async function updateTutorAvailability(
  tutorId: string, 
  availability: WeeklyAvailability
): Promise<boolean> {
  try {
    console.log("Updating availability for tutor:", tutorId, availability);
    
    const { error } = await supabase
      .from('profiles')
      .update({ availability: availability as any })
      .eq('id', tutorId);
      
    if (error) {
      console.error("Error updating tutor availability:", error);
      throw error;
    }
    
    console.log("Successfully updated tutor availability");
    return true;
  } catch (error) {
    console.error("Error updating tutor availability:", error);
    return false;
  }
}

// Map a date to the day of the week
export function mapDateToDayOfWeek(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

// Check if a date has availability based on the day of the week
export function hasAvailabilityForDate(date: Date, availability: WeeklyAvailability): boolean {
  const dayOfWeek = mapDateToDayOfWeek(date);
  return availability[dayOfWeek]?.length > 0;
}

// Get available time slots for a specific day
export function getAvailableTimeSlotsForDay(
  date: Date, 
  availability: WeeklyAvailability,
  bookedSlots: { start: string; end: string }[] = []
): { start: string; end: string }[] {
  const dayOfWeek = mapDateToDayOfWeek(date);
  const dayAvailability = availability[dayOfWeek] || [];
  
  // Filter out time slots that overlap with booked sessions
  return dayAvailability.filter(slot => {
    // Check if this available slot conflicts with any booked slot
    return !bookedSlots.some(booked => {
      const availStart = slot.start;
      const availEnd = slot.end;
      const bookedStart = booked.start;
      const bookedEnd = booked.end;
      
      // Check if there's any overlap
      return (
        (availStart < bookedEnd && availEnd > bookedStart)
      );
    });
  });
}
