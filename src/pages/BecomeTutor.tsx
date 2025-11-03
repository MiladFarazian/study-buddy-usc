import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  DollarSign, 
  Calendar, 
  Award, 
  Users, 
  Clock,
  Star,
  TrendingUp,
  Shield,
  Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const BecomeTutor = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCTA = () => {
    if (user) {
      navigate("/settings/tutor-settings");
    } else {
      navigate("/register");
    }
  };

  const howItWorksSteps = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Apply",
      description: "Create an account and submit your tutor application through profile settings"
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: "Get Approved",
      description: "Our review process takes up to 4 business days"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Set Up Payment",
      description: "Connect your Stripe account to receive secure payments"
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Set Availability",
      description: "Choose your schedule and the courses you want to tutor"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Start Tutoring",
      description: "Students book sessions, you tutor, and get paid after confirmation"
    }
  ];

  const benefits = [
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Flexible Scheduling",
      description: "You control when and how much you work"
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      title: "Set Your Own Rate",
      description: "You decide your hourly rate (small fees apply)"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Choose Remote or In-Person",
      description: "Automated Zoom integration for online sessions"
    },
    {
      icon: <Award className="w-5 h-5" />,
      title: "Earn Recognition",
      description: "Receive badges for excellent performance"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Build Your Portfolio",
      description: "Gain teaching experience and positive reviews"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Secure Payments",
      description: "Industry-standard payment processing with Stripe"
    }
  ];

  const badges = [
    { name: "Rising Star", description: "Early success recognition" },
    { name: "Stress Reducer", description: "Calming presence" },
    { name: "Consistent Tutor", description: "Regular availability" },
    { name: "Top Rated", description: "Excellent reviews" },
    { name: "Student Success", description: "Proven results" },
    { name: "Responsive", description: "Quick communication" }
  ];

  const requirements = [
    "Must be a verified USC student (via @usc.edu email)",
    "Strong academic performance in courses you want to tutor",
    "Professional communication skills",
    "Reliable and punctual attendance",
    "Teaching or tutoring experience (preferred but not required)"
  ];

  const faqs = [
    {
      question: "How long does the approval process take?",
      answer: "The review process typically takes up to 4 business days. We'll notify you via email once your application has been reviewed."
    },
    {
      question: "How do I get paid?",
      answer: "After both you and the student confirm the session occurred, payment clears from the student, and the transfer is initiated to your connected Stripe account the next day."
    },
    {
      question: "Do I need my own Zoom account?",
      answer: "No! We provide automated Zoom meeting creation for all online sessions. You'll receive the meeting link automatically."
    },
    {
      question: "What if I need to cancel a session?",
      answer: "You can cancel sessions, but repeated cancellations may affect your account standing. No payment is processed for cancelled sessions."
    },
    {
      question: "Can I tutor multiple courses?",
      answer: "Absolutely! You can select as many courses as you feel qualified to tutor. This increases your visibility to more students."
    },
    {
      question: "Can I be both a tutor and a student?",
      answer: "Yes! Many users have dual roles - tutoring courses they excel in while booking sessions for courses they need help with."
    },
    {
      question: "How much does StudyBuddy take from my earnings?",
      answer: "StudyBuddy charges a 1% platform fee plus standard Stripe processing fees (2.9% + $0.30 per transaction). These fees are deducted from the amount students pay. For example, on a $50/hour session, you would receive approximately $47.55 after fees."
    }
  ];

  return (
    <div className={`min-h-screen ${isMobile ? 'px-4 py-8' : 'px-8 py-12'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-8">
            Become a StudyBuddy Tutor
          </h1>
          <Button size="lg" onClick={handleCTA} className="text-xl px-12 py-8 h-auto">
            {user ? "Apply Now" : "Create Account"}
          </Button>
        </div>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-5'} gap-6`}>
            {howItWorksSteps.map((step, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-3 text-primary">
                    {step.icon}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Payment & Earnings */}
        <section className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Payment & Earnings</CardTitle>
              <CardDescription>Transparent, secure, and fair compensation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Fee Structure
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• <strong>Students pay:</strong> Your hourly rate</li>
                    <li>• <strong>Platform fee:</strong> 1% + Stripe processing fees (deducted from your earnings)</li>
                    <li>• <strong>You control:</strong> Set your own hourly rate</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Payment Timeline
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Both parties confirm session completion</li>
                    <li>• Payment clears from student account</li>
                    <li>• Transfer initiated next day to your bank</li>
                    <li>• Industry-standard Stripe security</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Benefits */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Why Tutor on StudyBuddy?</h2>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-6`}>
            {benefits.map((benefit, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="text-primary">{benefit.icon}</div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Requirements */}
        <section className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Requirements</CardTitle>
              <CardDescription>What we look for in our tutors</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Badge System */}
        <section className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Earn Recognition Badges</CardTitle>
              <CardDescription>Get recognized for your excellent tutoring performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Our badge system automatically rewards tutors for outstanding performance. Badges are displayed on your profile and help you stand out to students.
              </p>
              <div className="flex flex-wrap gap-2">
                {badges.map((badge, index) => (
                  <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                    <Award className="w-3 h-3 mr-1" />
                    {badge.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center py-12 bg-muted/50 rounded-lg">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Tutoring?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Join our community of USC tutors and start making a difference today
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={handleCTA}>
              {user ? "Apply Now" : "Create Account"}
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/faq")}>
              Learn More
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            Questions? Contact us at support@studybuddy.usc.edu
          </p>
        </section>
      </div>
    </div>
  );
};

export default BecomeTutor;
