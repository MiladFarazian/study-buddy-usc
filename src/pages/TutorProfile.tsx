import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTutor } from "@/hooks/useTutor";
import { ArrowLeft, Book, Calendar, Clock, DollarSign, Loader2, Mail } from "lucide-react";
import { TutorProfileHeader } from "@/components/tutor/TutorProfileHeader";
import { TutorBioSection } from "@/components/tutor/TutorBioSection";
import { TutorEducationSection } from "@/components/tutor/TutorEducationSection";
import { TutorSubjectsSection } from "@/components/tutor/TutorSubjectsSection";
import { TutorReviewsSection } from "@/components/tutor/TutorReviewsSection";
import { TutorAvailabilityCard } from "@/components/scheduling/TutorAvailabilityCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import MessageButton from "@/components/messaging/MessageButton";
import { CalendlyBookingWizard } from "@/components/scheduling/CalendlyBookingWizard";
import { TutorAvailabilitySection } from "@/components/tutor/TutorAvailabilitySection";

const TutorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { tutor, reviews, loading, refreshReviews } = useTutor(id || "");
  const [showBookingModal, setShowBookingModal] = useState(false);

  if (loading) {
    return (
      <div className="container py-8 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
        <span className="ml-2">Loading tutor profile...</span>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="container py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">Tutor Not Found</h1>
        <p className="text-muted-foreground mb-6">
          Sorry, we couldn't find the tutor profile you're looking for.
        </p>
        <Button asChild>
          <Link to="/tutors" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tutors
          </Link>
        </Button>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  const formattedHourlyRate = tutor.hourlyRate ? `$${tutor.hourlyRate.toFixed(2)}` : "$25.00";

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link to="/tutors" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tutors
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <TutorProfileHeader 
                  tutor={tutor} 
                  reviewsCount={reviews.length} 
                  getInitials={getInitials} 
                  showDetails={false}
                />
                
                <h2 className="text-xl font-semibold mt-4">{tutor.name}</h2>
                <p className="text-muted-foreground">{tutor.field}</p>
                
                <div className="flex items-center justify-center mt-1">
                  <span className="text-yellow-500">★</span>
                  <span className="ml-1 font-medium">{tutor.rating.toFixed(1)}/5.0</span>
                </div>
                
                <div className="w-full mt-6 space-y-4">
                  <div className="flex items-start">
                    <DollarSign className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{formattedHourlyRate}/hour</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground truncate">Contact via messaging</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Book className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Tutors {tutor.subjects.length} subjects</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-6 bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
                  onClick={() => setShowBookingModal(true)}
                >
                  Book a Session
                </Button>
                
                <MessageButton 
                  recipient={tutor} 
                  className="w-full mt-3"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-6">
              <TabsTrigger value="about" className="data-[state=active]:bg-usc-cardinal data-[state=active]:text-white">About</TabsTrigger>
              <TabsTrigger value="subjects" className="data-[state=active]:bg-usc-cardinal data-[state=active]:text-white">Subjects</TabsTrigger>
              <TabsTrigger value="availability" className="data-[state=active]:bg-usc-cardinal data-[state=active]:text-white">Availability</TabsTrigger>
            </TabsList>
            
            <Card>
              <CardContent className="p-6">
                <TabsContent value="about" className="mt-0">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-4">About {tutor.firstName || tutor.name.split(' ')[0]}</h2>
                      <p className="text-muted-foreground">
                        {tutor.bio || 
                          `${tutor.name} is a ${tutor.field} major with experience in tutoring students.`}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Education</h3>
                      <div className="bg-muted/30 p-4 rounded-md">
                        <h4 className="font-medium">University of Southern California</h4>
                        <p className="text-muted-foreground">Major: {tutor.field}</p>
                        <p className="text-muted-foreground">Year: {tutor.graduationYear ? `Class of ${tutor.graduationYear}` : "Senior"}</p>
                      </div>
                    </div>
                    
                    <TutorReviewsSection 
                      reviews={reviews} 
                      tutorId={tutor.id} 
                      onReviewAdded={refreshReviews} 
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="subjects" className="mt-0">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Subjects</h2>
                    <p className="text-muted-foreground mb-4">
                      {tutor.firstName || tutor.name.split(' ')[0]} can help you with the following subjects:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      {tutor.subjects.map((subject) => (
                        <div key={subject.code} className="p-3 border rounded-md">
                          <p className="font-medium">{subject.name}</p>
                          <p className="text-sm text-muted-foreground">{subject.code}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="availability" className="mt-0">
                  <TutorAvailabilitySection tutor={tutor} />
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </div>
      
      <div className="mt-12 bg-usc-cardinal text-white rounded-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Ready to get started with {tutor.name}?</h2>
            <p className="mt-2">Book a session now and improve your academic performance!</p>
          </div>
          <Button 
            variant="outline" 
            className="mt-4 md:mt-0 bg-white text-usc-cardinal hover:bg-gray-100"
            onClick={() => setShowBookingModal(true)}
          >
            Book a Session
          </Button>
        </div>
      </div>
      
      <Dialog 
        open={showBookingModal} 
        onOpenChange={setShowBookingModal}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <CalendlyBookingWizard 
            tutor={tutor}
            onClose={() => setShowBookingModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TutorProfile;
