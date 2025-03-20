
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getTutorAvailability, 
  updateTutorAvailability, 
  WeeklyAvailability, 
  AvailabilitySlot 
} from "@/lib/scheduling-utils";
import { X, Plus, Save, Loader2 } from "lucide-react";
import { DragSelectCalendar } from "./DragSelectCalendar";

const DEFAULT_AVAILABILITY: WeeklyAvailability = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

const TIME_SLOTS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

export const AvailabilityCalendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<WeeklyAvailability>(DEFAULT_AVAILABILITY);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDay, setSelectedDay] = useState("monday");
  const [selectedStart, setSelectedStart] = useState("09:00");
  const [selectedEnd, setSelectedEnd] = useState("10:00");

  useEffect(() => {
    if (user) {
      loadAvailability();
    }
  }, [user]);

  const loadAvailability = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await getTutorAvailability(user.id);
      if (data) {
        setAvailability(data);
      }
    } catch (error) {
      console.error("Error loading availability:", error);
      toast({
        title: "Error",
        description: "Failed to load your availability.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAvailability = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const success = await updateTutorAvailability(user.id, availability);
      if (success) {
        toast({
          title: "Success",
          description: "Your availability has been updated.",
        });
      } else {
        throw new Error("Failed to update availability");
      }
    } catch (error) {
      console.error("Error saving availability:", error);
      toast({
        title: "Error",
        description: "Failed to save your availability.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addTimeSlot = () => {
    // Validate time slot
    if (selectedStart >= selectedEnd) {
      toast({
        title: "Invalid Time Slot",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    // Check for overlapping slots
    const daySlots = availability[selectedDay] || [];
    const overlapping = daySlots.some(slot => {
      return (
        (selectedStart >= slot.start && selectedStart < slot.end) ||
        (selectedEnd > slot.start && selectedEnd <= slot.end) ||
        (selectedStart <= slot.start && selectedEnd >= slot.end)
      );
    });

    if (overlapping) {
      toast({
        title: "Overlapping Time Slot",
        description: "This time slot overlaps with an existing one.",
        variant: "destructive",
      });
      return;
    }

    // Add the new time slot
    setAvailability(prev => ({
      ...prev,
      [selectedDay]: [
        ...(prev[selectedDay] || []),
        { day: selectedDay, start: selectedStart, end: selectedEnd }
      ].sort((a, b) => a.start.localeCompare(b.start))
    }));
  };

  const removeTimeSlot = (day: string, slot: AvailabilitySlot) => {
    setAvailability(prev => ({
      ...prev,
      [day]: (prev[day] || []).filter(
        s => !(s.start === slot.start && s.end === slot.end)
      )
    }));
  };

  const handleDayClick = (day: Date) => {
    setDate(day);
    const dayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][day.getDay()];
    setSelectedDay(dayOfWeek);
  };

  const handleCalendarChange = (newAvailability: WeeklyAvailability) => {
    setAvailability(newAvailability);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Availability Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="drag" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="drag">Calendly Style</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
          </TabsList>
          
          <TabsContent value="drag">
            <DragSelectCalendar 
              availability={availability} 
              onChange={handleCalendarChange} 
            />
          </TabsContent>
          
          <TabsContent value="calendar">
            <div className="flex flex-col space-y-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDayClick}
                className="rounded-md border"
              />
              
              <div className="mt-4">
                <h3 className="text-lg font-semibold capitalize">{selectedDay}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your available time slots for this day.
                </p>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex items-center gap-2">
                    <Select value={selectedStart} onValueChange={setSelectedStart}>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Start" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={`start-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>to</span>
                    <Select value={selectedEnd} onValueChange={setSelectedEnd}>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="End" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={`end-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button onClick={addTimeSlot} className="mt-2 md:mt-0">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Time Slot
                  </Button>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Available Slots:</h3>
                  <div className="space-y-2">
                    {(availability[selectedDay] || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No availability set for this day.
                      </p>
                    ) : (
                      (availability[selectedDay] || []).map((slot, index) => (
                        <div 
                          key={`${selectedDay}-${index}`}
                          className="flex items-center justify-between rounded-md border p-2"
                        >
                          <span>
                            {slot.start} - {slot.end}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeTimeSlot(selectedDay, slot)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="weekly">
            <div className="space-y-6">
              {Object.entries(availability).map(([day, slots]) => (
                <div key={day}>
                  <h3 className="text-lg font-semibold capitalize">{day}</h3>
                  <Separator className="my-2" />
                  
                  <div className="space-y-2 mt-2">
                    {slots.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No availability set for this day.
                      </p>
                    ) : (
                      slots.map((slot, index) => (
                        <div 
                          key={`${day}-${index}`}
                          className="flex items-center justify-between rounded-md border p-2"
                        >
                          <span>
                            {slot.start} - {slot.end}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeTimeSlot(day, slot)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 flex justify-end">
          <Button 
            onClick={handleSaveAvailability} 
            disabled={saving} 
            className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Availability
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
