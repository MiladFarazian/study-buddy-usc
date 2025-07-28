import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StudentReviewModal, TutorReviewModal } from "@/components/reviews";
import { Session } from "@/types/session";
import { Profile } from "@/integrations/supabase/types-extension";
import { SessionType } from "@/lib/scheduling/types/booking";
import { User, GraduationCap, Eye } from "lucide-react";

// Mock tutor type for demo purposes - matching the actual Tutor interface
interface MockTutor {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  field: string;
  rating: number;
  hourlyRate: number;
  subjects: { code: string; name: string }[];
  imageUrl: string;
  bio?: string;
  graduationYear?: string;
}

export function ReviewDemo() {
  const [showStudentReview, setShowStudentReview] = useState(false);
  const [showTutorReview, setShowTutorReview] = useState(false);

  // Mock session data
  const mockSession: Session = {
    id: "demo-session-1",
    course_id: "demo-course-1",
    tutor_id: "demo-tutor-1",
    student_id: "demo-student-1",
    start_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    end_time: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    location: "Virtual",
    notes: "Calculus review session",
    status: "completed",
    payment_status: "paid",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    session_type: SessionType.VIRTUAL,
    zoom_meeting_id: "demo-meeting",
    zoom_join_url: "https://zoom.us/demo",
    course: {
      id: "demo-course-1",
      course_number: "MATH 125",
      course_title: "Calculus I"
    }
  };

  // Mock tutor data
  const mockTutor: MockTutor = {
    id: "demo-tutor-1",
    name: "Sarah Johnson",
    firstName: "Sarah",
    lastName: "Johnson", 
    field: "Mathematics",
    rating: 4.8,
    hourlyRate: 45,
    subjects: [
      { code: "MATH", name: "Mathematics" },
      { code: "CALC", name: "Calculus" },
      { code: "ALG", name: "Algebra" }
    ],
    imageUrl: "",
    bio: "PhD in Mathematics with 5 years of tutoring experience",
    graduationYear: "2020"
  };

  // Mock student data
  const mockStudent: Profile = {
    id: "demo-student-1",
    approved_tutor: false,
    availability: null,
    avatar_url: null,
    average_rating: 0,
    bio: "CS student focusing on algorithms and data structures",
    created_at: new Date().toISOString(),
    first_name: "Alex",
    graduation_year: "2025",
    hourly_rate: 0,
    last_name: "Chen",
    major: "Computer Science",
    role: "student",
    stripe_connect_id: null,
    stripe_connect_onboarding_complete: false,
    subjects: null,
    updated_at: new Date().toISOString()
  };

  const handleReviewComplete = () => {
    console.log("Review completed!");
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-usc-cardinal/5 to-usc-gold/5 border-usc-cardinal/20">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl text-usc-cardinal">
          <Eye className="h-6 w-6" />
          Review System Demo
        </CardTitle>
        <p className="text-muted-foreground">
          Experience the review flow that appears after every tutoring session
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Demo Session Info */}
        <div className="bg-white/50 rounded-lg p-4 border border-usc-cardinal/10">
          <h3 className="font-semibold text-lg mb-3 text-usc-cardinal">Mock Session Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Course:</span> MATH 125 - Calculus I
            </div>
            <div>
              <span className="font-medium">Duration:</span> 1 hour
            </div>
            <div>
              <span className="font-medium">Tutor:</span> Sarah Johnson
            </div>
            <div>
              <span className="font-medium">Student:</span> Alex Chen
            </div>
            <div>
              <span className="font-medium">Status:</span> 
              <Badge variant="secondary" className="ml-2">Just Completed</Badge>
            </div>
            <div>
              <span className="font-medium">Type:</span> Virtual Session
            </div>
          </div>
        </div>

        {/* Demo Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="font-semibold text-lg mb-2">Student Review Experience</h3>
              <p className="text-muted-foreground text-sm mb-4">
                See the comprehensive review flow students complete after sessions
              </p>
              <ul className="text-xs text-left space-y-1 mb-4">
                <li>• Show-up verification</li>
                <li>• Mental health assessment</li>
                <li>• Academic evaluation</li>
                <li>• Final feedback</li>
              </ul>
              <Button 
                onClick={() => setShowStudentReview(true)}
                className="w-full"
                variant="outline"
              >
                Demo Student Review
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-usc-cardinal" />
              <h3 className="font-semibold text-lg mb-2">Tutor Review Experience</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Experience the streamlined tutor review process
              </p>
              <ul className="text-xs text-left space-y-1 mb-4">
                <li>• Student show-up verification</li>
                <li>• Student engagement evaluation</li>
                <li>• Quick submission</li>
                <li>• Payment processing trigger</li>
              </ul>
              <Button 
                onClick={() => setShowTutorReview(true)}
                className="w-full bg-usc-cardinal hover:bg-usc-cardinal/90 text-white"
              >
                Demo Tutor Review
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <div className="bg-usc-gold/10 rounded-lg p-4 border border-usc-gold/30">
          <h4 className="font-semibold text-usc-cardinal mb-2">🔒 Review Requirements</h4>
          <p className="text-sm text-muted-foreground">
            Both students and tutors must complete their review before accessing other parts of the platform. 
            This ensures payment processing, quality control, and continuous improvement of the tutoring experience.
          </p>
        </div>
      </CardContent>

      {/* Review Modals */}
      <StudentReviewModal
        isOpen={showStudentReview}
        onClose={() => setShowStudentReview(false)}
        session={mockSession}
        tutor={mockTutor}
        onReviewSubmitted={handleReviewComplete}
      />

      <TutorReviewModal
        isOpen={showTutorReview}
        onClose={() => setShowTutorReview(false)}
        session={mockSession}
        student={mockStudent}
        onSubmitComplete={handleReviewComplete}
      />
    </Card>
  );
}