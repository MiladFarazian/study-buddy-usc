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
                  <strong>Last Updated: October 5, 2025</strong><br />
                  <strong>Effective Date: October 5, 2025</strong>
                </p>

                <div className="space-y-8 text-sm">
                  <div className="border-l-4 border-destructive pl-4 py-3 bg-destructive/10">
                    <h3 className="font-bold text-base mb-2">IMPORTANT NOTICE</h3>
                    <p className="mb-2">
                      PLEASE READ THESE TERMS OF SERVICE CAREFULLY BEFORE USING STUDYBUDDY. BY CREATING AN ACCOUNT, ACCESSING, OR USING THE STUDYBUDDY PLATFORM, YOU AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE STUDYBUDDY.
                    </p>
                    <p>
                      THESE TERMS CONTAIN AN ARBITRATION AGREEMENT AND CLASS ACTION WAIVER THAT AFFECT YOUR LEGAL RIGHTS. PLEASE READ SECTIONS 16 AND 17 CAREFULLY.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">1. ACCEPTANCE OF TERMS</h3>
                    <p className="text-muted-foreground mb-3">
                      These Terms of Service ("Terms") constitute a legally binding agreement between you and StudyBuddy LLC ("StudyBuddy," "we," "us," or "our") governing your use of the StudyBuddy website, mobile application, and related services (collectively, the "Platform").
                    </p>
                    <p className="text-muted-foreground mb-3">
                      By clicking "I Accept," creating an account, or using the Platform in any way, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy, which is incorporated by reference.
                    </p>
                    <p className="text-muted-foreground">
                      We may modify these Terms at any time by posting revised Terms on the Platform. Your continued use of the Platform after such changes constitutes acceptance of the modified Terms. We will provide notice of material changes via email or prominent Platform notice at least 30 days before the effective date.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">2. ELIGIBILITY AND ACCOUNT REQUIREMENTS</h3>
                    
                    <h4 className="font-semibold mb-2">2.1 Age Requirement</h4>
                    <p className="text-muted-foreground mb-4">
                      You must be at least 18 years of age to create an account and use StudyBuddy. By using the Platform, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms.
                    </p>

                    <h4 className="font-semibold mb-2">2.2 USC Community Requirement</h4>
                    <p className="text-muted-foreground mb-4">
                      StudyBuddy is currently available only to students, alumni, faculty, and staff of the University of Southern California ("USC") who possess a valid USC email address ending in @usc.edu. You must verify your USC affiliation by providing your USC email address during registration.
                    </p>

                    <h4 className="font-semibold mb-2">2.3 Account Registration</h4>
                    <p className="text-muted-foreground mb-2">To use certain features of the Platform, you must create an account by providing:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Your full legal name</li>
                      <li>Valid USC email address</li>
                      <li>Secure password</li>
                      <li>Phone number (optional but recommended)</li>
                    </ul>
                    <p className="text-muted-foreground mb-2">You agree to:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Provide accurate, current, and complete information during registration</li>
                      <li>Maintain and promptly update your account information</li>
                      <li>Maintain the security and confidentiality of your password</li>
                      <li>Notify us immediately of any unauthorized use of your account</li>
                      <li>Accept responsibility for all activities under your account</li>
                    </ul>

                    <h4 className="font-semibold mb-2">2.4 Account Security</h4>
                    <p className="text-muted-foreground mb-2">
                      You are solely responsible for maintaining the confidentiality of your account credentials. You agree not to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Share your account with others</li>
                      <li>Allow others to access your account</li>
                      <li>Use another person's account without permission</li>
                      <li>Create multiple accounts for yourself</li>
                    </ul>
                    <p className="text-muted-foreground">
                      StudyBuddy is not liable for any loss or damage arising from your failure to maintain account security.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">3. DESCRIPTION OF SERVICES</h3>
                    
                    <h4 className="font-semibold mb-2">3.1 Platform Overview</h4>
                    <p className="text-muted-foreground mb-2">
                      <strong>StudyBuddy is a marketplace platform that connects students seeking tutoring services with independent tutors who offer tutoring services.</strong> StudyBuddy:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Provides an online platform where tutors can create profiles and list their services</li>
                      <li>Enables students to search for, contact, and book sessions with tutors</li>
                      <li>Facilitates payment processing between students and tutors</li>
                      <li>Provides communication tools for students and tutors</li>
                    </ul>

                    <h4 className="font-semibold mb-2">3.2 Critical Limitation: Platform Role</h4>
                    <p className="font-bold mb-2">STUDYBUDDY DOES NOT PROVIDE TUTORING SERVICES.</p>
                    <p className="text-muted-foreground mb-2">We operate solely as an intermediary platform. Specifically, StudyBuddy:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Does NOT employ tutors</li>
                      <li>Does NOT supervise, direct, or control tutoring sessions</li>
                      <li>Does NOT guarantee the quality, safety, or legality of tutoring services</li>
                      <li>Does NOT verify tutor qualifications, credentials, or backgrounds</li>
                      <li>Does NOT monitor or participate in communications between students and tutors</li>
                      <li>Does NOT control where, when, or how tutoring sessions occur</li>
                    </ul>
                    <p className="text-muted-foreground mb-4">
                      <strong>Tutors are independent contractors who operate their own independent tutoring businesses.</strong> Any tutoring services are provided directly by the tutor to the student. StudyBuddy is not a party to the relationship between students and tutors.
                    </p>

                    <h4 className="font-semibold mb-2">3.3 Available Features</h4>
                    <p className="text-muted-foreground mb-2">The Platform provides:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Tutor profile creation and browsing</li>
                      <li>Messaging between students and tutors</li>
                      <li>Session booking and scheduling</li>
                      <li>Payment processing</li>
                      <li>Session confirmation system</li>
                      <li>Review and rating system</li>
                      <li>Dispute resolution assistance</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">4. TUTOR-STUDENT RELATIONSHIP</h3>
                    
                    <h4 className="font-semibold mb-2">4.1 Independent Contractor Status</h4>
                    <p className="font-bold mb-2">ALL TUTORS ON STUDYBUDDY ARE INDEPENDENT CONTRACTORS, NOT EMPLOYEES OF STUDYBUDDY.</p>
                    <p className="text-muted-foreground mb-2">Tutors:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Operate independent tutoring businesses</li>
                      <li>Set their own hourly rates without restrictions from StudyBuddy</li>
                      <li>Control their own schedules and availability</li>
                      <li>Decide which session requests to accept or decline</li>
                      <li>Provide services under their own names</li>
                      <li>Are free to work with other platforms or offer services independently</li>
                      <li>Receive no employee benefits from StudyBuddy</li>
                      <li>Are responsible for their own taxes</li>
                    </ul>

                    <h4 className="font-semibold mb-2">4.2 Direct Contractual Relationship</h4>
                    <p className="font-bold mb-2">
                      When a student books a session with a tutor, the student enters into a direct contract with the tutor for tutoring services.
                    </p>
                    <p className="text-muted-foreground mb-2">StudyBuddy:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Is NOT a party to this contract</li>
                      <li>Does NOT guarantee performance by either party</li>
                      <li>Acts only as a payment processor and platform provider</li>
                      <li>Cannot enforce the tutor-student contract</li>
                    </ul>
                    <p className="text-muted-foreground mb-2">Students contract directly with tutors and are solely responsible for:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Evaluating tutor qualifications and suitability</li>
                      <li>Determining whether to engage a particular tutor</li>
                      <li>Negotiating session details (subject matter, location, duration)</li>
                      <li>Ensuring their own safety during sessions</li>
                      <li>Resolving disputes with tutors</li>
                    </ul>

                    <h4 className="font-semibold mb-2">4.3 No Agency Relationship</h4>
                    <p className="text-muted-foreground">
                      Nothing in these Terms creates an employment, agency, partnership, or joint venture relationship between StudyBuddy and any tutor or student. Tutors do not have authority to bind StudyBuddy to any obligation.
                    </p>
                  </div>

                  <div className="border-l-4 border-destructive pl-4 py-3 bg-destructive/10">
                    <h3 className="font-bold text-lg mb-3">5. WARNING: NO BACKGROUND CHECKS OR VERIFICATION</h3>
                    <p className="font-bold mb-2">⚠️ CRITICAL SAFETY NOTICE</p>
                    <p className="font-bold mb-3">
                      STUDYBUDDY DOES NOT CONDUCT BACKGROUND CHECKS, CRIMINAL HISTORY CHECKS, OR VERIFICATION OF CREDENTIALS FOR ANY TUTORS ON THE PLATFORM.
                    </p>
                    <p className="font-bold mb-2">STUDENTS ARE SOLELY AND ENTIRELY RESPONSIBLE FOR:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
                      <li>Verifying tutor qualifications, credentials, and experience</li>
                      <li>Evaluating tutor trustworthiness and character</li>
                      <li>Assessing tutor suitability for their needs</li>
                      <li>Ensuring their own safety when meeting tutors</li>
                    </ul>
                    <p className="font-bold mb-2">WE MAKE NO REPRESENTATIONS OR WARRANTIES REGARDING:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
                      <li>Tutor credentials, education, or qualifications</li>
                      <li>Tutor criminal history or background</li>
                      <li>Tutor character, honesty, or integrity</li>
                      <li>Safety of any tutor</li>
                      <li>Quality of tutoring services</li>
                    </ul>
                    <p className="mb-2">
                      <strong>Tutor profiles, reviews, and ratings are user-generated content that we do not verify or endorse.</strong> Users may provide false or misleading information. Reviews may be fake, biased, or inaccurate.
                    </p>
                    <p className="font-bold">
                      BY USING STUDYBUDDY, YOU ACKNOWLEDGE AND ACCEPT THESE RISKS.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">6. IN-PERSON SESSION SAFETY</h3>
                    
                    <h4 className="font-semibold mb-2">6.1 Platform Has No Control Over In-Person Meetings</h4>
                    <p className="text-muted-foreground mb-4">
                      StudyBuddy does not control, supervise, monitor, or participate in any in-person tutoring sessions. <strong>All in-person meetings occur entirely outside our control and at the sole risk of the participants.</strong>
                    </p>

                    <h4 className="font-semibold mb-2">6.2 Safety Recommendations (Not Requirements)</h4>
                    <p className="text-muted-foreground mb-2">We strongly recommend that users who choose to meet in person:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Meet in well-lit, public spaces such as campus libraries, coffee shops, or student centers</li>
                      <li>Avoid meeting in private residences, especially for initial sessions</li>
                      <li>Share session details (location, time, tutor name, phone number) with a trusted friend or family member</li>
                      <li>Keep mobile phones charged and accessible</li>
                      <li>Trust personal instincts and leave any situation that feels uncomfortable</li>
                      <li>Review tutor ratings and reviews before booking</li>
                      <li>Start with shorter sessions (30-60 minutes) with new tutors</li>
                      <li>Arrange transportation in advance, especially for evening sessions</li>
                    </ul>
                    <p className="text-muted-foreground mb-4">
                      <strong>These are recommendations only, not requirements.</strong> StudyBuddy cannot and does not enforce compliance with these recommendations.
                    </p>

                    <h4 className="font-semibold mb-2">6.3 Assumption of Risk</h4>
                    <p className="font-bold mb-2">
                      YOU ACKNOWLEDGE AND AGREE THAT MEETING ANYONE IN PERSON WHOM YOU MET THROUGH AN ONLINE PLATFORM CARRIES INHERENT RISKS, INCLUDING BUT NOT LIMITED TO:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Risk of physical harm, assault, robbery, or other criminal activity</li>
                      <li>Risk of property damage or theft</li>
                      <li>Risk of harassment or unwanted contact</li>
                      <li>Risk of fraud or misrepresentation</li>
                      <li>Risk of exposure to illness or disease</li>
                    </ul>
                    <p className="font-bold mb-4">
                      BY CHOOSING TO MEET A TUTOR IN PERSON, YOU VOLUNTARILY ASSUME ALL SUCH RISKS.
                    </p>

                    <h4 className="font-semibold mb-2">6.4 No Liability for In-Person Sessions</h4>
                    <p className="text-muted-foreground mb-2">
                      StudyBuddy has no liability whatsoever for any harm, injury, loss, or damage arising from in-person meetings between students and tutors, including but not limited to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Physical injury or death</li>
                      <li>Property damage or theft</li>
                      <li>Emotional distress</li>
                      <li>Sexual harassment or assault</li>
                      <li>Any criminal acts</li>
                      <li>Any other harm of any kind</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">7. ACADEMIC INTEGRITY</h3>
                    
                    <h4 className="font-semibold mb-2">7.1 Permitted Use</h4>
                    <p className="text-muted-foreground mb-2">
                      StudyBuddy is designed to facilitate legitimate educational tutoring that helps students learn and understand course material. Appropriate uses include:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Explaining concepts and principles</li>
                      <li>Teaching problem-solving methods</li>
                      <li>Reviewing course materials</li>
                      <li>Providing feedback on student work</li>
                      <li>Helping students develop their own skills</li>
                    </ul>

                    <h4 className="font-semibold mb-2">7.2 Prohibited Use</h4>
                    <p className="font-bold mb-2">
                      StudyBuddy may NOT be used for academic dishonesty of any kind, including but not limited to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Completing assignments, papers, or projects on behalf of students</li>
                      <li>Taking tests, quizzes, or exams on behalf of students</li>
                      <li>Providing direct answers to graded assignments without teaching underlying concepts</li>
                      <li>Writing papers or essays for students</li>
                      <li>Facilitating plagiarism or cheating</li>
                      <li>Violating any university honor code or academic integrity policy</li>
                    </ul>

                    <h4 className="font-semibold mb-2">7.3 User Responsibility</h4>
                    <p className="font-bold mb-2">You are solely responsible for ensuring your use of StudyBuddy complies with:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>USC's academic integrity policies</li>
                      <li>Your course syllabi and instructor guidelines</li>
                      <li>Any other applicable honor codes or academic standards</li>
                    </ul>
                    <p className="text-muted-foreground mb-4">
                      StudyBuddy is not responsible for determining what constitutes academic dishonesty in your specific courses or programs. When in doubt, consult your instructor or university academic integrity office.
                    </p>

                    <h4 className="font-semibold mb-2">7.4 Enforcement</h4>
                    <p className="text-muted-foreground">
                      Violations of academic integrity policies may result in immediate account termination without refund. We may also report suspected violations to USC or other educational institutions as appropriate.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">8. USER CONDUCT AND PROHIBITED ACTIVITIES</h3>
                    
                    <h4 className="font-semibold mb-2">8.1 General Conduct Standards</h4>
                    <p className="text-muted-foreground mb-2">You agree to use StudyBuddy in a lawful and respectful manner. You will NOT:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Harass, threaten, intimidate, or harm others</li>
                      <li>Discriminate based on race, ethnicity, religion, gender, sexual orientation, disability, or other protected characteristics</li>
                      <li>Engage in sexual harassment or unwanted sexual advances</li>
                      <li>Share others' private information without consent</li>
                      <li>Impersonate others or create fake accounts</li>
                      <li>Engage in fraud, deception, or misrepresentation</li>
                      <li>Violate any applicable laws or regulations</li>
                    </ul>

                    <h4 className="font-semibold mb-2">8.2 Prohibited Platform Activities</h4>
                    <p className="text-muted-foreground mb-2">You will NOT:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Use StudyBuddy for any commercial purpose other than providing or receiving tutoring services</li>
                      <li>Send spam, advertising, or unsolicited marketing</li>
                      <li>Scrape, data mine, or extract data from the Platform</li>
                      <li>Attempt to hack, compromise, or circumvent security measures</li>
                      <li>Use automated bots, scripts, or tools to access the Platform</li>
                      <li>Create multiple accounts to evade restrictions or bans</li>
                      <li>Manipulate reviews, ratings, or platform algorithms</li>
                      <li>Interfere with other users' use of the Platform</li>
                    </ul>

                    <h4 className="font-semibold mb-2">8.3 Content Standards</h4>
                    <p className="text-muted-foreground mb-2">Any content you post to StudyBuddy (profile information, messages, reviews, etc.) must:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Be truthful and accurate</li>
                      <li>Not violate others' intellectual property rights</li>
                      <li>Not contain malware, viruses, or harmful code</li>
                      <li>Not contain hate speech or discriminatory content</li>
                      <li>Not contain sexually explicit material</li>
                      <li>Not promote illegal activity</li>
                    </ul>

                    <h4 className="font-semibold mb-2">8.4 Reporting Violations</h4>
                    <p className="text-muted-foreground">
                      If you encounter conduct that violates these Terms, report it immediately to help@studybuddyusc.com. We will investigate reported violations in accordance with our Acceptable Use Policy.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">9. PAYMENT TERMS</h3>
                    
                    <h4 className="font-semibold mb-2">9.1 Platform Fee Structure</h4>
                    <p className="text-muted-foreground mb-2">
                      StudyBuddy charges a <strong>1% platform service fee</strong> on all completed tutoring sessions. The platform fee is:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Charged to the student, not deducted from the tutor's rate</li>
                      <li>Applied equally regardless of payment method (credit card, debit card, etc.)</li>
                      <li>Used to support platform operation, payment processing, and service improvements</li>
                    </ul>
                    <p className="font-semibold mb-2">Example:</p>
                    <div className="bg-muted/50 p-4 rounded font-mono text-xs mb-4">
                      Tutor's Hourly Rate:      $50.00<br />
                      Platform Service Fee:     $ 0.50 (1% of tutor rate)<br />
                      ─────────────────────────────────<br />
                      Total Student Pays:       $50.50<br />
                      <br />
                      Breakdown:<br />
                      - Tutor receives: $50.00<br />
                      - StudyBuddy receives: $0.50
                    </div>
                    <p className="text-muted-foreground mb-4">
                      The 1% fee applies to the tutor's rate only. It is not calculated on top of previous fees (i.e., not compounding).
                    </p>

                    <h4 className="font-semibold mb-2">9.2 Payment Processing</h4>
                    <p className="text-muted-foreground mb-2">
                      All payments are processed securely through Stripe, our third-party payment processor. StudyBuddy does not store or have access to your complete credit card information.
                    </p>
                    <p className="text-muted-foreground mb-2">By providing payment information, you:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Authorize StudyBuddy to charge your payment method for booked sessions</li>
                      <li>Represent that you are authorized to use the payment method provided</li>
                      <li>Agree to pay all charges incurred under your account</li>
                      <li>Understand that charges are in U.S. Dollars (USD)</li>
                    </ul>

                    <h4 className="font-semibold mb-2">9.3 When Payment Is Charged</h4>
                    <p className="text-muted-foreground mb-4">
                      <strong>Payment is charged to the student immediately upon booking confirmation.</strong> The charge is not a temporary hold—it is a completed transaction. If you cancel the session according to our refund policy, you will receive a refund rather than a cancelled charge.
                    </p>

                    <h4 className="font-semibold mb-2">9.4 When Tutors Receive Payment</h4>
                    <p className="text-muted-foreground mb-2">
                      Payment is released to tutors only after <strong>both the student and tutor confirm that the session occurred</strong> by marking it as complete in the Platform.
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li><strong>Both confirm within 24 hours:</strong> Payment released to tutor within 3-7 business days</li>
                      <li><strong>Only one party confirms:</strong> Automated reminders sent; partial payment may be released after investigation</li>
                      <li><strong>Neither party confirms:</strong> Case escalated for manual review</li>
                      <li><strong>Funds arrive in tutor's bank account:</strong> 2-3 business days after release (timing depends on tutor's bank)</li>
                    </ul>
                    <p className="text-muted-foreground mb-4">
                      For complete payment terms, see our Payment & Refund Policy.
                    </p>

                    <h4 className="font-semibold mb-2">9.5 No Credit Card Surcharges</h4>
                    <p className="text-muted-foreground">
                      In compliance with California's Song-Beverly Credit Card Act, StudyBuddy charges the same prices regardless of payment method. The 1% platform service fee applies equally to all payment types.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">10. CANCELLATIONS AND REFUNDS</h3>
                    
                    <h4 className="font-semibold mb-2">10.1 Student Cancellations</h4>
                    <p className="text-muted-foreground mb-3">
                      Students may cancel booked sessions according to the following schedule:
                    </p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="bg-muted/50 p-3 rounded">
                        <p className="font-semibold mb-1">24 or More Hours Before Session Start Time:</p>
                        <ul className="list-disc list-inside text-muted-foreground text-xs space-y-1 ml-4">
                          <li><strong>100% refund</strong> of total payment (tutor rate + platform fee)</li>
                          <li>Refund processed automatically via Stripe</li>
                          <li>Funds returned to original payment method within 5-10 business days</li>
                        </ul>
                      </div>

                      <div className="bg-muted/50 p-3 rounded">
                        <p className="font-semibold mb-1">2 to 24 Hours Before Session Start Time:</p>
                        <ul className="list-disc list-inside text-muted-foreground text-xs space-y-1 ml-4">
                          <li><strong>50% refund</strong> to student</li>
                          <li>Tutor receives 50% of their rate as cancellation compensation</li>
                          <li>Platform fee split proportionally</li>
                        </ul>
                      </div>

                      <div className="bg-muted/50 p-3 rounded">
                        <p className="font-semibold mb-1">Less Than 2 Hours Before Session Start Time:</p>
                        <ul className="list-disc list-inside text-muted-foreground text-xs space-y-1 ml-4">
                          <li><strong>No refund</strong> to student</li>
                          <li>Full payment (tutor rate) paid to tutor</li>
                          <li>Platform retains platform fee</li>
                        </ul>
                      </div>
                    </div>

                    <p className="font-semibold mb-2">Example:</p>
                    <div className="bg-muted/50 p-3 rounded text-xs mb-4">
                      For a session with $50 tutor rate ($50.50 total):<br />
                      • 24+ hours notice: Student refunded $50.50, tutor gets $0<br />
                      • 2-24 hours notice: Student refunded $25.25, tutor gets $25<br />
                      • Less than 2 hours: Student refunded $0, tutor gets $50
                    </div>

                    <h4 className="font-semibold mb-2">10.2 Tutor Cancellations</h4>
                    <p className="text-muted-foreground mb-2">If a tutor cancels a session for any reason:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Student receives <strong>100% refund</strong> regardless of timing</li>
                      <li>Tutor receives $0 for that session</li>
                      <li>Cancellation recorded on tutor's account</li>
                      <li>Excessive tutor cancellations may result in account suspension</li>
                    </ul>

                    <h4 className="font-semibold mb-2">10.3 No-Show Policy</h4>
                    <p className="text-muted-foreground mb-2"><strong>If student does not show up:</strong></p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>No refund to student</li>
                      <li>Full payment to tutor (if tutor was available)</li>
                    </ul>
                    <p className="text-muted-foreground mb-2"><strong>If tutor does not show up:</strong></p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Full refund to student</li>
                      <li>$0 to tutor</li>
                      <li>Violation of tutor obligations</li>
                    </ul>

                    <h4 className="font-semibold mb-2">10.4 Disputes About Session Completion</h4>
                    <p className="text-muted-foreground mb-2">If parties dispute whether a session occurred or was completed satisfactorily:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Either party can file a dispute through the Platform</li>
                      <li>StudyBuddy will investigate based on available evidence</li>
                      <li>Decision made within 2-5 business days</li>
                      <li>Either party may appeal within 7 days</li>
                    </ul>
                    <p className="text-muted-foreground">
                      For complete refund terms and dispute procedures, see our Payment & Refund Policy.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">11. MESSAGE STORAGE AND MONITORING</h3>
                    
                    <h4 className="font-semibold mb-2">11.1 Message Retention</h4>
                    <p className="font-bold mb-2">
                      All messages sent through the StudyBuddy platform are permanently stored on our secure servers.
                    </p>
                    <p className="text-muted-foreground mb-2">Messages are not deleted unless:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>You delete your entire account (messages deleted within 30 days of account deletion)</li>
                      <li>We are legally required to delete them</li>
                      <li>We determine deletion necessary for legal or safety reasons</li>
                    </ul>

                    <h4 className="font-semibold mb-2">11.2 Administrative Access</h4>
                    <p className="font-bold mb-2">
                      StudyBuddy administrators may access and review message content for the following purposes:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Safety and security monitoring (detecting harassment, threats, inappropriate conduct)</li>
                      <li>Academic integrity enforcement (identifying potential cheating or honor code violations)</li>
                      <li>Dispute resolution (when parties disagree about session details or conduct)</li>
                      <li>Law enforcement cooperation (responding to valid legal process)</li>
                      <li>Terms of Service enforcement</li>
                      <li>Platform improvement and quality assurance</li>
                    </ul>
                    <p className="font-bold mb-4">
                      You have no expectation of privacy in messages sent through the StudyBuddy platform.
                    </p>

                    <h4 className="font-semibold mb-2">11.3 Recommendations for Private Communication</h4>
                    <p className="text-muted-foreground mb-2">
                      If you wish to have private conversations not accessible to StudyBuddy, communicate outside the Platform using your own phone, email, or messaging apps. However, we encourage keeping initial communications on-platform to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Create a record for dispute resolution</li>
                      <li>Enable safety monitoring</li>
                      <li>Comply with academic integrity standards</li>
                    </ul>
                    <p className="text-muted-foreground">
                      For complete information about data collection and use, see our Privacy Policy.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">12. REVIEWS AND RATINGS</h3>
                    
                    <h4 className="font-semibold mb-2">12.1 Review System</h4>
                    <p className="text-muted-foreground mb-4">
                      Students and tutors may rate and review each other after completed sessions. Reviews help build trust and accountability in the StudyBuddy community.
                    </p>

                    <h4 className="font-semibold mb-2">12.2 Review Guidelines</h4>
                    <p className="text-muted-foreground mb-2">Reviews must:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Be based on your actual experience</li>
                      <li>Be truthful and accurate</li>
                      <li>Comply with our content standards (Section 8.3)</li>
                      <li>Not contain defamatory, harassing, or discriminatory content</li>
                      <li>Not disclose private information about others</li>
                      <li>Not be incentivized or compensated</li>
                    </ul>

                    <h4 className="font-semibold mb-2">12.3 Review Moderation</h4>
                    <p className="text-muted-foreground mb-2">StudyBuddy reserves the right to remove reviews that:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Violate these Terms or our Acceptable Use Policy</li>
                      <li>Contain false or misleading information</li>
                      <li>Are abusive, threatening, or harassing</li>
                      <li>Violate applicable laws</li>
                      <li>Are submitted by users with no actual transaction history</li>
                    </ul>
                    <p className="text-muted-foreground mb-4">
                      We do not verify the accuracy of reviews and are not responsible for review content.
                    </p>

                    <h4 className="font-semibold mb-2">12.4 No Manipulation</h4>
                    <p className="text-muted-foreground mb-2">You may not:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Offer compensation for positive reviews</li>
                      <li>Submit fake reviews</li>
                      <li>Review yourself using alternate accounts</li>
                      <li>Threaten negative reviews to extract benefits</li>
                      <li>Attempt to manipulate your rating through artificial means</li>
                    </ul>
                    <p className="text-muted-foreground">
                      Violations may result in account termination.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">13. INTELLECTUAL PROPERTY</h3>
                    
                    <h4 className="font-semibold mb-2">13.1 StudyBuddy's Intellectual Property</h4>
                    <p className="text-muted-foreground mb-3">
                      The Platform, including all content, features, functionality, software, code, designs, logos, and trademarks, is owned by StudyBuddy and protected by copyright, trademark, and other intellectual property laws.
                    </p>
                    <p className="text-muted-foreground mb-2">You may not:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Copy, modify, or create derivative works of the Platform</li>
                      <li>Reverse engineer or decompile any Platform code</li>
                      <li>Use StudyBuddy trademarks without written permission</li>
                      <li>Frame or mirror any Platform content</li>
                      <li>Remove copyright or proprietary notices</li>
                    </ul>

                    <h4 className="font-semibold mb-2">13.2 User Content License</h4>
                    <p className="text-muted-foreground mb-2">
                      You retain ownership of content you submit to StudyBuddy (profile information, messages, reviews, etc.). However, by submitting content, you grant StudyBuddy:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>A worldwide, non-exclusive, royalty-free license</li>
                      <li>To use, copy, modify, display, and distribute your content</li>
                      <li>For the purpose of operating and improving the Platform</li>
                      <li>For as long as your account remains active plus 90 days after deletion</li>
                    </ul>
                    <p className="text-muted-foreground mb-4">
                      This license allows us to display your tutor profile, show your reviews, and operate the Platform effectively.
                    </p>

                    <h4 className="font-semibold mb-2">13.3 Feedback</h4>
                    <p className="text-muted-foreground">
                      If you provide feedback, suggestions, or ideas about StudyBuddy, we may use them without any obligation to you, including no compensation or attribution.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">14. THIRD-PARTY SERVICES</h3>
                    <p className="text-muted-foreground mb-2">
                      StudyBuddy integrates with third-party service providers, including:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li><strong>Stripe:</strong> Payment processing</li>
                      <li><strong>Supabase:</strong> Data storage</li>
                      <li><strong>Google Analytics:</strong> Usage analytics (if implemented)</li>
                    </ul>
                    <p className="text-muted-foreground mb-2">
                      Your use of these services is subject to their respective terms of service and privacy policies:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Stripe: https://stripe.com/legal</li>
                      <li>Supabase: https://supabase.com/privacy</li>
                      <li>Google: https://policies.google.com/privacy</li>
                    </ul>
                    <p className="text-muted-foreground">
                      StudyBuddy is not responsible for third-party services' actions, failures, or policies.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">15. DISCLAIMERS AND LIMITATION OF LIABILITY</h3>
                    
                    <h4 className="font-semibold mb-2">15.1 Platform Provided "AS IS"</h4>
                    <p className="font-bold mb-2">
                      STUDYBUDDY IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Warranties of merchantability or fitness for a particular purpose</li>
                      <li>Warranties that the Platform will be uninterrupted, error-free, or secure</li>
                      <li>Warranties regarding the accuracy, reliability, or quality of any content or information</li>
                    </ul>
                    <p className="text-muted-foreground mb-2">WE DO NOT WARRANT THAT:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>The Platform will meet your requirements</li>
                      <li>Platform operation will be secure or error-free</li>
                      <li>Defects will be corrected</li>
                      <li>The Platform is free of viruses or harmful components</li>
                    </ul>

                    <h4 className="font-semibold mb-2">15.2 No Warranty Regarding Tutors or Students</h4>
                    <p className="font-bold mb-2">STUDYBUDDY MAKES NO REPRESENTATIONS OR WARRANTIES ABOUT:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>The qualifications, skills, credentials, or competence of any tutor</li>
                      <li>The safety, reliability, or trustworthiness of any user</li>
                      <li>The quality of tutoring services provided</li>
                      <li>The accuracy of user profiles, reviews, or ratings</li>
                      <li>The success or outcomes of any tutoring relationship</li>
                    </ul>
                    <p className="font-bold mb-4">YOU USE STUDYBUDDY ENTIRELY AT YOUR OWN RISK.</p>

                    <h4 className="font-semibold mb-2">15.3 Limitation of Liability</h4>
                    <p className="font-bold mb-2">TO THE MAXIMUM EXTENT PERMITTED BY CALIFORNIA LAW:</p>
                    <p className="text-muted-foreground mb-2">
                      STUDYBUDDY, ITS OFFICERS, DIRECTORS, EMPLOYEES, AFFILIATES, AND AGENTS SHALL NOT BE LIABLE FOR:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Any indirect, incidental, consequential, special, exemplary, or punitive damages</li>
                      <li>Loss of profits, revenue, data, or business opportunities</li>
                      <li>Personal injury, property damage, or emotional distress arising from Platform use</li>
                      <li>Any damages arising from tutor-student interactions or relationships</li>
                      <li>Any damages from Platform errors, interruptions, or security breaches</li>
                      <li>Any damages from third-party conduct (including tutors and students)</li>
                      <li>Any damages exceeding the amount you paid to StudyBuddy in the 12 months preceding the claim</li>
                    </ul>
                    <p className="font-bold mb-2">IMPORTANT CALIFORNIA LAW NOTICE:</p>
                    <p className="text-muted-foreground mb-2">This limitation of liability does NOT apply to:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Gross negligence, fraud, or willful misconduct by StudyBuddy</li>
                      <li>Violations of law by StudyBuddy</li>
                      <li>Liability that cannot be limited under California Civil Code § 1668</li>
                    </ul>
                    <p className="text-muted-foreground mb-4">
                      For claims arising from tutor or student conduct (including in-person session incidents), you agree to look solely to the tutor or student for compensation, not to StudyBuddy.
                    </p>

                    <h4 className="font-semibold mb-2">15.4 California Consumer Rights Preserved</h4>
                    <p className="text-muted-foreground mb-2">Nothing in these Terms limits your rights under:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>California Consumer Legal Remedies Act (Civil Code §§ 1750-1784)</li>
                      <li>California Consumers Legal Remedies Act</li>
                      <li>Other California consumer protection laws</li>
                    </ul>
                    <p className="text-muted-foreground">
                      You retain all rights that cannot be waived under California law.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">16. INDEMNIFICATION</h3>
                    <p className="text-muted-foreground mb-2">
                      You agree to indemnify, defend, and hold harmless StudyBuddy, its officers, directors, employees, affiliates, agents, and licensors from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising from or related to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Your use of the Platform</li>
                      <li>Your violation of these Terms</li>
                      <li>Your violation of any law or regulation</li>
                      <li>Your violation of any third-party rights (including intellectual property, privacy, or publicity rights)</li>
                      <li>Any content you submit to the Platform</li>
                      <li>Your interactions with other users (whether online or in-person)</li>
                      <li>Your provision or receipt of tutoring services</li>
                    </ul>
                    <p className="text-muted-foreground mb-3">
                      This indemnification obligation survives termination of your account and these Terms.
                    </p>
                    <p className="text-muted-foreground">
                      StudyBuddy reserves the right to assume exclusive defense and control of any matter subject to indemnification, at your expense.
                    </p>
                  </div>

                  <div className="border-l-4 border-destructive pl-4 py-3 bg-destructive/10">
                    <h3 className="font-bold text-lg mb-3">17. DISPUTE RESOLUTION: ARBITRATION AGREEMENT</h3>
                    <p className="font-bold mb-3">
                      PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS, INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT.
                    </p>

                    <h4 className="font-semibold mb-2">17.1 Agreement to Arbitrate</h4>
                    <p className="font-bold mb-2">
                      You and StudyBuddy agree to resolve all disputes through binding individual arbitration rather than lawsuits in court, except as specified in Section 17.7.
                    </p>
                    <p className="text-sm mb-3">
                      This arbitration agreement is governed by the <strong>Federal Arbitration Act (FAA), 9 U.S.C. § 1 et seq.</strong>, which preempts conflicting state law.
                    </p>
                    <p className="text-sm mb-3">
                      "Dispute" means any controversy or claim between you and StudyBuddy relating to: These Terms or their interpretation, the Platform or services, your account, privacy or data security, or any aspect of your relationship with StudyBuddy.
                    </p>

                    <h4 className="font-semibold mb-2">17.2 Mandatory Exception: Sexual Assault and Harassment Claims</h4>
                    <p className="font-bold text-sm mb-2">
                      Notwithstanding any other provision of this Agreement, claims of sexual assault or sexual harassment CANNOT be compelled to arbitration and may be brought in court.
                    </p>
                    <p className="text-sm mb-3">
                      This exception is required by the Ending Forced Arbitration of Sexual Assault and Sexual Harassment Act of 2021 (EFAA), which amends the Federal Arbitration Act.
                    </p>

                    <h4 className="font-semibold mb-2">17.3 Informal Resolution Requirement</h4>
                    <p className="text-sm mb-2">
                      Before initiating arbitration, you must first attempt to resolve the dispute informally by sending written notice to:
                    </p>
                    <div className="bg-background/50 p-3 rounded text-sm mb-3">
                      <strong>StudyBuddy LLC</strong><br />
                      1170 Edmar Ln<br />
                      Santa Cruz, CA 90562<br />
                      Email: help@studybuddyusc.com
                    </div>
                    <p className="text-sm mb-3">
                      The notice must describe the dispute and your desired resolution. We will attempt to resolve the dispute within 30 days. If unresolved after 30 days, either party may initiate arbitration.
                    </p>

                    <h4 className="font-semibold mb-2">17.4 Arbitration Procedures</h4>
                    <ul className="list-disc list-inside text-sm space-y-1 ml-4 mb-3">
                      <li><strong>Arbitration Provider:</strong> American Arbitration Association (AAA) or JAMS</li>
                      <li><strong>Rules:</strong> AAA Commercial Arbitration Rules or JAMS Comprehensive Rules</li>
                      <li><strong>Location:</strong> Los Angeles County, California, or via video conference (your choice)</li>
                      <li><strong>Arbitrator:</strong> Single neutral arbitrator selected under provider rules</li>
                      <li><strong>Discovery:</strong> Limited discovery as determined by arbitrator</li>
                    </ul>
                    <p className="text-sm mb-3">
                      The arbitrator may award any relief that would be available in court, including monetary damages, injunctive relief, or declaratory relief.
                    </p>

                    <h4 className="font-semibold mb-2">17.5 Arbitration Fees</h4>
                    <p className="text-sm mb-2"><strong>For claims under $10,000:</strong></p>
                    <ul className="list-disc list-inside text-sm space-y-1 ml-4 mb-2">
                      <li>StudyBuddy pays all arbitration fees</li>
                      <li>You only pay your attorney fees (if you choose to hire an attorney)</li>
                    </ul>
                    <p className="text-sm mb-2"><strong>For claims $10,000 or greater:</strong></p>
                    <ul className="list-disc list-inside text-sm space-y-1 ml-4 mb-3">
                      <li>Fees split according to AAA/JAMS rules</li>
                      <li>Each party pays own attorney fees unless arbitrator awards fees to prevailing party</li>
                    </ul>

                    <h4 className="font-semibold mb-2">17.6 Class Action Waiver</h4>
                    <p className="font-bold text-sm mb-2">
                      YOU AND STUDYBUDDY AGREE THAT DISPUTES WILL BE RESOLVED ON AN INDIVIDUAL BASIS ONLY.
                    </p>
                    <p className="text-sm mb-2">You may not:</p>
                    <ul className="list-disc list-inside text-sm space-y-1 ml-4 mb-2">
                      <li>Bring claims as a plaintiff or class member in any class, collective, or representative action</li>
                      <li>Consolidate your arbitration with others' arbitrations</li>
                      <li>Participate in class-wide arbitration</li>
                    </ul>
                    <p className="text-sm mb-3">Each party may bring claims only in their individual capacity.</p>
                    <p className="text-sm mb-3">
                      If a court finds the class action waiver unenforceable, this entire arbitration agreement is void, and disputes will proceed in court.
                    </p>

                    <h4 className="font-semibold mb-2">17.7 Exceptions to Arbitration</h4>
                    <p className="text-sm mb-2">The following claims are NOT subject to arbitration and may be brought in court:</p>
                    <ul className="list-disc list-inside text-sm space-y-1 ml-4 mb-3">
                      <li>Sexual assault or sexual harassment claims (EFAA exception)</li>
                      <li>Small claims court actions (if they qualify under small claims rules)</li>
                      <li>Claims for injunctive relief to stop unauthorized use of intellectual property</li>
                      <li>Claims that cannot be arbitrated under applicable law</li>
                    </ul>

                    <h4 className="font-semibold mb-2">17.8 Opt-Out Right</h4>
                    <p className="font-bold text-sm mb-2">
                      You have the right to opt out of this arbitration agreement within 30 days of first accepting these Terms.
                    </p>
                    <p className="text-sm mb-2">To opt out, send written notice to:</p>
                    <div className="bg-background/50 p-3 rounded text-sm mb-2">
                      <strong>StudyBuddy LLC</strong><br />
                      1170 Edmar Ln<br />
                      Santa Cruz, CA 90562<br />
                      Email: help@studybuddyusc.com
                    </div>
                    <p className="text-sm mb-3">
                      The notice must include your name, email address, and a clear statement that you wish to opt out of the arbitration agreement.
                    </p>
                    <p className="text-sm">
                      If you opt out, all disputes will be resolved in court according to Section 18.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">18. GOVERNING LAW AND VENUE</h3>
                    
                    <h4 className="font-semibold mb-2">18.1 Governing Law</h4>
                    <p className="text-muted-foreground mb-4">
                      These Terms are governed by the laws of the State of California and the laws of the United States, without regard to conflict of law principles.
                    </p>

                    <h4 className="font-semibold mb-2">18.2 Venue for Non-Arbitrated Claims</h4>
                    <p className="text-muted-foreground mb-2">
                      For any claims not subject to arbitration (either because you opted out or because they fall under exceptions in Section 17.7), you agree that:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Exclusive jurisdiction lies in the state or federal courts located in Los Angeles County, California</li>
                      <li>You submit to the personal jurisdiction of these courts</li>
                      <li>Venue is proper in Los Angeles County, California</li>
                    </ul>
                    <p className="text-muted-foreground">
                      You waive any objection to venue or personal jurisdiction in these courts.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">19. ACCOUNT TERMINATION</h3>
                    
                    <h4 className="font-semibold mb-2">19.1 Termination by You</h4>
                    <p className="text-muted-foreground mb-2">
                      You may delete your account at any time through your account settings or by contacting help@studybuddyusc.com. Upon account deletion:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Your access to the Platform terminates immediately</li>
                      <li>Your profile is removed from tutor listings (if applicable)</li>
                      <li>Pending sessions are cancelled with refunds processed according to our refund policy</li>
                      <li>Your personal data is deleted within 30 days (except as required for legal, tax, or dispute resolution purposes)</li>
                    </ul>

                    <h4 className="font-semibold mb-2">19.2 Termination by StudyBuddy</h4>
                    <p className="text-muted-foreground mb-2">
                      We reserve the right to suspend or terminate your account immediately, without prior notice, if:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>You violate these Terms or our Acceptable Use Policy</li>
                      <li>We suspect fraudulent, abusive, or illegal activity</li>
                      <li>You engage in conduct harmful to other users or to StudyBuddy</li>
                      <li>You attempt to circumvent payment systems or platform security</li>
                      <li>We are required to do so by law or legal process</li>
                      <li>We cease operating the Platform</li>
                    </ul>

                    <h4 className="font-semibold mb-2">19.3 Effect of Termination</h4>
                    <p className="text-muted-foreground mb-2">Upon termination:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>All licenses granted under these Terms immediately terminate</li>
                      <li>You must stop using the Platform</li>
                      <li>Unpaid amounts become immediately due</li>
                      <li>Pending sessions are cancelled with refunds handled on a case-by-case basis</li>
                      <li>We may delete or retain your data as described in our Privacy Policy</li>
                    </ul>

                    <h4 className="font-semibold mb-2">19.4 Survival</h4>
                    <p className="text-muted-foreground mb-4">
                      Sections of these Terms that by their nature should survive termination will survive, including: payment obligations, disclaimers, limitations of liability, indemnification, dispute resolution, and governing law.
                    </p>

                    <h4 className="font-semibold mb-2">19.5 No Refund Upon Termination for Violation</h4>
                    <p className="text-muted-foreground">
                      If we terminate your account due to your violation of these Terms, you are not entitled to any refund of fees paid.
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4 py-3 bg-muted/50">
                    <h3 className="font-bold text-lg mb-3">20. USC DISCLAIMER</h3>
                    <p className="font-bold mb-3">
                      IMPORTANT: STUDYBUDDY IS AN INDEPENDENT PLATFORM AND IS NOT AFFILIATED WITH, ENDORSED BY, SPONSORED BY, OR OFFICIALLY CONNECTED WITH THE UNIVERSITY OF SOUTHERN CALIFORNIA.
                    </p>
                    <p className="text-sm mb-3">
                      USC, Trojans, Fight On, and related marks are registered trademarks of the University of Southern California. StudyBuddy uses these terms for descriptive purposes only to indicate that our services are available to USC students.
                    </p>
                    <p className="text-sm mb-2">
                      Any references to USC in our marketing materials, Platform, or communications:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1 ml-4 mb-3">
                      <li>Are purely descriptive of our target user base</li>
                      <li>Do not imply any official relationship, affiliation, or endorsement</li>
                      <li>Do not suggest that StudyBuddy is operated by USC or any USC entity</li>
                    </ul>
                    <p className="text-sm">
                      StudyBuddy operates independently of USC. USC has not reviewed, approved, or endorsed our Platform or services.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">21. GENERAL PROVISIONS</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold mb-1">21.1 Entire Agreement</h4>
                        <p className="text-muted-foreground text-sm">
                          These Terms, together with our Privacy Policy, Acceptable Use Policy, and Payment & Refund Policy, constitute the entire agreement between you and StudyBuddy regarding the Platform.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-1">21.2 Severability</h4>
                        <p className="text-muted-foreground text-sm">
                          If any provision of these Terms is found unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-1">21.3 No Waiver</h4>
                        <p className="text-muted-foreground text-sm">
                          Our failure to enforce any provision of these Terms does not waive our right to enforce that provision later. Any waiver must be in writing and signed by an authorized StudyBuddy representative.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-1">21.4 Assignment</h4>
                        <p className="text-muted-foreground text-sm">
                          You may not assign or transfer these Terms or your account without our written consent. StudyBuddy may assign these Terms to any affiliate or in connection with a merger, acquisition, or sale of assets.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-1">21.5 Force Majeure</h4>
                        <p className="text-muted-foreground text-sm">
                          StudyBuddy is not liable for any failure or delay in performance due to circumstances beyond our reasonable control, including acts of God, war, terrorism, riots, internet or telecommunications failures, or government actions.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-1">21.6 Relationship of Parties</h4>
                        <p className="text-muted-foreground text-sm">
                          You and StudyBuddy are independent contractors. Nothing in these Terms creates an employment, agency, partnership, or joint venture relationship.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-1">21.7 No Third-Party Beneficiaries</h4>
                        <p className="text-muted-foreground text-sm">
                          These Terms are for the sole benefit of you and StudyBuddy. No other person or entity has any rights under these Terms.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-1">21.8 Notices</h4>
                        <p className="text-muted-foreground text-sm mb-2">
                          <strong>Notices to you:</strong> We may provide notices via email to the address associated with your account, by posting on the Platform, or through in-app notifications. Notices via email are effective when sent.
                        </p>
                        <p className="text-muted-foreground text-sm mb-2">
                          <strong>Notices to us:</strong> Send legal notices to:
                        </p>
                        <div className="bg-muted/50 p-3 rounded text-sm">
                          <strong>StudyBuddy LLC</strong><br />
                          1170 Edmar Ln<br />
                          Santa Cruz, CA 90562<br />
                          Email: help@studybuddyusc.com
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-1">21.9 Language</h4>
                        <p className="text-muted-foreground text-sm">
                          These Terms are drafted in English. Any translations are provided for convenience only. In case of conflict, the English version controls.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">22. CONTACT INFORMATION</h3>
                    <p className="text-muted-foreground mb-2"><strong>For all inquiries:</strong></p>
                    <div className="bg-muted/50 p-3 rounded text-sm">
                      Email: help@studybuddyusc.com<br />
                      Address: 1170 Edmar Ln, Santa Cruz, CA 90562
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-6">
                    <p className="font-bold text-center mb-2">
                      BY CLICKING "I ACCEPT," CREATING AN ACCOUNT, OR USING STUDYBUDDY, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.
                    </p>
                    <p className="text-sm text-muted-foreground text-center">
                      Last Updated: October 5, 2025 | Version 1.0
                    </p>
                  </div>
                </div>
              </section>

              {/* Privacy Policy */}
              <section>
                <h2 className="text-2xl font-bold mb-4">STUDYBUDDY PRIVACY POLICY</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  <strong>Last Updated: October 6, 2025</strong><br />
                  <strong>Effective Date: October 6, 2025</strong>
                </p>

                <div className="space-y-8 text-sm">
                  <p className="text-muted-foreground mb-4">
                    StudyBuddy LLC ("StudyBuddy," "we," "us," or "our") operates the StudyBuddy platform (the "Platform"), a marketplace connecting students with independent tutors. This Privacy Policy explains how we collect, use, share, and protect your personal information.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    <strong>BY USING STUDYBUDDY, YOU AGREE TO THIS PRIVACY POLICY.</strong> If you do not agree, please do not use the Platform.
                  </p>

                  <div>
                    <h3 className="font-bold text-lg mb-3">TABLE OF CONTENTS</h3>
                    <ol className="list-decimal list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Information We Collect</li>
                      <li>How We Use Your Information</li>
                      <li>How We Share Your Information</li>
                      <li>Message Storage and Administrative Access</li>
                      <li>Cookies and Tracking Technologies</li>
                      <li>Data Retention</li>
                      <li>Your California Privacy Rights (CCPA/CPRA)</li>
                      <li>Your Rights Under CalOPPA</li>
                      <li>Educational Records and FERPA</li>
                      <li>Data Security</li>
                      <li>Data Breach Notification</li>
                      <li>Children's Privacy</li>
                      <li>International Users</li>
                      <li>Changes to This Privacy Policy</li>
                      <li>Contact Information</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">1. INFORMATION WE COLLECT</h3>
                    
                    <h4 className="font-semibold mb-2">1.1 Information You Provide Directly</h4>
                    
                    <div className="mb-4">
                      <p className="font-medium mb-2">Account Information:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                        <li>Full name</li>
                        <li>USC email address (@usc.edu)</li>
                        <li>Password (encrypted)</li>
                        <li>Phone number (optional)</li>
                        <li>Profile photo (optional)</li>
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="font-medium mb-2">Profile Information (for Tutors):</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                        <li>Bio and introduction</li>
                        <li>Education background (degree, major, year)</li>
                        <li>Subjects and courses you can tutor</li>
                        <li>Hourly rate</li>
                        <li>Availability schedule</li>
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="font-medium mb-2">Academic Information (for Tutor Applications):</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                        <li>GPA (self-reported)</li>
                        <li>Transcripts (uploaded temporarily for verification purposes only)</li>
                        <li>Courses completed</li>
                        <li>Academic credentials or certifications</li>
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="font-medium mb-2">Payment Information:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                        <li>Payment method details (processed and stored by Stripe, not by StudyBuddy)</li>
                        <li>Billing address</li>
                        <li>Transaction history</li>
                        <li>Taxpayer Identification Number for tutors (collected via Stripe for tax reporting)</li>
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="font-medium mb-2">Communications:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                        <li>Messages sent through the Platform</li>
                        <li>Emails to our support team</li>
                        <li>Survey responses or feedback</li>
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="font-medium mb-2">Session Information:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                        <li>Booking details (tutor, student, subject, date, time, duration)</li>
                        <li>Session notes (if provided)</li>
                        <li>Session confirmation status</li>
                        <li>Cancellation information</li>
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="font-medium mb-2">Reviews and Ratings:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                        <li>Reviews you write about tutors or students</li>
                        <li>Ratings you give or receive</li>
                      </ul>
                    </div>

                    <h4 className="font-semibold mb-2 mt-4">1.2 Information Collected Automatically</h4>
                    
                    <div className="mb-4">
                      <p className="font-medium mb-2">Device and Usage Information:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                        <li>IP address</li>
                        <li>Browser type and version</li>
                        <li>Device type (mobile, tablet, desktop)</li>
                        <li>Operating system</li>
                        <li>Pages visited on the Platform</li>
                        <li>Features used</li>
                        <li>Time spent on each page</li>
                        <li>Referring website or source</li>
                        <li>Date and time of visits</li>
                        <li>Click patterns and navigation paths</li>
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="font-medium mb-2">Cookies and Similar Technologies:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                        <li>Session cookies (expire when you close browser)</li>
                        <li>Preference cookies (remember your settings)</li>
                        <li>Analytics cookies (understand how you use the Platform)</li>
                      </ul>
                      <p className="text-muted-foreground mt-2">
                        For more details, see Section 5 "Cookies and Tracking Technologies."
                      </p>
                    </div>

                    <div className="mb-4">
                      <p className="font-medium mb-2">Location Information:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                        <li>Approximate location based on IP address</li>
                        <li>Location information you provide for in-person sessions (if applicable)</li>
                      </ul>
                      <p className="text-muted-foreground mt-2">
                        We do NOT collect precise geolocation data without your explicit consent.
                      </p>
                    </div>

                    <h4 className="font-semibold mb-2 mt-4">1.3 Information from Third Parties</h4>
                    
                    <div className="mb-4">
                      <p className="font-medium mb-2">Payment Processor (Stripe):</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                        <li>Payment transaction details</li>
                        <li>Payment method verification status</li>
                        <li>Fraud detection information</li>
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="font-medium mb-2">USC Email Verification:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                        <li>Confirmation that email is valid USC email address</li>
                        <li>No other information obtained from USC</li>
                      </ul>
                    </div>

                    <p className="text-muted-foreground">
                      We do NOT receive information from social media platforms, data brokers, or other third-party sources.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">2. HOW WE USE YOUR INFORMATION</h3>
                    <p className="text-muted-foreground mb-4">
                      We use your information for the following purposes:
                    </p>

                    <h4 className="font-semibold mb-2">2.1 Platform Operation and Service Provision</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Create and manage your account</li>
                      <li>Enable you to use Platform features</li>
                      <li>Match students with appropriate tutors</li>
                      <li>Facilitate booking and scheduling of sessions</li>
                      <li>Process payments and payouts</li>
                      <li>Send transactional emails and notifications (booking confirmations, payment receipts, session reminders)</li>
                      <li>Provide customer support</li>
                      <li>Communicate with you about your account or services</li>
                    </ul>

                    <h4 className="font-semibold mb-2">2.2 Safety, Security, and Trust</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Verify USC student/alumni/faculty/staff status</li>
                      <li>Detect and prevent fraud, abuse, or policy violations</li>
                      <li>Monitor for academic dishonesty</li>
                      <li>Investigate reported safety concerns</li>
                      <li>Enforce our Terms of Service and Acceptable Use Policy</li>
                      <li>Protect the rights and safety of users</li>
                      <li>Comply with legal obligations</li>
                    </ul>

                    <h4 className="font-semibold mb-2">2.3 Platform Improvement</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Analyze usage patterns and trends</li>
                      <li>Improve Platform functionality and user experience</li>
                      <li>Develop new features</li>
                      <li>Fix bugs and technical issues</li>
                      <li>Optimize Platform performance</li>
                    </ul>

                    <h4 className="font-semibold mb-2">2.4 Dispute Resolution</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Investigate disputes between students and tutors</li>
                      <li>Review session completion disagreements</li>
                      <li>Resolve payment disputes</li>
                      <li>Provide evidence in legal proceedings (if required)</li>
                    </ul>

                    <h4 className="font-semibold mb-2">2.5 Legal Compliance and Protection</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Comply with applicable laws and regulations</li>
                      <li>Respond to legal process (subpoenas, court orders, law enforcement requests)</li>
                      <li>Protect our legal rights and interests</li>
                      <li>Prevent illegal activity</li>
                    </ul>

                    <h4 className="font-semibold mb-2">2.6 Marketing and Communications (with your consent)</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Send promotional emails about new features or updates (you can opt out)</li>
                      <li>Conduct surveys or request feedback</li>
                      <li>Send Platform news or announcements</li>
                    </ul>

                    <p className="text-muted-foreground font-medium">
                      We do NOT sell your personal information for marketing purposes.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">3. HOW WE SHARE YOUR INFORMATION</h3>

                    <h4 className="font-semibold mb-2">3.1 Public Information</h4>
                    <p className="text-muted-foreground mb-2">
                      <strong>The following information is visible to other users on the Platform:</strong>
                    </p>

                    <div className="mb-4">
                      <p className="font-medium mb-2">Tutor Profiles (visible to all students):</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                        <li>Name</li>
                        <li>Profile photo</li>
                        <li>Bio and introduction</li>
                        <li>Education background (degree, major, year)</li>
                        <li>Subjects and courses offered</li>
                        <li>Hourly rate</li>
                        <li>Availability</li>
                        <li>Reviews and ratings</li>
                        <li>Number of completed sessions</li>
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="font-medium mb-2">Student Information (visible only to tutors you book with):</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                        <li>First name and last initial (e.g., "John S.")</li>
                        <li>Profile photo (if provided)</li>
                        <li>Reviews and ratings (if any)</li>
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="font-medium mb-2">Reviews and Ratings:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                        <li>Reviews you write are visible to all users</li>
                        <li>Your name and profile photo appear with your reviews</li>
                      </ul>
                    </div>

                    <h4 className="font-semibold mb-2 mt-4">3.2 Service Providers</h4>
                    <p className="text-muted-foreground mb-2">
                      We share information with third-party service providers who assist in Platform operations. <strong>All service providers are contractually bound to:</strong>
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Use data only for specified purposes</li>
                      <li>Maintain reasonable security measures</li>
                      <li>Not sell or share data</li>
                      <li>Comply with applicable privacy laws</li>
                      <li>Notify us of data breaches within 72 hours</li>
                      <li>Delete or return data upon contract termination (except where retention required by law)</li>
                    </ul>

                    <p className="font-medium mb-2"><strong>Our Service Providers:</strong></p>

                    <div className="mb-3">
                      <p className="font-medium">Stripe (Payment Processing)</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm">
                        <li>Information shared: Name, email, payment method, billing address, transaction amounts, payment history</li>
                        <li>Purpose: Process payments from students to tutors</li>
                        <li>Privacy policy: https://stripe.com/privacy</li>
                        <li>Stripe also collects Taxpayer ID from tutors for tax reporting (1099-NEC and 1099-K)</li>
                      </ul>
                    </div>

                    <div className="mb-3">
                      <p className="font-medium">Supabase (Data Storage)</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm">
                        <li>Information shared: All user account information, messages, session data, academic records, profile information</li>
                        <li>Purpose: Cloud database and storage services</li>
                        <li>Privacy policy: https://supabase.com/privacy</li>
                        <li>Server location: United States</li>
                      </ul>
                    </div>

                    <div className="mb-3">
                      <p className="font-medium">Lovable (Platform Development)</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm">
                        <li>Information shared: Access to platform data during development, debugging, and technical support</li>
                        <li>Purpose: Platform development and technical support services</li>
                        <li>Access: Limited to specific troubleshooting and development activities</li>
                      </ul>
                    </div>

                    <div className="mb-3">
                      <p className="font-medium">Qualtrics (Transcript Processing)</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm">
                        <li>Information shared: Tutor transcripts uploaded for verification</li>
                        <li>Purpose: Temporary storage during tutor application review</li>
                        <li>Retention: Permanently deleted within 48 hours of approval/rejection decision</li>
                        <li>Privacy policy: https://www.qualtrics.com/privacy-statement/</li>
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="font-medium">Google Analytics (Usage Analytics) - If/When Implemented</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm">
                        <li>Information shared: Anonymized IP addresses, page views, session duration, referral sources, device information</li>
                        <li>Purpose: Understand how users interact with Platform to improve functionality</li>
                        <li>Privacy policy: https://policies.google.com/privacy</li>
                        <li>Users can opt out via browser settings or browser extensions</li>
                      </ul>
                    </div>

                    <h4 className="font-semibold mb-2">3.3 Legal Requirements and Protection</h4>
                    <p className="text-muted-foreground mb-2">
                      We may share information when we believe in good faith that disclosure is necessary to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li><strong>Comply with law:</strong> Respond to subpoenas, court orders, legal process, or governmental requests</li>
                      <li><strong>Enforce our rights:</strong> Enforce Terms of Service or other agreements</li>
                      <li><strong>Protect safety:</strong> Protect the safety, rights, or property of StudyBuddy, users, or the public</li>
                      <li><strong>Prevent fraud or illegal activity:</strong> Detect, investigate, or prevent fraudulent, abusive, or illegal activity</li>
                      <li><strong>Defend legal claims:</strong> Defend against legal claims or investigations</li>
                    </ul>
                    <p className="text-muted-foreground mb-4">
                      We will notify you of legal requests for your information unless prohibited by law or court order.
                    </p>

                    <h4 className="font-semibold mb-2">3.4 Business Transfers</h4>
                    <p className="text-muted-foreground mb-4">
                      If StudyBuddy is involved in a merger, acquisition, asset sale, bankruptcy, or similar transaction:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Your information may be transferred to the acquiring entity</li>
                      <li>We will provide notice before your information is transferred and becomes subject to a different privacy policy</li>
                    </ul>

                    <h4 className="font-semibold mb-2">3.5 With Your Consent</h4>
                    <p className="text-muted-foreground mb-4">
                      We may share information in other circumstances with your explicit consent.
                    </p>

                    <h4 className="font-semibold mb-2">3.6 Aggregate and De-Identified Information</h4>
                    <p className="text-muted-foreground mb-2">
                      We may share aggregate, de-identified, or anonymized information that cannot reasonably be used to identify you, such as:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Statistics about Platform usage</li>
                      <li>Trends in tutoring demand by subject</li>
                      <li>Average session ratings</li>
                    </ul>
                    <p className="text-muted-foreground">
                      This information is NOT considered personal information and is not subject to this Privacy Policy's restrictions.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">4. MESSAGE STORAGE AND ADMINISTRATIVE ACCESS</h3>
                    
                    <div className="border-l-4 border-destructive pl-4 py-3 bg-destructive/10 mb-4">
                      <p className="font-bold mb-2">⚠️ CRITICAL PRIVACY NOTICE</p>
                      <p className="text-muted-foreground">
                        <strong>ALL MESSAGES SENT THROUGH THE STUDYBUDDY PLATFORM ARE PERMANENTLY STORED ON OUR SECURE SERVERS.</strong>
                      </p>
                    </div>

                    <h4 className="font-semibold mb-2">4.1 Message Retention</h4>
                    <p className="text-muted-foreground mb-2">
                      Messages exchanged between students and tutors through the Platform are:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Stored permanently until you delete your account</li>
                      <li>Retained for 30 days after account deletion</li>
                      <li>Not automatically deleted</li>
                    </ul>

                    <h4 className="font-semibold mb-2">4.2 Administrative Access to Messages</h4>
                    <p className="text-muted-foreground mb-2">
                      <strong>STUDYBUDDY ADMINISTRATORS MAY ACCESS AND REVIEW MESSAGE CONTENT</strong> for the following purposes:
                    </p>

                    <ol className="list-decimal list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                      <li>
                        <strong>Safety and Security Monitoring</strong>
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li>Detecting harassment, threats, or inappropriate conduct</li>
                          <li>Identifying potentially dangerous situations</li>
                          <li>Preventing harm to users</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Academic Integrity Enforcement</strong>
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li>Identifying potential cheating or honor code violations</li>
                          <li>Detecting assignment completion services</li>
                          <li>Monitoring for contract cheating</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Dispute Resolution</strong>
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li>When parties disagree about session details, completion, or conduct</li>
                          <li>Investigating payment disputes</li>
                          <li>Resolving conflicts between students and tutors</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Law Enforcement Cooperation</strong>
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li>Responding to valid legal process (subpoenas, court orders)</li>
                          <li>Cooperating with criminal investigations</li>
                          <li>Complying with legal obligations</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Terms of Service Enforcement</strong>
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li>Investigating reported violations</li>
                          <li>Enforcing Platform policies</li>
                          <li>Taking action against policy violators</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Platform Improvement and Quality Assurance</strong>
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li>Understanding how users communicate</li>
                          <li>Improving messaging features</li>
                          <li>Testing new functionality</li>
                        </ul>
                      </li>
                    </ol>

                    <h4 className="font-semibold mb-2">4.3 No Expectation of Privacy</h4>
                    <p className="text-muted-foreground mb-4">
                      <strong>YOU HAVE NO EXPECTATION OF PRIVACY IN MESSAGES SENT THROUGH THE STUDYBUDDY PLATFORM.</strong>
                    </p>
                    <p className="text-muted-foreground mb-4">
                      Messages may be reviewed by our Trust & Safety team, administrators, or authorized personnel without prior notice to you.
                    </p>

                    <h4 className="font-semibold mb-2">4.4 Recommendations for Private Communication</h4>
                    <p className="text-muted-foreground mb-2">
                      If you wish to have private conversations not accessible to StudyBuddy:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Communicate outside the Platform using your own phone, email, or messaging apps</li>
                      <li>Exchange contact information and communicate directly</li>
                    </ul>
                    <p className="text-muted-foreground mb-2">
                      <strong>However,</strong> we encourage keeping initial communications on-platform to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Create a record for potential dispute resolution</li>
                      <li>Enable safety monitoring</li>
                      <li>Maintain transaction history</li>
                      <li>Comply with academic integrity standards</li>
                    </ul>

                    <h4 className="font-semibold mb-2">4.5 Message Access Logs</h4>
                    <p className="text-muted-foreground mb-2">
                      We maintain audit logs of all administrative access to messages, including:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Who accessed messages</li>
                      <li>When they were accessed</li>
                      <li>Reason for access</li>
                      <li>What actions were taken</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">5. COOKIES AND TRACKING TECHNOLOGIES</h3>

                    <h4 className="font-semibold mb-2">5.1 What Are Cookies?</h4>
                    <p className="text-muted-foreground mb-4">
                      Cookies are small text files stored on your device by your web browser. They allow websites to remember information about your visit.
                    </p>

                    <h4 className="font-semibold mb-2">5.2 Types of Cookies We Use</h4>
                    
                    <div className="mb-3">
                      <p className="font-medium mb-1">Essential Cookies (Required):</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm">
                        <li>Session cookies that keep you logged in</li>
                        <li>Security cookies that protect your account</li>
                        <li>Authentication cookies that verify your identity</li>
                      </ul>
                      <p className="text-muted-foreground text-sm mt-1">
                        These cookies are necessary for the Platform to function and cannot be disabled.
                      </p>
                    </div>

                    <div className="mb-3">
                      <p className="font-medium mb-1">Preference Cookies (Optional):</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm">
                        <li>Remember your language settings</li>
                        <li>Remember your theme preferences</li>
                        <li>Save your search or filter preferences</li>
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="font-medium mb-1">Analytics Cookies (Optional) - If/When Implemented:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm">
                        <li>Google Analytics cookies that track usage patterns</li>
                        <li>Cookies that measure feature performance</li>
                        <li>Cookies that help us understand user behavior</li>
                      </ul>
                    </div>

                    <h4 className="font-semibold mb-2">5.3 How to Control Cookies</h4>
                    <p className="text-muted-foreground mb-2">
                      You can control cookies through your browser settings:
                    </p>
                    <p className="font-medium mb-1">Most browsers allow you to:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Block all cookies</li>
                      <li>Block third-party cookies only</li>
                      <li>Delete existing cookies</li>
                      <li>Set preferences for specific websites</li>
                    </ul>
                    <p className="text-muted-foreground mb-4">
                      <strong>Note:</strong> Disabling essential cookies will prevent you from using core Platform features like logging in.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      <strong>To opt out of Google Analytics:</strong><br />
                      Install the Google Analytics Opt-out Browser Add-on: https://tools.google.com/dlpage/gaoptout
                    </p>

                    <h4 className="font-semibold mb-2">5.4 Do Not Track Signals</h4>
                    <p className="text-muted-foreground mb-4">
                      <strong>StudyBuddy does not currently respond to "Do Not Track" (DNT) signals</strong> sent by web browsers.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      DNT is a browser setting that requests websites not track your browsing across multiple sites. There is currently no industry-wide standard for how websites should respond to DNT signals, so we do not modify our data collection practices in response to DNT.
                    </p>

                    <h4 className="font-semibold mb-2">5.5 Third-Party Tracking</h4>
                    <p className="text-muted-foreground mb-4">
                      <strong>Google Analytics may track your activity across different websites</strong> when you visit sites that also use Google Analytics.
                    </p>
                    <p className="text-muted-foreground">
                      To learn more about Google's data practices, visit: https://policies.google.com/technologies/partner-sites
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">6. DATA RETENTION</h3>
                    <p className="text-muted-foreground mb-4">
                      We retain your information for as long as necessary to provide services and fulfill the purposes described in this Privacy Policy.
                    </p>

                    <h4 className="font-semibold mb-2">6.1 Account Information</h4>
                    <p className="font-medium mb-1">While your account is active:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>We retain all account information, profile data, and usage history</li>
                    </ul>
                    <p className="font-medium mb-1">After account deletion:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Personal data deleted within 30 days</li>
                      <li>Exceptions: Data we're required to retain for legal, tax, or dispute resolution purposes</li>
                    </ul>

                    <h4 className="font-semibold mb-2">6.2 Specific Retention Periods</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                      <li><strong>Messages:</strong> Permanently stored until account deletion; then deleted within 30 days</li>
                      <li><strong>Session History:</strong> Retained until account deletion + 90 days for dispute resolution purposes</li>
                      <li><strong>Payment Records:</strong> 7 years (required by tax law and IRS regulations)</li>
                      <li><strong>Transcripts (for tutor applications):</strong> Deleted within 48 hours of approval/rejection decision</li>
                      <li><strong>Reviews and Ratings:</strong> Retained even after account deletion (but anonymized - no longer associated with your name)</li>
                      <li><strong>Dispute Records:</strong> 3 years after dispute resolution</li>
                      <li><strong>Legal Holds:</strong> If information is subject to legal hold, investigation, or litigation, we retain it until the matter is resolved</li>
                    </ul>

                    <h4 className="font-semibold mb-2">6.3 Aggregate/Anonymous Data</h4>
                    <p className="text-muted-foreground">
                      We may retain aggregate, de-identified, or anonymized data indefinitely for analytics and research purposes. This data cannot be used to identify you.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">7. YOUR CALIFORNIA PRIVACY RIGHTS (CCPA/CPRA)</h3>
                    <p className="text-muted-foreground mb-4">
                      The California Consumer Privacy Act (CCPA), as amended by the California Privacy Rights Act (CPRA), provides California residents with specific rights regarding their personal information.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      <strong>Note:</strong> Even if StudyBuddy is not currently subject to CCPA due to business size thresholds, we honor these rights for all users as a best practice.
                    </p>

                    <h4 className="font-semibold mb-2">7.1 Right to Know</h4>
                    <p className="text-muted-foreground mb-2">
                      You have the right to request that we disclose:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                      <li>
                        <strong>Categories of personal information we collect about you</strong><br />
                        <span className="text-sm">See Section 1 for full list.</span>
                      </li>
                      <li>
                        <strong>Specific pieces of personal information we have about you</strong><br />
                        <span className="text-sm">We will provide a copy of your data in a portable format.</span>
                      </li>
                      <li>
                        <strong>Categories of sources from which we collect personal information</strong><br />
                        <span className="text-sm">Directly from you; Automatically through Platform use; From third parties (Stripe, USC email verification)</span>
                      </li>
                      <li>
                        <strong>Business or commercial purposes for collecting information</strong><br />
                        <span className="text-sm">See Section 2 for full list.</span>
                      </li>
                      <li>
                        <strong>Categories of third parties with whom we share personal information</strong><br />
                        <span className="text-sm">See Section 3 for full list.</span>
                      </li>
                    </ul>

                    <h4 className="font-semibold mb-2">7.2 Right to Delete</h4>
                    <p className="text-muted-foreground mb-2">
                      You have the right to request deletion of your personal information, subject to certain exceptions.
                    </p>
                    <p className="font-medium mb-1">We will delete your information EXCEPT when we need it to:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Complete transactions or provide services you requested</li>
                      <li>Detect and prevent security incidents, fraud, or illegal activity</li>
                      <li>Debug and repair Platform errors</li>
                      <li>Comply with legal obligations (including tax record retention requirements)</li>
                      <li>Exercise free speech or ensure others' right to free speech</li>
                      <li>Engage in research in the public interest (if you consented)</li>
                      <li>Use it internally in ways compatible with context in which you provided it</li>
                    </ul>
                    <p className="font-medium mb-1">Examples of information we CANNOT delete:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Payment records required for tax reporting (7-year retention)</li>
                      <li>Information subject to legal hold or pending litigation</li>
                      <li>Anonymized reviews and ratings (disconnected from your identity)</li>
                    </ul>

                    <h4 className="font-semibold mb-2">7.3 Right to Correct</h4>
                    <p className="text-muted-foreground mb-4">
                      You have the right to request correction of inaccurate personal information.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      You can update most information directly through your account settings. For other corrections, contact us at help@studybuddyusc.com.
                    </p>

                    <h4 className="font-semibold mb-2">7.4 Right to Opt-Out of Sale/Sharing</h4>
                    <p className="text-muted-foreground mb-4">
                      <strong>We do NOT sell your personal information.</strong>
                    </p>
                    <p className="text-muted-foreground mb-4">
                      <strong>We do NOT share your personal information for cross-context behavioral advertising.</strong>
                    </p>
                    <p className="text-muted-foreground mb-4">
                      However, you can still exercise your right to opt-out by visiting: [YOUR-DOMAIN.com/do-not-sell]
                    </p>

                    <h4 className="font-semibold mb-2">7.5 Right to Limit Use of Sensitive Personal Information</h4>
                    <p className="text-muted-foreground mb-2">
                      Sensitive personal information includes:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Government identification numbers (SSN, TIN)</li>
                      <li>Account login credentials</li>
                      <li>Precise geolocation</li>
                      <li>Contents of communications (messages)</li>
                      <li>Certain health, genetic, or biometric data</li>
                    </ul>
                    <p className="font-medium mb-1">We collect some sensitive personal information:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Account passwords (encrypted)</li>
                      <li>Taxpayer ID (for tutors, via Stripe)</li>
                      <li>Messages between users</li>
                    </ul>
                    <p className="font-medium mb-1">We use sensitive information ONLY for:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Providing Platform services</li>
                      <li>Maintaining security and preventing fraud</li>
                      <li>Complying with legal obligations</li>
                    </ul>
                    <p className="text-muted-foreground mb-4">
                      We do NOT use or disclose sensitive personal information for purposes other than those specified above. Therefore, there is no additional limitation to request.
                    </p>

                    <h4 className="font-semibold mb-2">7.6 Right to Non-Discrimination</h4>
                    <p className="text-muted-foreground mb-2">
                      <strong>You have the right to exercise your CCPA rights without discrimination.</strong>
                    </p>
                    <p className="font-medium mb-1">We will NOT:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Deny you goods or services</li>
                      <li>Charge you different prices or rates</li>
                      <li>Provide a different level of quality of services</li>
                      <li>Suggest you will receive different prices or quality of services</li>
                    </ul>

                    <h4 className="font-semibold mb-2">7.7 How to Exercise Your Rights</h4>
                    <p className="font-medium mb-1">To submit a request:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li><strong>Email:</strong> help@studybuddyusc.com</li>
                      <li><strong>Subject Line:</strong> California Privacy Rights Request</li>
                      <li><strong>Include:</strong> Your name, email, specific right you're exercising, and description of your request</li>
                      <li><strong>Online Form:</strong> [YOUR-DOMAIN.com/privacy-request]</li>
                    </ul>
                    <p className="font-medium mb-1">Response Timeline:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>We will respond within <strong>45 days</strong> of receiving your request</li>
                      <li>If we need more time, we may extend up to an additional <strong>45 days</strong> (total 90 days) and will notify you of the extension</li>
                    </ul>

                    <h4 className="font-semibold mb-2">7.8 Verification Process</h4>
                    <p className="text-muted-foreground mb-2">
                      To protect your privacy, we must verify your identity before processing requests.
                    </p>
                    <p className="font-medium mb-1">We will ask you to:</p>
                    <ol className="list-decimal list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Confirm the email address associated with your account</li>
                      <li>Answer security questions about your account</li>
                      <li>Provide additional identifying information if needed for sensitive requests</li>
                    </ol>
                    <p className="text-muted-foreground mb-4">
                      <strong>For deletion requests involving sensitive information</strong>, we may require additional verification to ensure the request is legitimate.
                    </p>

                    <h4 className="font-semibold mb-2">7.9 Authorized Agents</h4>
                    <p className="text-muted-foreground mb-2">
                      You may designate an authorized agent to submit requests on your behalf.
                    </p>
                    <p className="font-medium mb-1">Requirements for authorized agents:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Written authorization signed by you</li>
                      <li>Proof of agent's identity</li>
                      <li>We may still require you to verify your identity directly</li>
                      <li>We may require you to confirm you authorized the agent</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">8. YOUR RIGHTS UNDER CALOPPA</h3>
                    <p className="text-muted-foreground mb-4">
                      The California Online Privacy Protection Act (CalOPPA) requires certain disclosures and user rights.
                    </p>

                    <h4 className="font-semibold mb-2">8.1 How Users Can Review and Request Changes to Information</h4>
                    <p className="font-medium mb-1">You can review and update your information by:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Logging into your account and editing your profile</li>
                      <li>Accessing account settings</li>
                      <li>Contacting us at help@studybuddyusc.com for information not editable through your account</li>
                    </ul>
                    <p className="text-muted-foreground mb-4">
                      <strong>We will respond to update requests within 30 days.</strong>
                    </p>

                    <h4 className="font-semibold mb-2">8.2 How We Notify Users of Privacy Policy Changes</h4>
                    <p className="font-medium mb-1">We will notify you of material changes to this Privacy Policy via:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Email to the address associated with your account (at least 30 days before effective date)</li>
                      <li>Prominent notice on the Platform homepage</li>
                      <li>In-app notification when you next log in</li>
                    </ul>
                    <p className="text-muted-foreground mb-4">
                      <strong>Continued use of the Platform after changes become effective constitutes acceptance.</strong>
                    </p>
                    <p className="text-muted-foreground mb-4">
                      <strong>We recommend reviewing this Privacy Policy periodically</strong> to stay informed about how we protect your information.
                    </p>

                    <h4 className="font-semibold mb-2">8.3 Third-Party Behavioral Tracking</h4>
                    <p className="text-muted-foreground mb-4">
                      <strong>Third-party tracking technologies (like Google Analytics) may collect information about your online activities over time and across different websites.</strong>
                    </p>
                    <p className="font-medium mb-1">To learn more about third-party tracking:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Google's data practices: https://policies.google.com/technologies/partner-sites</li>
                      <li>Network Advertising Initiative opt-out: https://optout.networkadvertising.org/</li>
                      <li>Digital Advertising Alliance opt-out: https://optout.aboutads.info/</li>
                    </ul>
                    <p className="font-medium mb-1">You can opt out of third-party tracking through:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Browser privacy settings</li>
                      <li>Browser extensions (e.g., Privacy Badger, uBlock Origin)</li>
                      <li>Google Analytics opt-out: https://tools.google.com/dlpage/gaoptout</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">9. EDUCATIONAL RECORDS AND FERPA</h3>

                    <h4 className="font-semibold mb-2">9.1 FERPA Does Not Apply to StudyBuddy</h4>
                    <p className="text-muted-foreground mb-4">
                      <strong>The Family Educational Rights and Privacy Act (FERPA), 20 U.S.C. § 1232g, does NOT apply to StudyBuddy.</strong>
                    </p>
                    <p className="text-muted-foreground mb-4">
                      FERPA applies only to educational agencies or institutions that receive funding from programs administered by the U.S. Department of Education. StudyBuddy is a private tutoring marketplace that receives no federal education funding.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      <strong>Therefore, StudyBuddy is NOT bound by FERPA's requirements.</strong>
                    </p>

                    <h4 className="font-semibold mb-2">9.2 Protection of Educational Records</h4>
                    <p className="text-muted-foreground mb-4">
                      <strong>Even though FERPA doesn't apply, we treat educational information with the highest level of protection.</strong>
                    </p>
                    <p className="font-medium mb-1">Educational information we collect includes:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>GPA (for tutors)</li>
                      <li>Transcripts (for tutor verification)</li>
                      <li>Courses completed</li>
                      <li>Academic credentials</li>
                      <li>Subject competencies</li>
                    </ul>
                    <p className="font-medium mb-1">How we protect educational information:</p>
                    <ol className="list-decimal list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li><strong>Transmitted securely</strong> using TLS encryption</li>
                      <li><strong>Stored in encrypted format</strong> in our Supabase database</li>
                      <li><strong>Access limited</strong> to authorized StudyBuddy personnel on need-to-know basis</li>
                      <li><strong>Never sold or shared</strong> with third parties except service providers bound by confidentiality obligations</li>
                      <li><strong>Transcripts permanently deleted</strong> within 48 hours of approval/rejection decision</li>
                      <li><strong>Can be deleted</strong> upon user request to help@studybuddyusc.com</li>
                    </ol>

                    <h4 className="font-semibold mb-2">9.3 Student Education Records Confidentiality</h4>
                    <p className="text-muted-foreground mb-2">
                      If you share educational records with your tutor (transcripts, assignments, grades):
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Your tutor is contractually obligated to keep this information confidential</li>
                      <li>Tutors may not share your educational information with third parties</li>
                      <li>Tutors should delete or destroy records when no longer needed for tutoring purposes</li>
                    </ul>
                    <p className="text-muted-foreground">
                      <strong>However, StudyBuddy cannot guarantee tutors will comply</strong> with confidentiality obligations. You share information with tutors at your own risk.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">10. DATA SECURITY</h3>

                    <h4 className="font-semibold mb-2">10.1 Security Measures</h4>
                    <p className="text-muted-foreground mb-2">
                      We implement reasonable security measures to protect your information, including:
                    </p>

                    <div className="mb-3">
                      <p className="font-medium mb-1">Technical Safeguards:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm">
                        <li>TLS encryption for data transmission (HTTPS)</li>
                        <li>Encrypted storage of sensitive data in Supabase</li>
                        <li>Secure password hashing (bcrypt or similar)</li>
                        <li>Regular security assessments and vulnerability testing</li>
                        <li>Firewall protection and intrusion detection</li>
                        <li>Secure access controls and authentication</li>
                      </ul>
                    </div>

                    <div className="mb-3">
                      <p className="font-medium mb-1">Administrative Safeguards:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm">
                        <li>Access controls limiting who can view data</li>
                        <li>Employee training on data protection</li>
                        <li>Confidentiality agreements with employees and contractors</li>
                        <li>Background checks for employees with data access</li>
                        <li>Incident response and data breach procedures</li>
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="font-medium mb-1">Physical Safeguards:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm">
                        <li>Supabase data centers with physical security controls</li>
                        <li>Secure server locations in the United States</li>
                      </ul>
                    </div>

                    <h4 className="font-semibold mb-2">10.2 Limitations of Security</h4>
                    <p className="text-muted-foreground mb-4">
                      <strong>No method of transmission or storage is 100% secure.</strong>
                    </p>
                    <p className="text-muted-foreground mb-2">
                      Despite our efforts, we cannot guarantee absolute security. Potential risks include:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Hacking or cyberattacks</li>
                      <li>Data breaches</li>
                      <li>Unauthorized access</li>
                      <li>Technical failures</li>
                      <li>Human error</li>
                    </ul>
                    <p className="font-medium mb-1">You are responsible for:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Keeping your password secure and confidential</li>
                      <li>Not sharing your account with others</li>
                      <li>Using a strong, unique password</li>
                      <li>Logging out after using shared devices</li>
                      <li>Reporting suspected security issues immediately</li>
                    </ul>

                    <h4 className="font-semibold mb-2">10.3 Supabase Security</h4>
                    <p className="text-muted-foreground mb-2">
                      Our primary data storage provider is Supabase, which maintains:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>SOC 2 Type II compliance</li>
                      <li>Regular third-party security audits</li>
                      <li>Encryption at rest and in transit</li>
                      <li>Distributed denial-of-service (DDoS) protection</li>
                      <li>Regular backups and disaster recovery procedures</li>
                    </ul>
                    <p className="text-muted-foreground mb-4">
                      For more information: https://supabase.com/security
                    </p>

                    <h4 className="font-semibold mb-2">10.4 Stripe Security</h4>
                    <p className="text-muted-foreground mb-2">
                      Payment information is handled by Stripe, which maintains:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>PCI DSS Level 1 certification (highest level of payment security)</li>
                      <li>Strong encryption and security protocols</li>
                      <li>Fraud detection and prevention systems</li>
                      <li>Regular security audits</li>
                    </ul>
                    <p className="text-muted-foreground mb-4">
                      StudyBuddy never stores full credit card numbers.
                    </p>
                    <p className="text-muted-foreground">
                      For more information: https://stripe.com/docs/security
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">11. DATA BREACH NOTIFICATION</h3>

                    <h4 className="font-semibold mb-2">11.1 California Data Breach Notification Law</h4>
                    <p className="text-muted-foreground mb-4">
                      California Civil Code § 1798.82 requires businesses to notify California residents of certain data breaches.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      <strong>If we experience a data breach affecting your personal information</strong>, we will notify you as follows:
                    </p>

                    <div className="mb-3">
                      <p className="font-medium mb-1">Notification Timing:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm">
                        <li>In the most expedient time possible</li>
                        <li>Without unreasonable delay</li>
                        <li>Consistent with law enforcement needs</li>
                      </ul>
                    </div>

                    <div className="mb-3">
                      <p className="font-medium mb-1">Notification Method:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm">
                        <li>Email to the address associated with your account, AND/OR</li>
                        <li>Prominent notice on the Platform homepage, AND/OR</li>
                        <li>Written notice by first-class mail (if email unavailable)</li>
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="font-medium mb-1">Notification Content:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm">
                        <li>Description of what happened</li>
                        <li>Types of information involved in the breach</li>
                        <li>Steps we have taken to remediate the situation</li>
                        <li>What you can do to protect yourself</li>
                        <li>Contact information for questions</li>
                      </ul>
                    </div>

                    <h4 className="font-semibold mb-2">11.2 Attorney General Notification</h4>
                    <p className="text-muted-foreground mb-4">
                      If a breach affects <strong>500 or more California residents</strong>, we will also notify the California Attorney General as required by law.
                    </p>

                    <h4 className="font-semibold mb-2">11.3 CCPA Private Right of Action</h4>
                    <p className="text-muted-foreground mb-2">
                      Under California Civil Code § 1798.150, you have a private right of action if:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Your <strong>nonencrypted and nonredacted personal information</strong> is subject to unauthorized access due to our failure to maintain reasonable security</li>
                      <li>You may seek statutory damages of $100-$750 per incident or actual damages (whichever is greater)</li>
                      <li>You may also seek injunctive relief and attorney's fees</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">12. CHILDREN'S PRIVACY</h3>

                    <h4 className="font-semibold mb-2">12.1 Age Restriction</h4>
                    <p className="text-muted-foreground mb-4">
                      <strong>StudyBuddy is restricted to users who are at least 18 years of age.</strong>
                    </p>
                    <p className="text-muted-foreground mb-4">
                      We do not knowingly collect personal information from anyone under 18 years of age. The Platform is not designed for, marketed to, or intended for use by individuals under 18.
                    </p>

                    <h4 className="font-semibold mb-2">12.2 Parental Notice</h4>
                    <p className="text-muted-foreground mb-2">
                      If you are a parent or guardian and believe your child under 18 has created an account on StudyBuddy:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Contact us immediately at help@studybuddyusc.com</li>
                      <li>We will verify the account holder's age</li>
                      <li>If confirmed under 18, we will delete the account and all associated data immediately</li>
                    </ul>

                    <h4 className="font-semibold mb-2">12.3 COPPA Compliance</h4>
                    <p className="text-muted-foreground mb-4">
                      The Children's Online Privacy Protection Act (COPPA) applies to websites directed at children under 13 or that knowingly collect information from children under 13.
                    </p>
                    <p className="text-muted-foreground mb-2">
                      <strong>StudyBuddy is NOT subject to COPPA</strong> because:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>We require users to be 18+</li>
                      <li>The Platform is not directed at children</li>
                      <li>We do not knowingly collect information from anyone under 18</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">13. INTERNATIONAL USERS</h3>

                    <h4 className="font-semibold mb-2">13.1 United States Operations</h4>
                    <p className="text-muted-foreground mb-4">
                      StudyBuddy operates from the United States. Our servers and data storage are located in the United States.
                    </p>
                    <p className="font-medium mb-1">If you access the Platform from outside the United States:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Your information will be transferred to, stored, and processed in the United States</li>
                      <li>Data protection laws in the U.S. may differ from those in your country</li>
                      <li>By using the Platform, you consent to this transfer and processing</li>
                    </ul>

                    <h4 className="font-semibold mb-2">13.2 Not Designed for GDPR Compliance</h4>
                    <p className="text-muted-foreground mb-4">
                      The Platform is currently designed for U.S. users and is not optimized for compliance with the European Union's General Data Protection Regulation (GDPR).
                    </p>
                    <p className="font-medium mb-1">If you are a resident of the European Union:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Use of the Platform may not provide GDPR-level protections</li>
                      <li>Your GDPR rights may not be fully supported</li>
                      <li>We recommend consulting local data protection laws before using the Platform</li>
                    </ul>
                    <p className="text-muted-foreground">
                      We may expand GDPR compliance in the future if we serve European users.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">14. CHANGES TO THIS PRIVACY POLICY</h3>

                    <h4 className="font-semibold mb-2">14.1 Right to Modify</h4>
                    <p className="text-muted-foreground mb-2">
                      We reserve the right to modify this Privacy Policy at any time. Changes may be necessary due to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>Changes in our data practices</li>
                      <li>New features or services</li>
                      <li>Legal or regulatory requirements</li>
                      <li>Industry best practices</li>
                      <li>User feedback</li>
                    </ul>

                    <h4 className="font-semibold mb-2">14.2 Notice of Material Changes</h4>
                    <p className="text-muted-foreground mb-2">
                      <strong>For material changes to this Privacy Policy, we will provide notice at least 30 days before the effective date via:</strong>
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Email to the address associated with your account</li>
                      <li>Prominent banner notice on the Platform homepage</li>
                      <li>In-app notification when you next log in</li>
                    </ul>
                    <p className="font-medium mb-1">Material changes include:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                      <li>New ways we collect information</li>
                      <li>Significant changes to how we use information</li>
                      <li>Changes to whom we share information with</li>
                      <li>Reduced privacy protections</li>
                    </ul>

                    <h4 className="font-semibold mb-2">14.3 Acceptance of Changes</h4>
                    <p className="text-muted-foreground mb-4">
                      <strong>Continued use of the Platform after the effective date of changes constitutes acceptance of the modified Privacy Policy.</strong>
                    </p>
                    <p className="text-muted-foreground mb-4">
                      If you do not agree to changes, you must stop using the Platform and may delete your account.
                    </p>

                    <h4 className="font-semibold mb-2">14.4 Reviewing Changes</h4>
                    <p className="text-muted-foreground mb-4">
                      We recommend reviewing this Privacy Policy periodically. The "Last Updated" date at the top indicates when the most recent changes were made.
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Previous versions of this Privacy Policy are available upon request</strong> by contacting help@studybuddyusc.com.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">15. CONTACT INFORMATION</h3>

                    <h4 className="font-semibold mb-2">15.1 Privacy Questions and Requests</h4>
                    <p className="text-muted-foreground mb-2">
                      <strong>For privacy-related questions, concerns, or requests:</strong>
                    </p>
                    <ul className="list-none text-muted-foreground space-y-1 ml-4 mb-4">
                      <li><strong>Email:</strong> help@studybuddyusc.com</li>
                      <li><strong>Subject Line:</strong> Privacy Inquiry</li>
                      <li><strong>Response Time:</strong> Within 48 hours (business days)</li>
                    </ul>
                    <p className="text-muted-foreground mb-4">
                      <strong>Mailing Address:</strong><br />
                      StudyBuddy LLC<br />
                      Attn: Privacy Officer<br />
                      1170 Edmar Ln<br />
                      Santa Cruz, CA 95062
                    </p>

                    <h4 className="font-semibold mb-2">15.2 California Privacy Rights Requests</h4>
                    <p className="text-muted-foreground mb-2">
                      <strong>To exercise your CCPA rights (Right to Know, Right to Delete, Right to Correct):</strong>
                    </p>
                    <ul className="list-none text-muted-foreground space-y-1 ml-4 mb-3">
                      <li><strong>Email:</strong> help@studybuddyusc.com</li>
                      <li><strong>Subject Line:</strong> California Privacy Rights Request</li>
                      <li><strong>Online Form:</strong> [YOUR-DOMAIN.com/privacy-request]</li>
                    </ul>
                    <p className="font-medium mb-1">Include in your request:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
                      <li>Your full name</li>
                      <li>Email address associated with your account</li>
                      <li>Specific right you're exercising</li>
                      <li>Detailed description of your request</li>
                    </ul>
                    <p className="text-muted-foreground mb-4">
                      <strong>Response timeline:</strong> 45 days (may extend up to 45 additional days)
                    </p>

                    <h4 className="font-semibold mb-2">15.3 Data Breach Notification</h4>
                    <p className="text-muted-foreground mb-2">
                      <strong>To report a suspected security incident or data breach:</strong>
                    </p>
                    <ul className="list-none text-muted-foreground space-y-1 ml-4 mb-4">
                      <li><strong>Email:</strong> help@studybuddyusc.com</li>
                      <li><strong>Subject Line:</strong> URGENT - Security Incident Report</li>
                    </ul>

                    <h4 className="font-semibold mb-2">15.4 General Support</h4>
                    <p className="text-muted-foreground mb-2">
                      <strong>For non-privacy questions:</strong>
                    </p>
                    <ul className="list-none text-muted-foreground space-y-1 ml-4">
                      <li><strong>Email:</strong> help@studybuddyusc.com</li>
                      <li><strong>Subject Line:</strong> [Brief description]</li>
                      <li><strong>Response Time:</strong> Within 24 hours (business days)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-3">SUMMARY OF KEY POINTS</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium mb-1">Information We Collect:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm">
                          <li>Account info (name, email, password)</li>
                          <li>Profile info (bio, education, rate for tutors)</li>
                          <li>Academic info (GPA, transcripts for tutors)</li>
                          <li>Payment info (via Stripe)</li>
                          <li>Messages, session data, reviews</li>
                          <li>Usage data and cookies</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-medium mb-1">How We Use It:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm">
                          <li>Operate the Platform</li>
                          <li>Match students with tutors</li>
                          <li>Process payments</li>
                          <li>Ensure safety and prevent fraud</li>
                          <li>Improve Platform</li>
                          <li>Comply with law</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-medium mb-1">How We Share It:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm">
                          <li>With service providers (Stripe, Supabase, etc.)</li>
                          <li>When required by law</li>
                          <li>With your consent</li>
                          <li>Public information visible on profiles</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-medium mb-1">Your Rights:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm">
                          <li>Access your data</li>
                          <li>Delete your data (with exceptions)</li>
                          <li>Correct inaccurate data</li>
                          <li>Opt out of sale (we don't sell data)</li>
                          <li>Control cookies</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-medium mb-1">Contact Us:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 text-sm">
                          <li>Privacy questions: help@studybuddyusc.com</li>
                          <li>CCPA requests: help@studybuddyusc.com</li>
                          <li>Security issues: help@studybuddyusc.com</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6 mt-6">
                    <p className="text-muted-foreground font-medium mb-4">
                      <strong>BY USING STUDYBUDDY, YOU ACKNOWLEDGE THAT YOU HAVE READ AND UNDERSTOOD THIS PRIVACY POLICY AND AGREE TO ITS TERMS.</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <em>Last Updated: October 6, 2025</em><br />
                      <em>Version 1.0</em>
                    </p>
                  </div>
                </div>
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
