
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeeklyAvailabilityCalendar } from './calendar';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { WeeklyAvailability } from '@/lib/scheduling/types';
import { useToast } from '@/hooks/use-toast';
import { updateTutorAvailability, getTutorAvailability } from '@/lib/scheduling';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const AvailabilitySettings = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [availability, setAvailability] = useState<WeeklyAvailability>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAvailability = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const availabilityData = await getTutorAvailability(user.id);
        if (availabilityData) {
          setAvailability(availabilityData);
        }
      } catch (error) {
        console.error('Error loading availability:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [user?.id]);

  const handleAvailabilityChange = (newAvailability: WeeklyAvailability) => {
    setAvailability(newAvailability);
  };

  const handleSaveAvailability = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const success = await updateTutorAvailability(user.id, availability);
      
      if (success) {
        toast({
          title: "Availability Saved",
          description: "Your availability has been updated successfully.",
        });
      } else {
        throw new Error("Failed to update availability");
      }
    } catch (error) {
      console.error("Error saving availability:", error);
      toast({
        title: "Error",
        description: "Failed to save your availability. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
          <span className="ml-2">Loading availability settings...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tutor Availability</CardTitle>
        <CardDescription>
          Set your weekly availability to let students know when they can book sessions with you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="calendar">
          <TabsList className="mb-4">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar">
            <WeeklyAvailabilityCalendar 
              availability={availability}
              onChange={handleAvailabilityChange}
            />
          </TabsContent>
          
          <TabsContent value="list">
            <AvailabilityCalendar 
              availability={availability}
              onChange={handleAvailabilityChange}
            />
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-6">
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
              'Save Availability'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
