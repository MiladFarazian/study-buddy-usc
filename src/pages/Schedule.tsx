
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from '@/utils/dateUtils';
import TimeSlots from '@/components/scheduling/TimeSlots';
import SessionDurationSelector from '@/components/scheduling/SessionDurationSelector';
import DateSelector from '@/components/scheduling/DateSelector';
import { useTutor } from '@/hooks/useTutor';
import { SESSION_DURATIONS } from '@/utils/mockData';
import { useToast } from '@/hooks/use-toast';

const Schedule = () => {
  const { id } = useParams<{ id: string }>();
  const { tutor, loading } = useTutor(id || "");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string>(SESSION_DURATIONS[1].value); // Default to 60 minutes
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset time when date changes
  };
  
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };
  
  const handleDurationSelect = (duration: string) => {
    setSelectedDuration(duration);
  };

  const handleBookSession = () => {
    if (!selectedDate || !selectedTime || !selectedDuration) {
      toast({
        title: "Incomplete booking",
        description: "Please select a date, time, and session duration.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Session booked!",
      description: `Your ${selectedDuration} minute session has been scheduled for ${formatDate(selectedDate)} at ${selectedTime}.`,
    });

    // Navigate back to tutor profile
    if (id) {
      navigate(`/tutors/${id}`);
    } else {
      navigate('/tutors');
    }
  };

  if (loading || !tutor) {
    return (
      <div className="container py-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-usc-cardinal"></div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link to={`/tutors/${id}`} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tutor
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-2xl font-bold">Schedule a Session</h1>
          
          <DateSelector 
            selectedDate={selectedDate} 
            onSelectDate={handleDateSelect} 
          />
          
          <TimeSlots 
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSelectTime={handleTimeSelect}
          />
          
          <SessionDurationSelector 
            selectedDuration={selectedDuration}
            onSelectDuration={handleDurationSelect}
          />
          
          <div className="mt-8">
            <Button 
              className="w-full bg-usc-cardinal hover:bg-usc-cardinal-dark text-white py-6 text-lg"
              onClick={handleBookSession}
              disabled={!selectedDate || !selectedTime || !selectedDuration}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Book Session
            </Button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
                  {tutor.imageUrl ? (
                    <img 
                      src={tutor.imageUrl} 
                      alt={tutor.name}
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-500">
                      {tutor.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                </div>
                
                <h2 className="text-xl font-semibold">Dr. {tutor.name}</h2>
                <p className="text-muted-foreground">{tutor.field}</p>
                
                <div className="flex items-center justify-center my-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                  <span className="ml-1 font-medium">5/5</span>
                </div>
                
                <p className="text-2xl font-bold text-usc-cardinal mt-2">
                  ${tutor.hourlyRate}/hour
                </p>

                <div className="w-full mt-6">
                  <Tabs defaultValue="about" className="w-full">
                    <TabsList className="w-full grid grid-cols-3">
                      <TabsTrigger value="about" className="data-[state=active]:bg-usc-cardinal data-[state=active]:text-white">About</TabsTrigger>
                      <TabsTrigger value="subjects" className="data-[state=active]:bg-usc-cardinal data-[state=active]:text-white">Subjects</TabsTrigger>
                      <TabsTrigger value="availability" className="data-[state=active]:bg-usc-cardinal data-[state=active]:text-white">Availability</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="about" className="mt-4">
                      <p className="text-sm text-muted-foreground">
                        {tutor.bio || `${tutor.name} is a highly experienced tutor specializing in ${tutor.field}.`}
                      </p>
                    </TabsContent>
                    
                    <TabsContent value="subjects" className="mt-4">
                      <div className="space-y-2">
                        {tutor.subjects.map((subject) => (
                          <div key={subject.code} className="p-2 bg-gray-50 rounded text-sm">
                            <p className="font-medium">{subject.name}</p>
                            <p className="text-xs text-muted-foreground">{subject.code}</p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="availability" className="mt-4">
                      <p className="text-sm text-muted-foreground">
                        Available Monday to Friday from 9:00 AM to 5:00 PM.
                      </p>
                    </TabsContent>
                  </Tabs>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-6"
                  onClick={() => navigate(`/messages?user=${tutor.id}&isTutor=true`)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Message Tutor
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
