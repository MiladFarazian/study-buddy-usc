
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
        description: "Your tutor settings have been saved successfully.",
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <div className="flex">
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  className="max-w-[200px]"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="25.00"
                />
                <Button
                  type="submit"
                  className="ml-4 bg-usc-cardinal hover:bg-usc-cardinal-dark"
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
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
          <CardDescription>
            Manage your availability for tutoring sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            The availability settings feature will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
