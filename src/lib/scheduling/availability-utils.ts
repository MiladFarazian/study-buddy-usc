
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
    
    const { data, error } = await supabase
      .from('profiles')
      .select('availability')
      .eq('id', tutorId)
      .single();
      
    if (error) {
      console.error("Error fetching tutor availability:", error);
      return null;
    }
    
    // Log the result for debugging
    console.log("Tutor availability data:", data?.availability);
    
    // Ensure we return the availability in the correct format
    if (data?.availability) {
      // Check if it's a valid object with day properties
      const avail = data.availability as WeeklyAvailability;
      const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      // Ensure all days exist in the availability object
      const cleanAvailability: WeeklyAvailability = {};
      weekDays.forEach(day => {
        cleanAvailability[day] = avail[day] || [];
      });
      
      return cleanAvailability;
    }
    
    return null;
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
    const { error } = await supabase
      .from('profiles')
      .update({ availability })
      .eq('id', tutorId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error updating tutor availability:", error);
    return false;
  }
}
