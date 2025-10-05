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
              {/* Terms of Service */}
              <section>
                <h2 className="text-2xl font-bold mb-4">STUDYBUDDY TERMS OF SERVICE</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  <strong>Last Updated: January 1, 2025</strong><br />
                  <strong>Effective Date: January 1, 2025</strong>
                </p>

                <div className="space-y-6">
                  <div className="border-l-4 border-destructive pl-4 py-2 bg-destructive/10">
                    <h3 className="font-bold mb-2">IMPORTANT NOTICE</h3>
                    <p className="text-sm">
                      PLEASE READ THESE TERMS OF SERVICE CAREFULLY BEFORE USING STUDYBUDDY. BY CREATING AN ACCOUNT, ACCESSING, OR USING THE STUDYBUDDY PLATFORM, YOU AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE STUDYBUDDY.
                    </p>
                    <p className="text-sm mt-2">
                      THESE TERMS CONTAIN AN ARBITRATION AGREEMENT AND CLASS ACTION WAIVER THAT AFFECT YOUR LEGAL RIGHTS. PLEASE READ SECTIONS 16 AND 17 CAREFULLY.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">1. ACCEPTANCE OF TERMS</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      These Terms of Service ("Terms") constitute a legally binding agreement between you and StudyBuddy LLC ("StudyBuddy," "we," "us," or "our") governing your use of the StudyBuddy website, mobile application, and related services (collectively, the "Platform").
                    </p>
                    <p className="text-sm text-muted-foreground">
                      By clicking "I Accept," creating an account, or using the Platform in any way, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy, which is incorporated by reference.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">2. ELIGIBILITY AND ACCOUNT REQUIREMENTS</h3>
                    <h4 className="font-semibold text-base mb-1">2.1 Age Requirement</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      You must be at least 18 years of age to create an account and use StudyBuddy. By using the Platform, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms.
                    </p>
                    <h4 className="font-semibold text-base mb-1">2.2 USC Community Requirement</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      StudyBuddy is currently available only to students, alumni, faculty, and staff of the University of Southern California ("USC") who possess a valid USC email address ending in @usc.edu.
                    </p>
                    <h4 className="font-semibold text-base mb-1">2.3 Account Security</h4>
                    <p className="text-sm text-muted-foreground">
                      You are solely responsible for maintaining the confidentiality of your account credentials. StudyBuddy is not liable for any loss or damage arising from your failure to maintain account security.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">3. DESCRIPTION OF SERVICES</h3>
                    <p className="text-sm font-bold mb-2">
                      STUDYBUDDY DOES NOT PROVIDE TUTORING SERVICES. We operate solely as an intermediary platform.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      StudyBuddy is a marketplace platform that connects students seeking tutoring services with independent tutors. Tutors are independent contractors who operate their own independent tutoring businesses. Any tutoring services are provided directly by the tutor to the student.
                    </p>
                  </div>

                  <div className="border-l-4 border-destructive pl-4 py-2 bg-destructive/10">
                    <h3 className="font-bold mb-2">⚠️ 5. WARNING: NO BACKGROUND CHECKS OR VERIFICATION</h3>
                    <p className="text-sm font-bold mb-2">
                      STUDYBUDDY DOES NOT CONDUCT BACKGROUND CHECKS, CRIMINAL HISTORY CHECKS, OR VERIFICATION OF CREDENTIALS FOR ANY TUTORS ON THE PLATFORM.
                    </p>
                    <p className="text-sm mb-2">
                      STUDENTS ARE SOLELY AND ENTIRELY RESPONSIBLE FOR:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                      <li>Verifying tutor qualifications, credentials, and experience</li>
                      <li>Evaluating tutor trustworthiness and character</li>
                      <li>Assessing tutor suitability for their needs</li>
                      <li>Ensuring their own safety when meeting tutors</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">6. IN-PERSON SESSION SAFETY</h3>
                    <p className="text-sm font-bold mb-2">
                      YOU ACKNOWLEDGE AND AGREE THAT MEETING ANYONE IN PERSON WHOM YOU MET THROUGH AN ONLINE PLATFORM CARRIES INHERENT RISKS.
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      We strongly recommend that users who choose to meet in person:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                      <li>Meet in well-lit, public spaces such as campus libraries or coffee shops</li>
                      <li>Share session details with a trusted friend or family member</li>
                      <li>Keep mobile phones charged and accessible</li>
                      <li>Trust personal instincts and leave any situation that feels uncomfortable</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">7. ACADEMIC INTEGRITY</h3>
                    <p className="text-sm font-bold mb-2">
                      StudyBuddy may NOT be used for academic dishonesty of any kind, including but not limited to:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2 mb-2">
                      <li>Completing assignments, papers, or projects on behalf of students</li>
                      <li>Taking tests, quizzes, or exams on behalf of students</li>
                      <li>Facilitating plagiarism or cheating</li>
                    </ul>
                    <p className="text-sm text-muted-foreground">
                      You are solely responsible for ensuring your use of StudyBuddy complies with USC's academic integrity policies.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">9. PAYMENT TERMS</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      StudyBuddy charges a 1% platform service fee on all completed tutoring sessions. Payment is charged immediately upon booking confirmation. All payments are processed securely through Stripe.
                    </p>
                    <p className="text-sm font-semibold mb-1">Example:</p>
                    <div className="bg-muted/50 p-3 rounded text-sm font-mono">
                      Tutor's Hourly Rate: $50.00<br />
                      Platform Service Fee: $0.50 (1%)<br />
                      ───────────────────────<br />
                      Total Student Pays: $50.50
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">10. CANCELLATIONS AND REFUNDS</h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                      <li><strong>24+ hours before:</strong> 100% refund</li>
                      <li><strong>2-24 hours before:</strong> 50% refund to student, 50% to tutor</li>
                      <li><strong>Less than 2 hours:</strong> No refund, full payment to tutor</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">11. MESSAGE STORAGE AND MONITORING</h3>
                    <p className="text-sm font-bold mb-2">
                      All messages sent through the StudyBuddy platform are permanently stored on our secure servers.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      StudyBuddy administrators may access and review message content for safety monitoring, academic integrity enforcement, dispute resolution, and law enforcement cooperation. You have no expectation of privacy in messages sent through the platform.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">15. DISCLAIMERS AND LIMITATION OF LIABILITY</h3>
                    <p className="text-sm font-bold mb-2">
                      STUDYBUDDY IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND.
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      TO THE MAXIMUM EXTENT PERMITTED BY CALIFORNIA LAW, STUDYBUDDY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES ARISING FROM PLATFORM USE.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">17. DISPUTE RESOLUTION: ARBITRATION AGREEMENT</h3>
                    <p className="text-sm font-bold mb-2">
                      YOU AND STUDYBUDDY AGREE TO RESOLVE ALL DISPUTES THROUGH BINDING INDIVIDUAL ARBITRATION RATHER THAN LAWSUITS IN COURT.
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      This arbitration agreement is governed by the Federal Arbitration Act. Claims of sexual assault or sexual harassment CANNOT be compelled to arbitration and may be brought in court.
                    </p>
                    <p className="text-sm font-bold">
                      You have the right to opt out of this arbitration agreement within 30 days of first accepting these Terms by sending written notice to help@studybuddyusc.com.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">18. GOVERNING LAW</h3>
                    <p className="text-sm text-muted-foreground">
                      These Terms are governed by the laws of the State of California. Exclusive jurisdiction lies in the state or federal courts located in Los Angeles County, California.
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4 py-2 bg-muted/50">
                    <h3 className="font-bold mb-2">20. USC DISCLAIMER</h3>
                    <p className="text-sm">
                      STUDYBUDDY IS AN INDEPENDENT PLATFORM AND IS NOT AFFILIATED WITH, ENDORSED BY, SPONSORED BY, OR OFFICIALLY CONNECTED WITH THE UNIVERSITY OF SOUTHERN CALIFORNIA.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">22. CONTACT INFORMATION</h3>
                    <p className="text-sm text-muted-foreground">
                      For all inquiries:<br />
                      Email: help@studybuddyusc.com<br />
                      Address: 1170 Edmar Ln, Santa Cruz, CA 90562
                    </p>
                  </div>
                </div>
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
