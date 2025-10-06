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
              <section>
                <h1 className="text-2xl font-bold mb-4">INDEPENDENT CONTRACTOR AGREEMENT</h1>
                <p className="font-semibold">Between StudyBuddy LLC and Tutor</p>
                <p className="font-semibold">Effective Date: October 6, 2025</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">PARTIES</h2>
                <p>This Independent Contractor Agreement ("Agreement") is entered into by and between:</p>
                <p className="font-semibold">StudyBuddy LLC</p>
                <p>("StudyBuddy," "Platform," "we," "us," or "our")</p>
                <p>AND</p>
                <p className="font-semibold">Tutor</p>
                <p>("Tutor," "you," or "your")</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">RECITALS</h2>
                <p><strong>WHEREAS</strong>, StudyBuddy LLC operates an online marketplace platform that connects students seeking tutoring services with independent tutors who offer tutoring services;</p>
                <p><strong>WHEREAS</strong>, Tutor is an independent business engaged in providing tutoring services and desires to be listed on the StudyBuddy marketplace platform;</p>
                <p><strong>WHEREAS</strong>, StudyBuddy does not provide tutoring services itself but merely facilitates connections between students and independent tutors;</p>
                <p><strong>WHEREAS</strong>, the relationship between Tutor and any student engaged through the Platform is independent of and separate from StudyBuddy;</p>
                <p><strong>WHEREAS</strong>, this Agreement is intended to comply with California Labor Code §§ 2775-2787, including the referral agency provisions of Labor Code § 2777;</p>
                <p><strong>NOW, THEREFORE</strong>, in consideration of the mutual promises and covenants contained in this Agreement, the parties agree as follows:</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">1. NATURE OF RELATIONSHIP</h2>
                
                <h3 className="text-lg font-semibold mb-2">1.1 Independent Contractor Status</h3>
                <p className="font-semibold">Tutor is an independent contractor and is NOT an employee, partner, agent, or joint venturer of StudyBuddy.</p>
                <p>Specifically, Tutor acknowledges and agrees that:</p>
                
                <p>a) <strong>No Employment Relationship:</strong> Tutor is not an employee of StudyBuddy for any purpose, including but not limited to:</p>
                <ul className="list-disc pl-6">
                  <li>Federal or state tax withholding</li>
                  <li>Unemployment insurance</li>
                  <li>Workers' compensation</li>
                  <li>Employee benefits of any kind</li>
                  <li>Wage and hour laws</li>
                  <li>Anti-discrimination laws (as they apply to employees)</li>
                </ul>

                <p>b) <strong>No Employee Benefits:</strong> Tutor will NOT receive any employee benefits from StudyBuddy, including but not limited to:</p>
                <ul className="list-disc pl-6">
                  <li>Health insurance or medical benefits</li>
                  <li>Retirement plans or pension benefits</li>
                  <li>Paid time off, vacation, or sick leave</li>
                  <li>Workers' compensation insurance</li>
                  <li>Unemployment compensation</li>
                  <li>Any other fringe benefits typically provided to employees</li>
                </ul>

                <p>c) <strong>Tax Responsibilities:</strong> Tutor is solely and entirely responsible for all federal, state, and local taxes arising from Tutor's income, including:</p>
                <ul className="list-disc pl-6">
                  <li>Federal income tax</li>
                  <li>California state income tax</li>
                  <li>Self-employment taxes under the Self-Employment Contributions Act (SECA)</li>
                  <li>Any other applicable taxes</li>
                </ul>

                <p>d) <strong>Regulatory Compliance:</strong> This independent contractor relationship is established pursuant to California Labor Code §§ 2775-2787, including compliance with the ABC test and referral agency exemption under Labor Code § 2777.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">1.2 Form 1099-NEC Reporting</h3>
                <p>StudyBuddy will issue <strong>IRS Form 1099-NEC</strong> to Tutor for any calendar year in which Tutor earns $600 or more in gross compensation from tutoring services. The 1099-NEC will be provided by January 31 of the following year.</p>
                <p><strong>Tutor must provide a completed Form W-9</strong> (Request for Taxpayer Identification Number) before receiving first payment. Failure to provide a valid Taxpayer Identification Number (TIN) will result in 24% backup withholding as required by IRS regulations.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">1.3 No Authority to Bind</h3>
                <p>Tutor has no authority to bind StudyBuddy to any contract, obligation, or liability. Tutor may not represent that Tutor acts on behalf of StudyBuddy or has any authority from StudyBuddy.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. REFERRAL AGENCY COMPLIANCE (California Labor Code § 2777)</h2>
                <p>This Agreement is structured to qualify StudyBuddy as a "referral agency" under California Labor Code § 2777, which exempts referral agencies from the ABC test for independent contractor classification, provided all statutory requirements are satisfied.</p>
                <p><strong>Tutor and StudyBuddy agree to maintain the following conditions to preserve referral agency status:</strong></p>

                <h3 className="text-lg font-semibold mb-2 mt-4">2.1 Freedom from Control (§ 2777(a)(1))</h3>
                <p><strong>Tutor has complete freedom from StudyBuddy's control and direction</strong> in performing tutoring services for students. Specifically:</p>
                <ul className="list-disc pl-6">
                  <li>StudyBuddy does NOT supervise, monitor, or direct tutoring sessions</li>
                  <li>StudyBuddy does NOT require specific teaching methods or curriculum</li>
                  <li>StudyBuddy does NOT mandate when, where, or how Tutor provides services</li>
                  <li>StudyBuddy does NOT control Tutor's behavior during tutoring sessions</li>
                  <li>StudyBuddy does NOT evaluate Tutor's teaching performance or quality</li>
                  <li>StudyBuddy does NOT provide training on how to tutor</li>
                  <li>StudyBuddy does NOT observe or participate in tutoring sessions</li>
                </ul>
                <p>Tutor has sole discretion over all pedagogical decisions, teaching methods, and service delivery.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">2.2 Business License (§ 2777(a)(2))</h3>
                <p>Tutor maintains any business licenses required for independent operation as a tutor in the jurisdiction where services are provided. Tutor is responsible for determining licensing requirements and obtaining any necessary permits.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">2.3 Independent Business Presence (§ 2777(a)(3) & (a)(6))</h3>
                <p><strong>Tutor provides tutoring services under Tutor's own name</strong>, not as a "StudyBuddy tutor" or "StudyBuddy employee" or "StudyBuddy representative."</p>
                <p>Tutor maintains an <strong>independently established tutoring business</strong>, which means:</p>
                <ul className="list-disc pl-6">
                  <li>Tutor has the right to provide tutoring services through other platforms, websites, or channels</li>
                  <li>Tutor may advertise tutoring services independently</li>
                  <li>Tutor may accept students through word-of-mouth, referrals, or other sources</li>
                  <li>Tutor may maintain other employment or business ventures</li>
                  <li>Tutor is not restricted to using StudyBuddy exclusively</li>
                </ul>
                <p>StudyBuddy is merely one of potentially many channels through which Tutor may receive student referrals.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">2.4 Professional Licensing (§ 2777(a)(4))</h3>
                <p>Tutor maintains any applicable professional or occupational licenses required for the provision of tutoring services in the subjects offered, if such licensing is required by law.</p>
                <p>Tutor represents that Tutor is qualified to tutor in the subjects listed on Tutor's profile and holds any necessary credentials or certifications.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">2.5 Own Tools and Equipment (§ 2777(a)(5))</h3>
                <p><strong>Tutor provides Tutor's own materials, tools, and supplies</strong> necessary for providing tutoring services, including but not limited to:</p>
                <ul className="list-disc pl-6">
                  <li>Computer, tablet, or other devices</li>
                  <li>Internet connection</li>
                  <li>Software or applications needed for virtual tutoring</li>
                  <li>Textbooks, reference materials, or educational resources</li>
                  <li>Physical tutoring materials (whiteboard, markers, paper, etc.)</li>
                  <li>Meeting space for in-person sessions (or agreement with student on location)</li>
                </ul>
                <p>StudyBuddy provides only the online platform (website and software) that facilitates connections. StudyBuddy does NOT provide:</p>
                <ul className="list-disc pl-6">
                  <li>Tutoring materials or curriculum</li>
                  <li>Devices or internet for tutors</li>
                  <li>Physical meeting spaces</li>
                  <li>Educational resources or textbooks</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">2.6 No Client Restrictions (§ 2777(a)(7))</h3>
                <p>StudyBuddy does NOT restrict Tutor from:</p>
                <ul className="list-disc pl-6">
                  <li>Serving particular students or types of students</li>
                  <li>Accepting session requests from any student who contacts Tutor</li>
                  <li>Continuing relationships with students outside the Platform after initial connection</li>
                  <li>Working with students through other channels or platforms</li>
                </ul>
                <p>Tutor has complete discretion over which students to accept or decline.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">2.7 Control Over Schedule (§ 2777(a)(8))</h3>
                <p><strong>Tutor controls Tutor's own schedule and hours</strong> with complete flexibility. Specifically:</p>
                <ul className="list-disc pl-6">
                  <li>Tutor sets own availability and working hours</li>
                  <li>Tutor decides when to accept or decline session requests</li>
                  <li>StudyBuddy imposes NO minimum or maximum hours requirements</li>
                  <li>StudyBuddy does NOT require Tutor to be available at specific times</li>
                  <li>StudyBuddy does NOT penalize Tutor for unavailability</li>
                  <li>Tutor may take time off without notice or approval</li>
                  <li>Tutor may change availability at any time</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">2.8 Right to Decline Work (§ 2777(a)(9))</h3>
                <p><strong>Tutor may accept or reject any session request without penalty or consequence.</strong></p>
                <ul className="list-disc pl-6">
                  <li>No minimum acceptance rate requirements</li>
                  <li>No penalties for declining sessions</li>
                  <li>No account restrictions for rejecting requests</li>
                  <li>No preference algorithm penalties for declining work</li>
                  <li>Complete discretion over which opportunities to accept</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">2.9 Rate Setting Freedom (§ 2777(a)(10))</h3>
                <p><strong>Tutor has SOLE AND EXCLUSIVE DISCRETION to establish hourly rates</strong> for tutoring services without any restrictions from StudyBuddy.</p>
                <ul className="list-disc pl-6">
                  <li>No minimum rate requirements</li>
                  <li>No maximum rate caps</li>
                  <li>No rate "suggestions" or "guidelines" from StudyBuddy</li>
                  <li>No approval needed for rate changes</li>
                  <li>Tutor may change rates at any time for future sessions</li>
                </ul>
                <p>StudyBuddy never dictates, suggests, influences, or restricts Tutor's pricing decisions.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">2.10 No Penalties for Declining Work (§ 2777(a)(11))</h3>
                <p>StudyBuddy imposes NO penalties, consequences, or negative effects if Tutor:</p>
                <ul className="list-disc pl-6">
                  <li>Declines session requests</li>
                  <li>Turns down work opportunities</li>
                  <li>Reduces availability</li>
                  <li>Takes time away from the Platform</li>
                  <li>Changes rates to levels that reduce booking volume</li>
                </ul>
                <p>Tutor's account standing, search ranking, and platform access are NOT affected by work declination.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. SERVICES PROVIDED</h2>

                <h3 className="text-lg font-semibold mb-2">3.1 Platform Listing</h3>
                <p>Upon StudyBuddy's approval of Tutor's application, Tutor will be listed in the StudyBuddy marketplace where students can:</p>
                <ul className="list-disc pl-6">
                  <li>View Tutor's profile, qualifications, hourly rate, and availability</li>
                  <li>Read reviews and ratings of Tutor (if any)</li>
                  <li>Send messages to Tutor</li>
                  <li>Request tutoring sessions with Tutor</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">3.2 Session Requests and Acceptance</h3>
                <p>When a student requests a session with Tutor:</p>
                <ul className="list-disc pl-6">
                  <li>Tutor receives notification of the request</li>
                  <li>Tutor has complete discretion to accept or decline</li>
                  <li>If Tutor accepts, session is confirmed and payment is charged to student</li>
                  <li>If Tutor declines or does not respond, student is notified and can choose another tutor</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">3.3 Provision of Tutoring Services</h3>
                <p><strong>Tutoring services are provided directly by Tutor to student.</strong> StudyBuddy is not involved in the provision of services. Specifically:</p>
                <ul className="list-disc pl-6">
                  <li>Tutor and student communicate directly to arrange session details (time, location if in-person, topics to cover)</li>
                  <li>Tutor provides educational instruction, guidance, and support to student</li>
                  <li>Tutor determines appropriate teaching methods and approaches</li>
                  <li>Tutor and student interact without StudyBuddy supervision or participation</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">3.4 Platform Role</h3>
                <p>StudyBuddy's sole role is to:</p>
                <ul className="list-disc pl-6">
                  <li>Provide the online platform (website and software)</li>
                  <li>Display Tutor's profile to students</li>
                  <li>Facilitate messaging between students and tutors</li>
                  <li>Process payments from students to tutors</li>
                  <li>Provide session confirmation system</li>
                  <li>Enable review and rating system</li>
                </ul>
                <p>StudyBuddy does NOT:</p>
                <ul className="list-disc pl-6">
                  <li>Direct, supervise, or control tutoring sessions</li>
                  <li>Guarantee any number of student connections or income</li>
                  <li>Train Tutor on how to provide services</li>
                  <li>Determine session content or curriculum</li>
                  <li>Evaluate quality of tutoring services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. COMPENSATION AND PAYMENT</h2>

                <h3 className="text-lg font-semibold mb-2">4.1 Rate Setting</h3>
                <p><strong>Tutor sets Tutor's own hourly rate</strong> with complete freedom. Tutor may:</p>
                <ul className="list-disc pl-6">
                  <li>Charge any amount per hour (no minimum or maximum)</li>
                  <li>Set different rates for different subjects (if desired)</li>
                  <li>Change rates at any time for future sessions (not for already-booked sessions)</li>
                  <li>Offer promotional rates or discounts at Tutor's discretion</li>
                </ul>
                <p>The hourly rate set by Tutor is displayed to students on Tutor's profile. Students see the total amount they will pay (Tutor's rate + platform fee).</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">4.2 Platform Fee Structure</h3>
                <p>StudyBuddy charges a <strong>1% platform service fee</strong> to students for each completed tutoring session.</p>
                <p><strong>CRITICAL:</strong> The platform fee is:</p>
                <ul className="list-disc pl-6">
                  <li>Charged <strong>TO the student</strong> as a separate line item</li>
                  <li><strong>NOT deducted from Tutor's rate</strong></li>
                  <li>Calculated as 1% of Tutor's hourly rate</li>
                </ul>

                <div className="bg-muted p-4 rounded-md my-4">
                  <p className="font-semibold mb-2">Example:</p>
                  <pre className="text-sm">
{`Tutor's Hourly Rate:      $50.00 (set by Tutor)
Platform Service Fee:     $ 0.50 (1% of $50, charged to student)
─────────────────────────────────
Total Student Pays:       $50.50

Payment Distribution:
- Tutor receives: $50.00 (100% of Tutor's rate)
- StudyBuddy receives: $0.50 (platform fee)`}
                  </pre>
                </div>

                <div className="bg-muted p-4 rounded-md my-4">
                  <p className="font-semibold mb-2">For a 2-hour session at $50/hour:</p>
                  <pre className="text-sm">
{`Tutor's Rate (2 hours):   $100.00
Platform Fee (1%):        $  1.00
─────────────────────────────────
Total Student Pays:       $101.00

Payment Distribution:
- Tutor receives: $100.00
- StudyBuddy receives: $1.00`}
                  </pre>
                </div>

                <p>The platform fee compensates StudyBuddy for:</p>
                <ul className="list-disc pl-6">
                  <li>Platform development and maintenance</li>
                  <li>Payment processing</li>
                  <li>Customer support</li>
                  <li>Server and hosting costs</li>
                  <li>Compliance and administrative expenses</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">4.3 Payment Collection</h3>
                <p>When a student books a session:</p>
                <ol className="list-decimal pl-6">
                  <li>Student's payment method is charged immediately for the full amount (Tutor's rate + platform fee)</li>
                  <li>Funds are held by Stripe (our payment processor) pending session completion</li>
                  <li>Payment is released to Tutor only after confirmation (see Section 4.4)</li>
                </ol>

                <h3 className="text-lg font-semibold mb-2 mt-4">4.4 Payment Release and Confirmation</h3>
                <p>Payment is released to Tutor <strong>only after BOTH Tutor and student confirm the session occurred</strong> by marking it complete in the Platform.</p>

                <p className="font-semibold mt-3">Normal Flow (Both Parties Confirm):</p>
                <ul className="list-disc pl-6">
                  <li>Both Tutor and student confirm within 24 hours of session completion</li>
                  <li>Payment automatically released to Tutor within 3-7 business days</li>
                  <li>Funds arrive in Tutor's bank account 2-3 business days after release</li>
                </ul>

                <p className="font-semibold mt-3">Single Confirmation (Only One Party Confirms):</p>
                <ul className="list-disc pl-6">
                  <li>If only Tutor OR student confirms within 24 hours, automated reminders are sent to the non-confirming party at 24, 48, and 72 hours</li>
                  <li>If no response after 7 days total:
                    <ul className="list-disc pl-6 ml-4">
                      <li>90% of payment released to Tutor</li>
                      <li>10% held as dispute reserve for 30 days</li>
                      <li>If no dispute filed within 30 days, remaining 10% released</li>
                    </ul>
                  </li>
                </ul>

                <p className="font-semibold mt-3">No Confirmation (Neither Party Confirms):</p>
                <ul className="list-disc pl-6">
                  <li>Case escalated for investigation</li>
                  <li>StudyBuddy contacts both parties requesting evidence</li>
                  <li>Decision made within 2 business days based on available evidence:
                    <ul className="list-disc pl-6 ml-4">
                      <li>Platform login records during session time</li>
                      <li>Message history between parties</li>
                      <li>Previous transaction history</li>
                      <li>Statements from Tutor and student</li>
                    </ul>
                  </li>
                  <li>Payment distributed according to evidence</li>
                  <li>Either party can appeal within 7 days</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">4.5 Disputed Sessions</h3>
                <p>If Tutor and student disagree about whether a session occurred or was completed satisfactorily:</p>
                <ol className="list-decimal pl-6">
                  <li>Either party can file a dispute through the Platform</li>
                  <li>StudyBuddy investigates based on available evidence</li>
                  <li>Decision made within 2-5 business days</li>
                  <li>Possible outcomes:
                    <ul className="list-disc pl-6 ml-4">
                      <li>Full payment to Tutor (student claim denied)</li>
                      <li>Full refund to student (Tutor claim denied)</li>
                      <li>Partial refund/payment split (both parties partially at fault)</li>
                    </ul>
                  </li>
                  <li>Either party may appeal within 7 days</li>
                  <li>Appeal reviewed by different team member; final decision within 3 business days</li>
                </ol>
                <p>StudyBuddy's decision is final and binding on both parties.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">4.6 Cancellations</h3>
                <p className="font-semibold">Student Cancellations:</p>
                <ul className="list-disc pl-6">
                  <li><strong>24+ hours before session:</strong> 100% refund to student; $0 to Tutor</li>
                  <li><strong>2-24 hours before:</strong> 50% refund to student; 50% of Tutor's rate to Tutor as cancellation compensation</li>
                  <li><strong>Less than 2 hours before:</strong> No refund to student; 100% of Tutor's rate to Tutor</li>
                </ul>

                <p className="font-semibold mt-3">Tutor Cancellations:</p>
                <ul className="list-disc pl-6">
                  <li><strong>Any cancellation by Tutor at any time:</strong> 100% refund to student; $0 to Tutor</li>
                  <li>Excessive cancellations by Tutor may result in account suspension</li>
                  <li>Cancellation rate displayed on Tutor's profile</li>
                </ul>

                <p className="font-semibold mt-3">No-Shows:</p>
                <ul className="list-disc pl-6">
                  <li><strong>If student no-shows:</strong> Full payment to Tutor (if Tutor was available)</li>
                  <li><strong>If Tutor no-shows:</strong> Full refund to student; $0 to Tutor; violation of Agreement</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">4.7 Payment Method</h3>
                <p>Tutor receives payment via <strong>Stripe Connect</strong> direct deposit to Tutor's designated bank account.</p>
                <p>Before receiving first payment, Tutor must:</p>
                <ol className="list-decimal pl-6">
                  <li>Complete Stripe Connect onboarding</li>
                  <li>Provide valid bank account information</li>
                  <li>Complete IRS Form W-9</li>
                </ol>
                <p>Stripe may also require additional identity verification documents in accordance with Know Your Customer (KYC) requirements and anti-money laundering regulations.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">4.8 Payment Timing</h3>
                <ul className="list-disc pl-6">
                  <li><strong>Release from StudyBuddy:</strong> 3-7 business days after session confirmation</li>
                  <li><strong>Arrival in bank account:</strong> 2-3 business days after release (timing depends on Tutor's bank)</li>
                  <li><strong>Total time from session to bank deposit:</strong> Approximately 5-10 business days</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">4.9 Failed Payments</h3>
                <p>If payment to Tutor fails due to invalid bank account information:</p>
                <ul className="list-disc pl-6">
                  <li>Payment is held until Tutor provides valid account information</li>
                  <li>Tutor notified via email</li>
                  <li>Tutor must update bank information in account settings</li>
                  <li>Payment released once valid account provided</li>
                </ul>
                <p>StudyBuddy is not responsible for delays caused by incorrect bank account information.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. TAX OBLIGATIONS AND REPORTING</h2>

                <h3 className="text-lg font-semibold mb-2">5.1 Tutor's Tax Responsibilities</h3>
                <p><strong>Tutor is solely responsible for ALL tax obligations</strong> arising from income earned through StudyBuddy, including but not limited to:</p>

                <p className="font-semibold mt-3">Federal Taxes:</p>
                <ul className="list-disc pl-6">
                  <li>Federal income tax on all tutoring income</li>
                  <li>Self-employment tax (currently 15.3% of net self-employment income, consisting of 12.4% Social Security tax and 2.9% Medicare tax)</li>
                  <li>Quarterly estimated tax payments to the IRS if estimated annual tax liability exceeds $1,000</li>
                  <li>Filing annual tax return (Form 1040 with Schedule C for business income and Schedule SE for self-employment tax)</li>
                </ul>

                <p className="font-semibold mt-3">State Taxes (California):</p>
                <ul className="list-disc pl-6">
                  <li>California state income tax on all tutoring income</li>
                  <li>Quarterly estimated tax payments to California Franchise Tax Board if estimated annual tax liability exceeds $500</li>
                  <li>Filing annual California tax return (Form 540)</li>
                </ul>

                <p className="font-semibold mt-3">Local Taxes:</p>
                <ul className="list-disc pl-6">
                  <li>Any applicable local business taxes or fees</li>
                  <li>City business licenses if required</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">5.2 Form W-9 Requirement</h3>
                <p><strong>Tutor MUST complete IRS Form W-9</strong> (Request for Taxpayer Identification Number and Certification) before receiving first payment.</p>
                <p>The W-9 requires:</p>
                <ul className="list-disc pl-6">
                  <li>Legal name (individual or business name)</li>
                  <li>Business name/DBA if different from legal name</li>
                  <li>Federal tax classification (individual/sole proprietor, LLC, etc.)</li>
                  <li>Address</li>
                  <li>Taxpayer Identification Number (SSN or EIN)</li>
                  <li>Certification under penalty of perjury</li>
                </ul>
                <p><strong>Stripe Connect will prompt Tutor to complete the W-9</strong> during account setup. Failure to provide a W-9 will prevent payment processing.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">5.3 Form 1099-NEC Reporting</h3>
                <p><strong>StudyBuddy will issue Form 1099-NEC</strong> (Nonemployee Compensation) to Tutor for any calendar year in which Tutor earns <strong>$600 or more</strong> in gross compensation.</p>
                <ul className="list-disc pl-6">
                  <li>Form 1099-NEC will be provided by <strong>January 31</strong> of the year following the tax year</li>
                  <li>Copy provided electronically via Stripe and/or email</li>
                  <li>StudyBuddy also files 1099-NEC with the IRS</li>
                  <li>Tutor must report this income on tax return (Schedule C)</li>
                </ul>
                <p><strong>Important:</strong> Even if Tutor earns less than $600 and does not receive a 1099-NEC, <strong>Tutor is still required to report ALL income to the IRS</strong>, regardless of amount.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">5.4 Form 1099-K Reporting (Stripe)</h3>
                <p>In addition to StudyBuddy's 1099-NEC, <strong>Stripe may also issue Form 1099-K</strong> (Payment Card and Third Party Network Transactions) to Tutor if Tutor meets the following thresholds in a calendar year:</p>

                <p className="font-semibold mt-2">Current threshold (2025):</p>
                <ul className="list-disc pl-6">
                  <li>More than $20,000 in gross payment volume, AND</li>
                  <li>More than 200 transactions</li>
                </ul>

                <p><strong>Note:</strong> Some states have lower thresholds. The federal threshold is scheduled to decrease in future years.</p>

                <p>If Tutor receives both 1099-NEC from StudyBuddy and 1099-K from Stripe for the same income:</p>
                <ul className="list-disc pl-6">
                  <li>This is <strong>duplicate reporting</strong> of the same income</li>
                  <li>Tutor should report the <strong>correct gross income amount once</strong> on tax return</li>
                  <li>Do NOT double-count income</li>
                  <li>Consult a tax professional if needed for proper reporting</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">5.5 Backup Withholding</h3>
                <p>If Tutor fails to provide a valid Taxpayer Identification Number (TIN), or if the IRS notifies StudyBuddy that Tutor is subject to backup withholding:</p>
                <ul className="list-disc pl-6">
                  <li>StudyBuddy is <strong>required by law</strong> to withhold <strong>24%</strong> of all payments to Tutor</li>
                  <li>Withheld amounts are remitted directly to the IRS</li>
                  <li>Tutor receives remaining 76% of payment</li>
                  <li>Withheld amounts credited to Tutor when filing tax return</li>
                </ul>

                <p>To avoid backup withholding:</p>
                <ul className="list-disc pl-6">
                  <li>Provide correct TIN on Form W-9</li>
                  <li>Ensure TIN matches IRS records</li>
                  <li>Resolve any IRS notices regarding backup withholding</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">5.6 Quarterly Estimated Tax Payments</h3>
                <p>As an independent contractor, Tutor is generally required to make <strong>quarterly estimated tax payments</strong> to both the IRS and California Franchise Tax Board if estimated annual tax liability exceeds:</p>
                <ul className="list-disc pl-6">
                  <li><strong>Federal:</strong> $1,000</li>
                  <li><strong>California:</strong> $500</li>
                </ul>

                <p className="font-semibold mt-2">Estimated tax due dates:</p>
                <ul className="list-disc pl-6">
                  <li>Q1 (Jan-Mar income): April 15</li>
                  <li>Q2 (Apr-May income): June 15</li>
                  <li>Q3 (Jun-Aug income): September 15</li>
                  <li>Q4 (Sep-Dec income): January 15 of following year</li>
                </ul>

                <p>Use IRS Form 1040-ES and California Form 540-ES to calculate and pay estimated taxes.</p>
                <p><strong>Failure to pay estimated taxes may result in penalties and interest.</strong></p>

                <h3 className="text-lg font-semibold mb-2 mt-4">5.7 Business Expense Deductions</h3>
                <p>As a self-employed tutor, Tutor may be eligible to deduct ordinary and necessary business expenses on Schedule C, potentially including:</p>
                <ul className="list-disc pl-6">
                  <li>Home office deduction (if applicable)</li>
                  <li>Internet and phone expenses (business portion)</li>
                  <li>Educational materials and supplies</li>
                  <li>Professional development and training</li>
                  <li>Mileage for travel to in-person sessions (at IRS standard mileage rate)</li>
                  <li>Computer and software used for tutoring</li>
                  <li>Professional licenses or certifications</li>
                  <li>Marketing and advertising expenses</li>
                  <li>Professional insurance (if purchased)</li>
                </ul>
                <p><strong>Consult a tax professional</strong> to determine eligible deductions and proper record-keeping requirements.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">5.8 No Tax Advice</h3>
                <p><strong>StudyBuddy does not provide tax advice.</strong> The information in this section is general information only and should not be relied upon for tax planning or preparation.</p>
                <p><strong>Tutor should consult a qualified tax professional</strong> (CPA, enrolled agent, or tax attorney) regarding:</p>
                <ul className="list-disc pl-6">
                  <li>Proper tax reporting and filing requirements</li>
                  <li>Eligible business expense deductions</li>
                  <li>Estimated tax payment calculations</li>
                  <li>Business structure decisions (sole proprietor vs. LLC vs. S-corp)</li>
                  <li>State and local tax obligations</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">5.9 Record Keeping</h3>
                <p>Tutor should maintain accurate records of:</p>
                <ul className="list-disc pl-6">
                  <li>All income received through StudyBuddy</li>
                  <li>All business expenses</li>
                  <li>Session logs and documentation</li>
                  <li>Receipts and invoices</li>
                  <li>Mileage logs for business travel</li>
                  <li>Bank statements and payment records</li>
                </ul>
                <p><strong>IRS requires records to be retained for at least 3 years</strong> from the date of filing the tax return (longer in some circumstances). California requires 4 years.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. SESSION CONDUCT AND ACADEMIC INTEGRITY</h2>

                <h3 className="text-lg font-semibold mb-2">6.1 Professional Conduct</h3>
                <p>Tutor agrees to:</p>
                <ul className="list-disc pl-6">
                  <li>Provide tutoring services in a professional, competent, and ethical manner</li>
                  <li>Treat students with respect and dignity</li>
                  <li>Maintain appropriate professional boundaries</li>
                  <li>Arrive on time for scheduled sessions (or notify student of delays)</li>
                  <li>Come prepared with necessary materials</li>
                  <li>Follow through on commitments made to students</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">6.2 Academic Integrity Standards</h3>
                <p><strong>Tutor MUST comply with all academic integrity policies</strong> set forth in the StudyBuddy Acceptable Use Policy and these terms.</p>

                <p className="font-semibold mt-3">PERMITTED tutoring activities include:</p>
                <ul className="list-disc pl-6">
                  <li>Explaining concepts, theories, and principles</li>
                  <li>Teaching problem-solving methods and approaches</li>
                  <li>Working through example problems together (with student actively participating)</li>
                  <li>Reviewing course materials and lecture content</li>
                  <li>Identifying errors in student work (without correcting them directly)</li>
                  <li>Providing feedback on drafts with suggestions (not direct edits)</li>
                  <li>Creating practice problems and study guides</li>
                  <li>Teaching test-taking strategies and time management</li>
                  <li>Explaining grading rubrics and professor expectations</li>
                </ul>

                <p className="font-semibold mt-3">PROHIBITED academic dishonesty includes:</p>
                <ul className="list-disc pl-6">
                  <li>Completing assignments or projects on behalf of students</li>
                  <li>Writing papers, essays, or reports for students</li>
                  <li>Taking quizzes, tests, or exams on behalf of students or helping students take them</li>
                  <li>Providing direct answers to graded assignments without teaching underlying concepts</li>
                  <li>Doing work "for" students instead of "with" students</li>
                  <li>Any activity violating USC's or any other institution's honor code or academic integrity policy</li>
                  <li>Helping students submit others' work as their own</li>
                  <li>Ghost-writing or contract cheating services</li>
                  <li>Sharing test questions or exam materials obtained improperly</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">6.3 Key Principle: Facilitating Learning vs. Completing Work</h3>
                <p><strong>The fundamental distinction:</strong></p>
                <ul className="list-disc pl-6">
                  <li><strong>ACCEPTABLE:</strong> Helping students develop their own understanding and skills so they can complete work independently</li>
                  <li><strong>UNACCEPTABLE:</strong> Doing work for students that they will submit as their own</li>
                </ul>
                <p>When in doubt, ask: "Will this help the student learn to do this themselves, or am I just doing it for them?"</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">6.4 Consequences for Violations</h3>
                <p>Violations of academic integrity policies will result in:</p>

                <p className="font-semibold mt-2">First violation (or minor borderline case):</p>
                <ul className="list-disc pl-6">
                  <li>Warning email with educational content</li>
                  <li>Violation documented in Tutor's file</li>
                  <li>Continued monitoring</li>
                </ul>

                <p className="font-semibold mt-2">Second violation or moderate violation:</p>
                <ul className="list-disc pl-6">
                  <li>Account suspension for 7-30 days (access blocked)</li>
                  <li>Required acknowledgment of policies before reinstatement</li>
                  <li>Violation remains on permanent record</li>
                </ul>

                <p className="font-semibold mt-2">Third violation or serious violation:</p>
                <ul className="list-disc pl-6">
                  <li><strong>Immediate permanent account termination</strong></li>
                  <li>No refunds of any fees or earnings</li>
                  <li>IP address and device ban to prevent re-registration</li>
                  <li>Possible notification to USC if student violated USC honor code</li>
                  <li>Cooperation with any university investigation</li>
                </ul>

                <p className="font-semibold mt-2">Serious violations resulting in immediate permanent ban:</p>
                <ul className="list-disc pl-6">
                  <li>Completing assignments for students</li>
                  <li>Writing papers for students</li>
                  <li>Taking tests/exams for students</li>
                  <li>Ghost-writing services</li>
                  <li>Any confirmed contract cheating</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">6.5 Reporting Concerns</h3>
                <p>If a student requests academic dishonesty services, Tutor should:</p>
                <ol className="list-decimal pl-6">
                  <li>Politely decline and explain appropriate tutoring boundaries</li>
                  <li>Report the incident to StudyBuddy at safety@studybuddy.com</li>
                  <li>Do not continue working with that student if they persist</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. SAFETY AND IN-PERSON SESSIONS</h2>

                <h3 className="text-lg font-semibold mb-2">7.1 Tutor's Safety Responsibilities</h3>
                <p>For in-person tutoring sessions, Tutor is responsible for:</p>
                <ul className="list-disc pl-6">
                  <li>Choosing safe meeting locations</li>
                  <li>Assessing student appropriateness and safety</li>
                  <li>Trusting personal instincts and declining sessions if uncomfortable</li>
                  <li>Leaving any situation that feels unsafe</li>
                  <li>Reporting safety concerns to StudyBuddy immediately</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">7.2 Recommended Safety Practices</h3>
                <p>StudyBuddy recommends (but does not require) that tutors who meet students in person:</p>
                <ul className="list-disc pl-6">
                  <li>Meet in public, well-lit spaces such as campus libraries, coffee shops, or student centers</li>
                  <li>Avoid meeting in private residences, especially for initial sessions</li>
                  <li>Share session details (location, time, student name) with a trusted friend or family member</li>
                  <li>Keep mobile phone charged and accessible</li>
                  <li>Conduct initial sessions during daytime hours</li>
                  <li>Set clear boundaries about acceptable behavior</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">7.3 No Platform Control Over In-Person Sessions</h3>
                <p>Tutor acknowledges that:</p>
                <ul className="list-disc pl-6">
                  <li>StudyBuddy does NOT control, supervise, or monitor in-person tutoring sessions</li>
                  <li>All in-person meetings occur entirely outside StudyBuddy's control</li>
                  <li>StudyBuddy has NO responsibility for safety of in-person meetings</li>
                  <li>Tutor assumes all risks associated with meeting students in person</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">7.4 Virtual Session Options</h3>
                <p>Tutor may offer virtual tutoring sessions via video conferencing platforms (Zoom, Google Meet, etc.) to eliminate in-person safety risks. Virtual sessions are recommended especially for:</p>
                <ul className="list-disc pl-6">
                  <li>Initial sessions with new students</li>
                  <li>Students Tutor has not met before</li>
                  <li>Evening or late-night sessions</li>
                  <li>Sessions in subjects that don't require in-person interaction</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. INSURANCE</h2>

                <h3 className="text-lg font-semibold mb-2">8.1 Tutor's Insurance Responsibilities</h3>
                <p><strong>Tutor is encouraged (but not required) to obtain professional liability insurance</strong> to protect against claims arising from tutoring services.</p>

                <p><strong>StudyBuddy's insurance does NOT cover:</strong></p>
                <ul className="list-disc pl-6">
                  <li>Claims against Tutor by students</li>
                  <li>Tutor's professional errors or omissions</li>
                  <li>Personal injury or property damage claims</li>
                  <li>Any liability arising from Tutor's services</li>
                </ul>

                <p><strong>Tutor conducts business at Tutor's own risk</strong> and is solely responsible for any liabilities arising from provision of tutoring services.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">8.2 Platform Insurance</h3>
                <p>StudyBuddy maintains general liability and cyber liability insurance for platform operations only. This insurance:</p>
                <ul className="list-disc pl-6">
                  <li>Covers only StudyBuddy's operations and platform</li>
                  <li>Does NOT extend coverage to tutors</li>
                  <li>Does NOT cover tutor-student interactions</li>
                  <li>Does NOT protect tutors from claims</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. CONFIDENTIALITY AND DATA PROTECTION</h2>

                <h3 className="text-lg font-semibold mb-2">9.1 Student Information Confidentiality</h3>
                <p>Tutor agrees to keep all student information strictly confidential, including:</p>
                <ul className="list-disc pl-6">
                  <li>Names and contact information</li>
                  <li>Academic records and performance</li>
                  <li>Session content and discussions</li>
                  <li>Personal information shared during sessions</li>
                  <li>Any other information obtained through the tutor-student relationship</li>
                </ul>

                <p>Tutor will NOT:</p>
                <ul className="list-disc pl-6">
                  <li>Share student information with third parties (except as required by law)</li>
                  <li>Discuss students with others (except in aggregate, anonymized form)</li>
                  <li>Use student information for purposes other than providing tutoring services</li>
                  <li>Retain student information longer than necessary for tutoring purposes</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">9.2 Exceptions to Confidentiality</h3>
                <p>Tutor may disclose student information only:</p>
                <ul className="list-disc pl-6">
                  <li>With student's explicit written consent</li>
                  <li>When required by law or valid legal process (subpoena, court order)</li>
                  <li>To report suspected child abuse or imminent harm (as required by California law)</li>
                  <li>To StudyBuddy when necessary for dispute resolution</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">9.3 Educational Records Protection</h3>
                <p><strong>Student academic records are sensitive and must be protected.</strong></p>
                <p>If Tutor receives or views student transcripts, grade reports, or other educational records:</p>
                <ul className="list-disc pl-6">
                  <li>Treat as strictly confidential</li>
                  <li>Do not share with anyone</li>
                  <li>Do not retain copies after tutoring relationship ends</li>
                  <li>Delete or destroy securely when no longer needed</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">9.4 FERPA Considerations</h3>
                <p>While StudyBuddy and Tutor are not subject to the Family Educational Rights and Privacy Act (FERPA) because we receive no federal education funding, Tutor should handle educational records with the same care as if FERPA applied.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. INTELLECTUAL PROPERTY</h2>

                <h3 className="text-lg font-semibold mb-2">10.1 Tutor's Intellectual Property</h3>
                <p>Tutor retains all rights to:</p>
                <ul className="list-disc pl-6">
                  <li>Tutor's original teaching materials</li>
                  <li>Lesson plans and curricula created by Tutor</li>
                  <li>Practice problems, worksheets, or study guides created by Tutor</li>
                  <li>Any other intellectual property created independently by Tutor</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">10.2 License to StudyBuddy</h3>
                <p>Tutor grants StudyBuddy a limited, non-exclusive, royalty-free license to:</p>
                <ul className="list-disc pl-6">
                  <li>Display Tutor's profile information, photo, and bio on the Platform</li>
                  <li>Display Tutor's courses, subjects, and qualifications</li>
                  <li>Use Tutor's name and likeness in connection with Platform operation</li>
                  <li>Display reviews and ratings of Tutor</li>
                </ul>
                <p>This license terminates when Tutor's account is closed, except StudyBuddy may retain archived information as required for legal, tax, or dispute resolution purposes.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">10.3 StudyBuddy's Intellectual Property</h3>
                <p>StudyBuddy owns all rights to the Platform, including:</p>
                <ul className="list-disc pl-6">
                  <li>Website code, software, and functionality</li>
                  <li>StudyBuddy branding, logos, and trademarks</li>
                  <li>Platform design and user interface</li>
                  <li>Proprietary algorithms and systems</li>
                </ul>

                <p>Tutor may NOT:</p>
                <ul className="list-disc pl-6">
                  <li>Copy, modify, or reverse engineer the Platform</li>
                  <li>Use StudyBuddy trademarks without written permission</li>
                  <li>Create derivative works based on the Platform</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">10.4 Student Work Product</h3>
                <p><strong>Students retain ownership of all work they produce</strong>, including:</p>
                <ul className="list-disc pl-6">
                  <li>Assignments, papers, and projects</li>
                  <li>Notes taken during sessions</li>
                  <li>Answers to practice problems</li>
                </ul>

                <p>Tutor may NOT:</p>
                <ul className="list-disc pl-6">
                  <li>Claim ownership of student work</li>
                  <li>Reuse student work without permission</li>
                  <li>Share student work with others</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">11. REPRESENTATIONS AND WARRANTIES</h2>
                <p>Tutor represents, warrants, and covenants that:</p>

                <h3 className="text-lg font-semibold mb-2">11.1 Qualifications</h3>
                <ul className="list-disc pl-6">
                  <li>Tutor is qualified to provide tutoring services in the subjects listed on Tutor's profile</li>
                  <li>Tutor possesses the knowledge, skills, education, and experience represented in Tutor's profile</li>
                  <li>All information in Tutor's profile is true, accurate, and current</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">11.2 Legal Capacity</h3>
                <ul className="list-disc pl-6">
                  <li>Tutor is at least 18 years of age</li>
                  <li>Tutor has the legal capacity to enter into this Agreement</li>
                  <li>Tutor is legally authorized to work in the United States (if applicable)</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">11.3 Compliance with Laws</h3>
                <ul className="list-disc pl-6">
                  <li>Tutor will comply with all applicable federal, state, and local laws and regulations</li>
                  <li>Tutor will comply with all university academic integrity policies</li>
                  <li>Tutor will obtain any necessary business licenses or permits</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">11.4 No Conflicts of Interest</h3>
                <ul className="list-disc pl-6">
                  <li>Tutor is not currently employed by USC in a teaching or tutoring capacity that would create a conflict of interest</li>
                  <li>Tutor is not prohibited by any employment agreement or policy from providing independent tutoring services</li>
                  <li>Tutor has no conflicting obligations that would prevent performance under this Agreement</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">11.5 Insurance and Bonding</h3>
                <ul className="list-disc pl-6">
                  <li>Tutor maintains any insurance or bonding required by law for independent tutors (if applicable)</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">11.6 Accurate Profile Information</h3>
                <ul className="list-disc pl-6">
                  <li>All qualifications, credentials, education, and experience listed on Tutor's profile are truthful and verifiable</li>
                  <li>Profile photo is a current, accurate photo of Tutor</li>
                  <li>Tutor will promptly update profile if information changes</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">12. INDEMNIFICATION</h2>

                <h3 className="text-lg font-semibold mb-2">12.1 Tutor's Indemnification Obligation</h3>
                <p>Tutor agrees to indemnify, defend, and hold harmless StudyBuddy, its officers, directors, employees, affiliates, agents, and licensors from and against any and all claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising from or related to:</p>

                <ul className="list-disc pl-6">
                  <li>a) <strong>Tutor's conduct</strong> in providing tutoring services to students</li>
                  <li>b) <strong>Tutor's breach</strong> of this Agreement or any representations, warranties, or covenants</li>
                  <li>c) <strong>Claims by students</strong> against StudyBuddy arising from Tutor's services or conduct</li>
                  <li>d) <strong>Violations of law</strong> by Tutor, including violations of academic integrity policies, employment laws, tax laws, or other regulations</li>
                  <li>e) <strong>Intellectual property infringement</strong> by Tutor</li>
                  <li>f) <strong>Personal injury, property damage, or emotional distress</strong> caused by Tutor</li>
                  <li>g) <strong>Academic dishonesty facilitation</strong> or violations of university honor codes</li>
                  <li>h) <strong>Any content or information</strong> provided by Tutor on the Platform</li>
                  <li>i) <strong>In-person session incidents</strong> including but not limited to assault, harassment, injury, or property damage</li>
                  <li>j) <strong>Tax liability or employment claims</strong> arising from misclassification (if Tutor fails to comply with independent contractor obligations)</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">12.2 Defense and Settlement</h3>
                <p>StudyBuddy reserves the right to assume the exclusive defense and control of any matter subject to indemnification by Tutor, at Tutor's expense. Tutor agrees to cooperate with StudyBuddy's defense of such claims.</p>
                <p>Tutor may not settle any claim that imposes obligations on StudyBuddy without StudyBuddy's prior written consent.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">12.3 Survival</h3>
                <p>This indemnification obligation survives termination of this Agreement and Tutor's account.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">13. LIMITATION OF LIABILITY</h2>

                <h3 className="text-lg font-semibold mb-2">13.1 Platform Provided "As-Is"</h3>
                <p>StudyBuddy provides the Platform on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind. StudyBuddy does NOT warrant that:</p>
                <ul className="list-disc pl-6">
                  <li>The Platform will be error-free or uninterrupted</li>
                  <li>Defects will be corrected</li>
                  <li>The Platform is free from viruses or harmful components</li>
                  <li>Platform will result in any particular number of students or income</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">13.2 No Guarantee of Students or Income</h3>
                <p><strong>StudyBuddy makes NO guarantee regarding:</strong></p>
                <ul className="list-disc pl-6">
                  <li>Number of students Tutor will receive</li>
                  <li>Amount of income Tutor will earn</li>
                  <li>Quality or suitability of students</li>
                  <li>Success of Tutor's tutoring business</li>
                </ul>
                <p>Income depends entirely on factors outside StudyBuddy's control, including Tutor's rates, availability, qualifications, reviews, student demand, and competitive market conditions.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">13.3 Limitation of Damages</h3>
                <p><strong>TO THE MAXIMUM EXTENT PERMITTED BY CALIFORNIA LAW</strong>, StudyBuddy shall NOT be liable for:</p>
                <ul className="list-disc pl-6">
                  <li>Loss of income, revenue, or business opportunities</li>
                  <li>Loss of data or information</li>
                  <li>Indirect, incidental, consequential, special, exemplary, or punitive damages</li>
                  <li>Damages arising from disputes with students</li>
                  <li>Damages from Platform errors, downtime, or technical issues</li>
                  <li>Damages from account suspension or termination</li>
                  <li>Any damages exceeding the total platform fees paid by students for sessions Tutor completed in the 12 months preceding the claim</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">13.4 California Law Exception</h3>
                <p>This limitation of liability does NOT apply to:</p>
                <ul className="list-disc pl-6">
                  <li>Gross negligence, fraud, or willful misconduct by StudyBuddy</li>
                  <li>Violations of law by StudyBuddy</li>
                  <li>Liability that cannot be limited under California Civil Code § 1668</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">14. TERMINATION</h2>

                <h3 className="text-lg font-semibold mb-2">14.1 Termination by Tutor</h3>
                <p>Tutor may terminate this Agreement and close Tutor's account at any time by:</p>
                <ul className="list-disc pl-6">
                  <li>Submitting account closure request through Platform settings, OR</li>
                  <li>Emailing support@studybuddy.com</li>
                </ul>

                <p>Upon termination:</p>
                <ul className="list-disc pl-6">
                  <li>Tutor's profile removed from Platform within 24 hours</li>
                  <li>Pending sessions cancelled with refunds processed according to cancellation policy</li>
                  <li>Unpaid earnings for completed sessions will be paid according to normal payment schedule</li>
                  <li>This Agreement terminates but certain provisions survive (see Section 14.5)</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">14.2 Termination by StudyBuddy</h3>
                <p>StudyBuddy may suspend or terminate Tutor's account and this Agreement immediately, without prior notice, if:</p>
                <ul className="list-disc pl-6">
                  <li>Tutor violates this Agreement or the Acceptable Use Policy</li>
                  <li>Tutor engages in academic dishonesty or facilitates cheating</li>
                  <li>Tutor commits fraud or misrepresentation</li>
                  <li>Tutor harasses or harms students or other users</li>
                  <li>Tutor violates applicable laws or regulations</li>
                  <li>Tutor's conduct harms StudyBuddy's reputation or operations</li>
                  <li>StudyBuddy suspects fraudulent activity</li>
                  <li>StudyBuddy is required to terminate by law or legal process</li>
                  <li>StudyBuddy ceases Platform operations</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">14.3 Effect of Termination for Violation</h3>
                <p>If StudyBuddy terminates Tutor's account due to violation of this Agreement:</p>
                <ul className="list-disc pl-6">
                  <li>Tutor is NOT entitled to payment for pending sessions</li>
                  <li>Tutor is NOT entitled to refund of any fees paid to StudyBuddy</li>
                  <li>Tutor may be banned from creating future accounts</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">14.4 Final Payment Settlement</h3>
                <p>For termination not due to violation:</p>
                <ul className="list-disc pl-6">
                  <li>Final payment for completed sessions paid within 30 days of termination</li>
                  <li>Subject to normal payment release procedures (both parties must confirm sessions occurred)</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">14.5 Survival of Provisions</h3>
                <p>The following provisions survive termination of this Agreement:</p>
                <ul className="list-disc pl-6">
                  <li>Payment obligations for completed sessions</li>
                  <li>Tax reporting and 1099 obligations</li>
                  <li>Confidentiality obligations</li>
                  <li>Indemnification obligations</li>
                  <li>Limitation of liability</li>
                  <li>Dispute resolution and arbitration provisions</li>
                  <li>Intellectual property licenses (for content already shared)</li>
                  <li>Any other provision that by its nature should survive</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">15. DISPUTE RESOLUTION WITH STUDYBUDDY</h2>

                <h3 className="text-lg font-semibold mb-2">15.1 Informal Resolution</h3>
                <p>Before initiating formal dispute resolution, Tutor agrees to first attempt informal resolution by:</p>
                <ol className="list-decimal pl-6">
                  <li>Sending written description of dispute to legal@studybuddy.com</li>
                  <li>Describing desired resolution</li>
                  <li>Allowing 30 days for StudyBuddy to respond and attempt resolution</li>
                </ol>

                <h3 className="text-lg font-semibold mb-2 mt-4">15.2 Arbitration</h3>
                <p>If informal resolution fails, disputes between Tutor and StudyBuddy will be resolved through binding individual arbitration in accordance with the Federal Arbitration Act.</p>

                <p><strong>Arbitration Provider:</strong> American Arbitration Association (AAA) or JAMS</p>
                <p><strong>Rules:</strong> AAA Commercial Arbitration Rules or JAMS Comprehensive Arbitration Rules</p>
                <p><strong>Location:</strong> Los Angeles County, California (or via video conference at Tutor's option)</p>
                <p><strong>Arbitrator:</strong> Single neutral arbitrator selected under provider's rules</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">15.3 Arbitration Fees</h3>
                <p className="font-semibold">For claims under $10,000:</p>
                <ul className="list-disc pl-6">
                  <li>StudyBuddy pays all arbitration fees</li>
                  <li>Tutor pays only own attorney fees (if represented)</li>
                </ul>

                <p className="font-semibold mt-2">For claims $10,000 or greater:</p>
                <ul className="list-disc pl-6">
                  <li>Fees allocated according to AAA/JAMS rules</li>
                  <li>Each party pays own attorney fees unless arbitrator awards fees</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">15.4 No Class Actions</h3>
                <p><strong>Disputes will be resolved on an individual basis only.</strong> Tutor may NOT:</p>
                <ul className="list-disc pl-6">
                  <li>Bring claims as plaintiff or class member in any class action</li>
                  <li>Consolidate arbitration with others' arbitrations</li>
                  <li>Participate in class-wide arbitration</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2 mt-4">15.5 Exceptions to Arbitration</h3>
                <p>The following may be brought in court rather than arbitration:</p>
                <ul className="list-disc pl-6">
                  <li>Small claims court actions (if qualify under small claims rules)</li>
                  <li>Claims for injunctive relief regarding intellectual property</li>
                  <li>Claims that cannot be arbitrated under applicable law</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">16. GENERAL PROVISIONS</h2>

                <h3 className="text-lg font-semibold mb-2">16.1 Entire Agreement</h3>
                <p>This Agreement, together with the StudyBuddy Terms of Service, Privacy Policy, and Acceptable Use Policy, constitutes the entire agreement between Tutor and StudyBuddy regarding Tutor's use of the Platform.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">16.2 Amendments</h3>
                <p>StudyBuddy may modify this Agreement by posting a revised version on the Platform and sending notice to Tutor's email address. Material changes will be effective 30 days after notice. Continued use of Platform after effective date constitutes acceptance of modifications.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">16.3 Governing Law</h3>
                <p>This Agreement is governed by the laws of the State of California and the laws of the United States, without regard to conflict of law principles.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">16.4 Venue</h3>
                <p>For any disputes not subject to arbitration, exclusive jurisdiction and venue lie in the state or federal courts located in Los Angeles County, California.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">16.5 Severability</h3>
                <p>If any provision of this Agreement is found unenforceable, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">16.6 No Waiver</h3>
                <p>StudyBuddy's failure to enforce any provision does not waive the right to enforce it later. Any waiver must be in writing and signed by an authorized StudyBuddy representative.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">16.7 Assignment</h3>
                <p>Tutor may NOT assign or transfer this Agreement without StudyBuddy's written consent. StudyBuddy may assign this Agreement to any affiliate or in connection with a merger, acquisition, or sale of assets.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">16.8 Force Majeure</h3>
                <p>Neither party is liable for failure to perform due to circumstances beyond reasonable control, including acts of God, war, terrorism, pandemics, internet failures, or government actions.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">16.9 Notices</h3>
                <p><strong>Notices to Tutor:</strong> Via email to the address associated with Tutor's account. Effective when sent.</p>
                <p><strong>Notices to StudyBuddy:</strong> Via email to legal@studybuddy.com or by mail to registered agent address.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">16.10 Relationship of Parties</h3>
                <p>Nothing in this Agreement creates an employment, agency, partnership, joint venture, or franchise relationship between Tutor and StudyBuddy.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">16.11 No Third-Party Beneficiaries</h3>
                <p>This Agreement is solely for the benefit of Tutor and StudyBuddy. No other person or entity has rights under this Agreement.</p>

                <h3 className="text-lg font-semibold mb-2 mt-4">16.12 Headings</h3>
                <p>Section headings are for convenience only and do not affect interpretation.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">17. ACKNOWLEDGMENT AND ACCEPTANCE</h2>
                <p>By clicking "I Accept" or by using the StudyBuddy Platform as a tutor, Tutor acknowledges and agrees that:</p>

                <ul className="list-disc pl-6">
                  <li>✓ Tutor has read and understood this entire Independent Contractor Agreement</li>
                  <li>✓ Tutor has had the opportunity to consult with an attorney regarding this Agreement</li>
                  <li>✓ Tutor enters into this Agreement voluntarily and without coercion</li>
                  <li>✓ Tutor understands that Tutor is an independent contractor, NOT an employee</li>
                  <li>✓ Tutor is responsible for all taxes on income earned through StudyBuddy</li>
                  <li>✓ Tutor will comply with all academic integrity policies</li>
                  <li>✓ Tutor will provide services in a professional and ethical manner</li>
                  <li>✓ Tutor assumes all risks associated with providing tutoring services</li>
                  <li>✓ This Agreement complies with California Labor Code §§ 2775-2787</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">SIGNATURE</h2>
                <p><strong>TUTOR:</strong></p>
                <p>By clicking "I Accept" below, you electronically sign and agree to all terms of this Independent Contractor Agreement.</p>
                
                <p className="mt-4"><strong>STUDYBUDDY LLC:</strong></p>
                <p>By: [Authorized Representative]</p>
                <p>Title: [Title]</p>
                <p>Date: October 6, 2025</p>
              </section>

              <div className="border-t pt-6 mt-8">
                <p className="text-center font-semibold text-lg">
                  BY CLICKING "I ACCEPT," TUTOR AGREES TO ALL TERMS AND CONDITIONS OF THIS INDEPENDENT CONTRACTOR AGREEMENT.
                </p>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Last Updated: October 6, 2025<br />
                  Version 1.0
                </p>
              </div>
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
