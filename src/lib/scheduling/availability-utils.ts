
// This file provides backward compatibility for components that still import from it
import { getTutorAvailability, updateTutorAvailability, generateAvailableSlots } from './availability-manager';

// Re-export everything for backward compatibility
export {
  getTutorAvailability,
  updateTutorAvailability,
  generateAvailableSlots
};
