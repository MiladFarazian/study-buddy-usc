
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, CheckCircle, AlertCircle, DollarSign, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AvailabilitySettings } from "../scheduling/AvailabilitySettings";
import { Slider } from "@/components/ui/slider";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export const TutorSettingsTab = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [hourlyRate, setHourlyRate] = useState<string>("25.00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectAccount, setConnectAccount] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const stripeStatus = searchParams.get("stripe");

  // Initialize hourly rate from profile when component mounts
  useEffect(() => {
    if (profile?.hourly_rate) {
      setHourlyRate(profile.hourly_rate.toString());
    }
  }, [profile]);

  // Check for Stripe onboarding completion status on page load or return from Stripe
  useEffect(() => {
    const checkConnectAccount = async () => {
      if (!profile) return;
      
      try {
        const { data, error } = await supabase.functions.invoke('check-connect-account');
        
        if (error) {
          console.error('Error checking Stripe Connect account:', error);
          return;
        }
        
        setConnectAccount(data);
        
        // If returned from Stripe onboarding successfully
        if (stripeStatus === 'success') {
          toast({
            title: "Stripe Account Setup",
            description: "Your payment account has been set up successfully.",
          });
        }
      } catch (error) {
        console.error('Error checking Stripe Connect account:', error);
      }
    };
    
    checkConnectAccount();
  }, [profile, stripeStatus, toast]);

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

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHourlyRate(e.target.value);
  };

  // Handle rate change with slider
  const handleSliderChange = (value: number[]) => {
    if (value.length > 0) {
      setHourlyRate(value[0].toString());
    }
  };

  // Handle Stripe Connect account creation
  const handleConnectAccount = async () => {
    if (!profile) return;
    
    setConnectLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account');
      
      if (error) {
        throw error;
      }
      
      if (data?.url) {
        // Redirect to Stripe Connect onboarding
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating Stripe Connect account:', error);
      toast({
        title: "Error",
        description: "Failed to set up your payment account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnectLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Stripe Connect Account Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-usc-cardinal" />
            Payment Account
          </CardTitle>
          <CardDescription>
            Connect your Stripe account to receive payments from students
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectAccount ? (
            <div className="space-y-4">
              {connectAccount.has_account ? (
                <div>
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-medium">Account Status</h3>
                    {connectAccount.payouts_enabled ? (
                      <Badge className="ml-2 bg-green-500">Active</Badge>
                    ) : (
                      <Badge className="ml-2 bg-amber-500">Pending</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-2 ${
                        connectAccount.details_submitted ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {connectAccount.details_submitted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <AlertCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Account Details</p>
                        <p className="text-sm text-muted-foreground">
                          {connectAccount.details_submitted ? 'Completed' : 'Incomplete'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-2 ${
                        connectAccount.payouts_enabled ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {connectAccount.payouts_enabled ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <AlertCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Payouts</p>
                        <p className="text-sm text-muted-foreground">
                          {connectAccount.payouts_enabled ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {connectAccount.needs_onboarding && (
                    <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Account setup incomplete</AlertTitle>
                      <AlertDescription>
                        Please complete your Stripe account setup to start receiving payments.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Button
                    onClick={handleConnectAccount}
                    disabled={connectLoading}
                    className="mt-4"
                    variant={connectAccount.needs_onboarding ? "default" : "outline"}
                  >
                    {connectLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        {connectAccount.needs_onboarding ? 'Complete Account Setup' : 'Manage Account'}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Payment account required</AlertTitle>
                    <AlertDescription>
                      You need to set up a payment account to receive payments from students.
                    </AlertDescription>
                  </Alert>
                  
                  <Button
                    onClick={handleConnectAccount}
                    disabled={connectLoading}
                    className="w-full sm:w-auto"
                  >
                    {connectLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        Set Up Payment Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              <Separator className="my-6" />
              
              <div className="text-sm text-muted-foreground">
                <h4 className="font-medium text-foreground mb-2">About payments</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Students pay in advance to book your tutoring sessions</li>
                  <li>Funds are transferred to your account after the session is completed</li>
                  <li>The platform fee is 10% of the session cost</li>
                  <li>Payments are processed securely through Stripe</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hourly Rate Card */}
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
                  onChange={handleInputChange}
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
