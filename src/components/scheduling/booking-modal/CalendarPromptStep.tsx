
import React, { useEffect, useState } from "react";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { CalendarIntegration } from "../calendar-integration/CalendarIntegration";
import { fetchCourseDetails } from "@/lib/scheduling/course-utils";

interface CalendarPromptStepProps {
  tutor: Tutor;
  selectedSlot: BookingSlot;
  selectedDuration: number;
  selectedCourseId?: string | null;
  onClose: () => void;
  onDone: () => void;
}

export function CalendarPromptStep({ 
  tutor, 
  selectedSlot, 
  selectedDuration,
  selectedCourseId,
  onClose,
  onDone
}: CalendarPromptStepProps) {
  const [courseName, setCourseName] = useState<string | null>(null);
  
  // Fetch course details if a course ID was selected
  useEffect(() => {
    async function loadCourseDetails() {
      if (selectedCourseId) {
        try {
          const courseDetails = await fetchCourseDetails(selectedCourseId);
          if (courseDetails) {
            setCourseName(courseDetails.course_title || selectedCourseId);
          }
        } catch (error) {
          console.error("Error fetching course details:", error);
        }
      }
    }
    
    loadCourseDetails();
  }, [selectedCourseId]);
  
  // Handle both closing and completion
  const handleClose = () => {
    onDone();
    onClose();
  };
  
  return (
    <div className="max-w-md mx-auto">
      <CalendarIntegration
        tutor={tutor}
        sessionDate={selectedSlot.day instanceof Date ? selectedSlot.day : new Date(selectedSlot.day)}
        sessionDuration={selectedDuration}
        sessionStartTime={selectedSlot.start}
        courseId={selectedCourseId}
        courseName={courseName}
        onClose={handleClose}
      />
    </div>
  );
}
