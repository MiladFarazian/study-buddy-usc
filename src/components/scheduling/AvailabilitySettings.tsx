
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { WeeklyAvailabilityCalendar } from './calendar';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { WeeklyAvailability } from '@/lib/scheduling/types';
import { useToast } from '@/hooks/use-toast';
import { updateTutorAvailability, getTutorAvailability } from '@/lib/scheduling';
import { Loader2, MapPin, Video } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  const [availableInPerson, setAvailableInPerson] = useState(true);
  const [availableOnline, setAvailableOnline] = useState(true);
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

        // Load session type preferences from profile
        if (profile) {
          setAvailableInPerson(profile.available_in_person ?? true);
          setAvailableOnline(profile.available_online ?? true);
        }
      } catch (error) {
        console.error('Error loading availability:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [user?.id, profile]);

  const handleAvailabilityChange = (newAvailability: WeeklyAvailability) => {
    setAvailability(newAvailability);
  };

  const handleSaveAvailability = async () => {
    if (!user?.id) return;
    
    // Validate that at least one session type is selected
    if (!availableInPerson && !availableOnline) {
      toast({
        title: "Selection Required",
        description: "Please select at least one session type (in-person or online).",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    try {
      // Update availability schedule
      const availabilitySuccess = await updateTutorAvailability(user.id, availability);
      
      // Update session type preferences
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          available_in_person: availableInPerson,
          available_online: availableOnline,
        })
        .eq('id', user.id);
      
      if (availabilitySuccess && !profileError) {
        toast({
          title: "Availability Saved",
          description: "Your availability and session type preferences have been updated successfully.",
        });
      } else {
        throw new Error(profileError?.message || "Failed to update availability");
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
          Set your weekly availability and session type preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Session Type Preferences */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/50">
          <h3 className="text-sm font-semibold mb-3">Session Type Availability</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Choose which types of sessions you're available to offer
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <Label htmlFor="in-person" className="text-sm font-medium">
                    In-Person Sessions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Meet students at agreed locations on campus
                  </p>
                </div>
              </div>
              <Switch
                id="in-person"
                checked={availableInPerson}
                onCheckedChange={setAvailableInPerson}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-primary" />
                <div>
                  <Label htmlFor="online" className="text-sm font-medium">
                    Online Sessions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Connect virtually through Zoom or other platforms
                  </p>
                </div>
              </div>
              <Switch
                id="online"
                checked={availableOnline}
                onCheckedChange={setAvailableOnline}
              />
            </div>
          </div>
        </div>

        {/* Weekly Availability Schedule */}
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
