import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const StudentOnboarding = () => {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleContinue = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ student_onboarding_complete: true })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Welcome to the platform!",
        description: "You're all set to start booking tutoring sessions.",
      });

      navigate("/");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">Welcome to USC Tutoring</CardTitle>
          <CardDescription className="text-lg">
            Please review the following documents before getting started
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Scrollable document area */}
          <div className="border rounded-lg p-6 max-h-[60vh] overflow-y-auto bg-card">
            <div className="prose prose-sm max-w-none space-y-6">
              {/* PLACEHOLDER: Add Terms of Service */}
              <section>
                <h2 className="text-xl font-semibold mb-3">Terms of Service</h2>
                <p className="text-muted-foreground">
                  {/* TODO: Replace with actual Terms of Service content */}
                  [Terms of Service content will be added here]
                </p>
              </section>

              {/* PLACEHOLDER: Add Privacy Policy */}
              <section>
                <h2 className="text-xl font-semibold mb-3">Privacy Policy</h2>
                <p className="text-muted-foreground">
                  {/* TODO: Replace with actual Privacy Policy content */}
                  [Privacy Policy content will be added here]
                </p>
              </section>

              {/* PLACEHOLDER: Add Community Guidelines */}
              <section>
                <h2 className="text-xl font-semibold mb-3">Community Guidelines</h2>
                <p className="text-muted-foreground">
                  {/* TODO: Replace with actual Community Guidelines content */}
                  [Community Guidelines content will be added here]
                </p>
              </section>
            </div>
          </div>

          {/* Agreement checkbox */}
          <div className="flex items-start space-x-3 pt-4 border-t">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
            />
            <Label
              htmlFor="agree"
              className="text-sm font-medium leading-relaxed cursor-pointer"
            >
              I have read and agree to the Terms of Service, Privacy Policy, and Community Guidelines
            </Label>
          </div>

          {/* Continue button */}
          <Button
            onClick={handleContinue}
            disabled={!agreed || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue to Platform"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentOnboarding;
