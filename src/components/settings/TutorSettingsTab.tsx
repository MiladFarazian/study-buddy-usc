
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AvailabilitySettings } from "../scheduling/AvailabilitySettings";
import { Slider } from "@/components/ui/slider";

export const TutorSettingsTab = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [hourlyRate, setHourlyRate] = useState(
    profile?.hourly_rate ? profile.hourly_rate.toString() : "25.00"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSubmitting(true);
    try {
      // Convert hourly rate to number and validate
      const rateValue = parseFloat(hourlyRate);
      if (isNaN(rateValue) || rateValue <= 0) {
        throw new Error("Please enter a valid hourly rate");
      }

      // Update the profile in the database
      const { data, error } = await supabase
        .from('profiles')
        .update({ hourly_rate: rateValue })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      // Update the local profile state
      if (updateProfile && data) {
        updateProfile(data);
      }

      toast({
        title: "Settings updated",
        description: "Your hourly rate has been saved successfully.",
      });
    } catch (error) {
      console.error("Error updating tutor settings:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update tutor settings",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle rate change with slider (optional enhancement)
  const handleSliderChange = (value: number[]) => {
    if (value.length > 0) {
      setHourlyRate(value[0].toString());
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Rate Settings</CardTitle>
          <CardDescription>
            Set your hourly rate for tutoring sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-24"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="25.00"
                />
                <span className="text-lg font-medium">${hourlyRate}</span>
              </div>
              <div className="py-4">
                <Slider
                  min={5}
                  max={150}
                  step={1}
                  value={[parseFloat(hourlyRate) || 25]}
                  onValueChange={handleSliderChange}
                  className="w-full max-w-md"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>$5</span>
                  <span>$150</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Set a competitive rate that reflects your expertise and experience. 
                USC tutors typically charge between $15 and $75 per hour.
              </p>
            </div>
            <Button
              type="submit"
              className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Rate'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Availability Settings */}
      <AvailabilitySettings />
    </div>
  );
};
