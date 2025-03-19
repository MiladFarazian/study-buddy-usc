
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, DollarSign, MapPin, GraduationCap, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Tutor } from "@/types/tutor";

interface TutorCardProps {
  tutor: Tutor;
}

const TutorCard = ({ tutor }: TutorCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  // Generate star rating display
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      );
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <span key="half" className="relative">
          <Star className="h-4 w-4 text-yellow-400" />
          <Star className="absolute top-0 left-0 h-4 w-4 fill-yellow-400 text-yellow-400 overflow-hidden" style={{ clipPath: 'inset(0 50% 0 0)' }} />
        </span>
      );
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      );
    }
    
    return stars;
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="bg-gradient-to-r from-yellow-500 to-red-600 h-4"></div>
      <CardContent className="p-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-white shadow-md">
              <AvatarImage src={tutor.imageUrl} alt={tutor.name} />
              <AvatarFallback className="bg-usc-cardinal text-white text-xl">
                {getInitials(tutor.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-bold">{tutor.name}</h3>
              <div className="flex items-center mt-1">
                <GraduationCap className="h-4 w-4 text-gray-500 mr-1" />
                <p className="text-gray-600 text-sm">{tutor.field}</p>
              </div>
              <div className="flex items-center mt-1">
                <MapPin className="h-4 w-4 text-gray-500 mr-1" />
                <p className="text-gray-600 text-sm">USC Campus</p>
              </div>
              <div className="flex items-center mt-2">
                {renderStars(tutor.rating)}
                <span className="ml-2 text-sm font-medium">{tutor.rating.toFixed(1)}</span>
                <span className="text-sm text-gray-500 ml-1">({tutor.subjects.length} courses)</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="font-medium">Hourly Rate</span>
              <span className="font-bold text-usc-cardinal">${tutor.hourlyRate}/hr</span>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Available for:</h4>
              <div className="flex flex-wrap gap-2">
                {tutor.subjects.slice(0, 3).map((subject) => (
                  <Badge
                    key={subject.code}
                    variant="outline"
                    className="bg-red-50 hover:bg-red-100 text-usc-cardinal border-red-100"
                  >
                    {subject.code}
                  </Badge>
                ))}
                {tutor.subjects.length > 3 && (
                  <Badge variant="outline" className="bg-red-50 hover:bg-red-100 text-usc-cardinal border-red-100">
                    +{tutor.subjects.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              Available for in-person or online sessions
            </div>
          </div>
          
          <Button 
            className="w-full mt-2 bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
            asChild
          >
            <Link to={`/tutors/${tutor.id}`}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TutorCard;
