
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { WeeklyAvailability } from "@/types/scheduling";
import { DragSelectCalendar } from "./DragSelectCalendar";

export const AvailabilitySettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<WeeklyAvailability>({});

  // Load current availability
  useEffect(() => {
    if (user?.id) {
      loadAvailability();
    }
  }, [user?.id]);

  const loadAvailability = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tutor_availability')
        .select('availability')
        .eq('tutor_id', user.id)
        .single();
        
      if (error) {
        console.error("Error fetching availability:", error);
        // If no record exists, we'll create an empty one
        if (error.code === 'PGRST116') {
          setAvailability({});
        }
        return;
      }
      
      setAvailability(data?.availability || {});
    } catch (error) {
      console.error("Error in loadAvailability:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const saveAvailability = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('tutor_availability')
        .upsert({
          tutor_id: user.id,
          availability: availability,
          updated_at: new Date().toISOString()
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Availability saved",
        description: "Your availability has been updated successfully."
      });
    } catch (error) {
      console.error("Error saving availability:", error);
      toast({
        title: "Error",
        description: "Failed to save your availability. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleAvailabilityChange = (newAvailability: WeeklyAvailability) => {
    setAvailability(newAvailability);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2">Loading availability settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability Settings</CardTitle>
        <CardDescription>
          Set your weekly availability for tutoring sessions. Click or drag to select time slots.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="border rounded-md overflow-hidden">
            <DragSelectCalendar
              availability={availability}
              onChange={handleAvailabilityChange}
              className="max-h-[600px] overflow-y-auto"
            />
          </div>
          
          <Button 
            onClick={saveAvailability} 
            className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
            disabled={saving}
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
