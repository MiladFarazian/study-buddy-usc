
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useTutor } from "@/hooks/useTutor";
import { Star, Calendar, Clock, ArrowLeft, Loader2, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { BookSessionModal } from "@/components/scheduling/BookSessionModal";
import MessageButton from "@/components/messaging/MessageButton";

const TutorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { tutor, reviews, loading } = useTutor(id || "");
  const { user } = useAuth();
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
        {/* Main Profile Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={tutor.imageUrl} alt={tutor.name} />
                  <AvatarFallback className="bg-usc-cardinal text-white text-xl">
                    {getInitials(tutor.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold">{tutor.name}</h1>
                  <p className="text-xl text-muted-foreground">{tutor.field}</p>
                  <div className="flex items-center mt-2">
                    <Star className="h-5 w-5 fill-usc-gold text-usc-gold" />
                    <span className="ml-1 font-medium">{tutor.rating.toFixed(1)}/5.0</span>
                    <span className="ml-2 text-muted-foreground">({reviews.length} reviews)</span>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div>
                <h2 className="text-xl font-semibold mb-4">About Me</h2>
                <p className="text-muted-foreground">
                  {tutor.bio || 
                    "I'm passionate about helping students understand complex topics and achieve their academic goals. My teaching approach focuses on building a strong foundation and developing problem-solving skills."}
                </p>
              </div>

              <Separator className="my-6" />

              <div>
                <h2 className="text-xl font-semibold mb-4">Education</h2>
                <p className="font-medium">University of Southern California</p>
                <p className="text-muted-foreground">
                  {tutor.field} {tutor.graduationYear ? `(Class of ${tutor.graduationYear})` : ""}
                </p>
              </div>

              <Separator className="my-6" />

              <div>
                <h2 className="text-xl font-semibold mb-4">Subjects</h2>
                <div className="flex flex-wrap gap-2">
                  {tutor.subjects.map((subject) => (
                    <Badge
                      key={subject.code}
                      variant="outline"
                      className="bg-red-50 hover:bg-red-100 text-usc-cardinal border-red-100 text-sm py-1 px-3"
                    >
                      {subject.code} - {subject.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-muted-foreground py-4">No reviews yet.</p>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="pb-4 border-b border-gray-100 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{review.reviewerName || "Anonymous Student"}</p>
                          <div className="flex items-center mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < review.rating ? "fill-usc-gold text-usc-gold" : "text-gray-300"}`} 
                              />
                            ))}
                            <span className="ml-2 text-sm text-muted-foreground">
                              {format(new Date(review.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                      {review.comment && <p className="text-muted-foreground mt-2">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar/Booking Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Tutoring Session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="font-bold text-2xl text-usc-cardinal">${tutor.hourlyRate}/hour</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Flexible Schedule</p>
                    <p className="text-sm text-muted-foreground">Weekly or one-time sessions</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Sessions from 1-2 hours</p>
                    <p className="text-sm text-muted-foreground">Tailored to your needs</p>
                  </div>
                </div>
              </div>

              {/* Show Book Session button for all users */}
              <Button 
                className="w-full bg-usc-cardinal hover:bg-usc-cardinal-dark text-white mb-3"
                onClick={() => setShowBookingModal(true)}
              >
                Book a Session
              </Button>
              
              {/* Show Message button for all users */}
              <MessageButton 
                recipient={tutor} 
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Booking Modal */}
      {tutor && (
        <BookSessionModal 
          tutor={tutor}
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  );
};

export default TutorProfile;
