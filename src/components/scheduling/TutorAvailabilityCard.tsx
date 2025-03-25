
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AvailabilityCalendar } from "@/components/scheduling/AvailabilityCalendar";
import { DragSelectCalendar } from "@/components/scheduling/DragSelectCalendar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getTutorAvailability, updateTutorAvailability, WeeklyAvailability } from "@/lib/scheduling-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

interface TutorAvailabilityCardProps {
  tutorId?: string; // Optional - if provided, shows availability for this tutor (student view)
  readOnly?: boolean; // Optional - if true, the availability cannot be edited (student view)
}

export const TutorAvailabilityCard = ({ tutorId, readOnly = false }: TutorAvailabilityCardProps) => {
  const { user, isTutor } = useAuth();
  const { toast } = useToast();
  const [availability, setAvailability] = useState<WeeklyAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // If tutorId is provided, use that; otherwise use the logged-in user's ID (for tutor view)
  const effectiveTutorId = tutorId || (user?.id || "");

  useEffect(() => {
    if (effectiveTutorId) {
      loadAvailability();
    } else {
      setLoading(false);
    }
  }, [effectiveTutorId]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const data = await getTutorAvailability(effectiveTutorId);
      
      // Set default empty availability if none found
      const defaultAvailability = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      };
      
      setAvailability(data || defaultAvailability);
      
      if (!data && tutorId) {
        console.log("No availability found for tutor:", tutorId);
        toast({
          title: "No Availability",
          description: "This tutor hasn't set their availability yet.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading availability:", error);
      toast({
        title: "Error",
        description: "Failed to load availability information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityChange = (newAvailability: WeeklyAvailability) => {
    setAvailability(newAvailability);
  };

  const handleSaveAvailability = async () => {
    if (!availability || !user?.id) return;
    
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
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2">Loading availability...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {readOnly 
            ? "Tutor Availability" 
            : "Set Your Availability"}
        </CardTitle>
        <CardDescription>
          {readOnly 
            ? "View when this tutor is available for booking sessions"
            : "Set your weekly availability to let students book sessions with you"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {availability && (
          <Tabs defaultValue="dragSelect">
            <TabsList className="mb-4">
              <TabsTrigger value="dragSelect">Calendar View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dragSelect">
              <DragSelectCalendar 
                availability={availability} 
                onChange={!readOnly ? handleAvailabilityChange : () => {}}
                readOnly={readOnly}
                className="mb-4"
              />
            </TabsContent>
            
            <TabsContent value="list">
              <AvailabilityCalendar 
                availability={availability} 
                onChange={!readOnly ? handleAvailabilityChange : () => {}}
                readOnly={readOnly}
              />
            </TabsContent>
          </Tabs>
        )}
        
        {!readOnly && isTutor && (
          <div className="flex justify-end mt-4">
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
        )}
      </CardContent>
    </Card>
  );
};
