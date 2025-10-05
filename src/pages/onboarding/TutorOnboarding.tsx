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

const TutorOnboarding = () => {
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
        .update({ tutor_onboarding_complete: true })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Tutor onboarding complete!",
        description: "You're now ready to start accepting tutoring sessions.",
      });

      navigate("/settings/profile");
    } catch (error) {
      console.error("Error completing tutor onboarding:", error);
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
          <CardTitle className="text-3xl font-bold">Tutor Onboarding</CardTitle>
          <CardDescription className="text-lg">
            Please review the tutor-specific policies and guidelines
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Scrollable document area */}
          <div className="border rounded-lg p-6 max-h-[60vh] overflow-y-auto bg-card">
            <div className="prose prose-sm max-w-none space-y-6">
              {/* PLACEHOLDER: Add Tutor Agreement */}
              <section>
                <h2 className="text-xl font-semibold mb-3">Tutor Agreement</h2>
                <p className="text-muted-foreground">
                  {/* TODO: Replace with actual Tutor Agreement content */}
                  [Tutor Agreement content will be added here]
                </p>
              </section>

              {/* PLACEHOLDER: Add Code of Conduct */}
              <section>
                <h2 className="text-xl font-semibold mb-3">Code of Conduct</h2>
                <p className="text-muted-foreground">
                  {/* TODO: Replace with actual Code of Conduct content */}
                  [Code of Conduct content will be added here]
                </p>
              </section>

              {/* PLACEHOLDER: Add Payment & Policies */}
              <section>
                <h2 className="text-xl font-semibold mb-3">Payment & Cancellation Policies</h2>
                <p className="text-muted-foreground">
                  {/* TODO: Replace with actual Payment & Policies content */}
                  [Payment & Cancellation Policies content will be added here]
                </p>
              </section>

              {/* PLACEHOLDER: Add Safety Guidelines */}
              <section>
                <h2 className="text-xl font-semibold mb-3">Safety Guidelines</h2>
                <p className="text-muted-foreground">
                  {/* TODO: Replace with actual Safety Guidelines content */}
                  [Safety Guidelines content will be added here]
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
              I have read and agree to the Tutor Agreement, Code of Conduct, Payment Policies, and Safety Guidelines
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
              "Complete Tutor Onboarding"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorOnboarding;
