
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, DollarSign } from "lucide-react";
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
        <Star key={`full-${i}`} className="h-4 w-4 fill-usc-gold text-usc-gold" />
      );
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <span key="half" className="relative">
          <Star className="h-4 w-4 text-usc-gold" />
          <Star className="absolute top-0 left-0 h-4 w-4 fill-usc-gold text-usc-gold overflow-hidden" style={{ clipPath: 'inset(0 50% 0 0)' }} />
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
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={tutor.imageUrl} alt={tutor.name} />
              <AvatarFallback className="bg-usc-cardinal text-white">
                {getInitials(tutor.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{tutor.name}</h3>
              <p className="text-gray-500">{tutor.field}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Rating</p>
              <div className="flex items-center">
                <div className="flex mr-2">
                  {renderStars(tutor.rating)}
                </div>
                <span className="font-medium text-sm">{tutor.rating.toFixed(1)}</span>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Hourly Rate</p>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                <span className="font-medium">${tutor.hourlyRate}</span>
              </div>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 mb-2">Subjects:</p>
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
