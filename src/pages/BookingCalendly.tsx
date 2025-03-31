
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTutor } from "@/hooks/useTutor";
import { useTutors } from "@/hooks/useTutors";
import { Loader2, ArrowLeft } from "lucide-react";
import { CalendlyDateSelector } from "@/components/scheduling/CalendlyDateSelector";
import { CalendlyTimeSlots } from "@/components/scheduling/CalendlyTimeSlots";
import { RecommendedTutors } from "@/components/scheduling/RecommendedTutors";
import { useAvailabilityData } from "@/hooks/useAvailabilityData";
import { startOfDay } from "date-fns";
import { useScheduling, SchedulingProvider } from "@/contexts/SchedulingContext";

const BookingCalendlyContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tutor, loading: tutorLoading } = useTutor(id || "");
  
  // Get availability data
  const today = startOfDay(new Date());
  const { loading: availabilityLoading, availableSlots, hasAvailability } = 
    tutor ? useAvailabilityData(tutor, today) : { loading: true, availableSlots: [], hasAvailability: false };
  
  // Extract all available dates
  const availableDates = availableSlots
    .filter(slot => slot.available)
    .map(slot => slot.day)
    .filter((date, index, self) => 
      index === self.findIndex(d => 
        d.getDate() === date.getDate() && 
        d.getMonth() === date.getMonth() && 
        d.getFullYear() === date.getFullYear()
      )
    );
  
  if (tutorLoading || availabilityLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
      </div>
    );
  }
  
  if (!tutor) {
    return (
      <div className="py-10 text-center">
        <h2 className="text-2xl font-bold mb-4">Tutor Not Found</h2>
        <p className="text-muted-foreground mb-6">
          We couldn't find the tutor you're looking for.
        </p>
        <Button onClick={() => navigate('/tutors')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Browse Tutors
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      
      <h1 className="text-4xl font-bold mb-2">Calendar</h1>
      <p className="text-xl text-muted-foreground mb-8">Book a session with {tutor.name}</p>
      
      <Card className="p-6 mb-8">
        <CalendlyDateSelector availableDates={availableDates} />
      </Card>
      
      <Card className="p-6 mb-8">
        <CalendlyTimeSlots availableSlots={availableSlots} />
      </Card>
      
      <RecommendedTutors />
    </div>
  );
};

const BookingCalendly = () => {
  return (
    <SchedulingProvider>
      <BookingCalendlyContent />
    </SchedulingProvider>
  );
};

export default BookingCalendly;
