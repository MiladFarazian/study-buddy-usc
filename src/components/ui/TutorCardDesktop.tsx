
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GraduationCap, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Tutor } from "@/types/tutor";
import StarRating from "./StarRating";

interface TutorCardDesktopProps {
  tutor: Tutor;
  getInitials: (name: string) => string;
}

const TutorCardDesktop = ({ tutor, getInitials }: TutorCardDesktopProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow w-full">
      <div className="bg-gradient-to-r from-yellow-500 to-red-600 h-4"></div>
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex items-start md:items-center gap-3 md:gap-4">
            <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-white shadow-md flex-shrink-0">
              <AvatarImage src={tutor.imageUrl} alt={tutor.name} />
              <AvatarFallback className="bg-usc-cardinal text-white text-lg md:text-xl">
                {getInitials(tutor.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg md:text-xl font-bold truncate">{tutor.name}</h3>
              <div className="flex items-center mt-1">
                <GraduationCap className="h-4 w-4 text-gray-500 mr-1 flex-shrink-0" />
                <p className="text-gray-600 text-sm truncate">{tutor.field}</p>
              </div>
              <div className="flex items-center mt-1">
                <MapPin className="h-4 w-4 text-gray-500 mr-1 flex-shrink-0" />
                <p className="text-gray-600 text-sm truncate">USC Campus</p>
              </div>
              <div className="flex items-center mt-2">
                <StarRating rating={tutor.rating} />
                <span className="text-sm text-gray-500 ml-1 hidden sm:inline">({tutor.subjects.length} courses)</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="font-medium text-sm">Hourly Rate</span>
              <span className="font-bold text-usc-cardinal">${tutor.hourlyRate}/hr</span>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 text-sm">Available for:</h4>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {tutor.subjects.slice(0, 3).map((subject) => (
                  <Badge
                    key={subject.code}
                    variant="outline"
                    className="bg-red-50 hover:bg-red-100 text-usc-cardinal border-red-100 text-xs md:text-sm"
                  >
                    {subject.code}
                  </Badge>
                ))}
                {tutor.subjects.length > 3 && (
                  <Badge variant="outline" className="bg-red-50 hover:bg-red-100 text-usc-cardinal border-red-100 text-xs md:text-sm">
                    +{tutor.subjects.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center text-xs md:text-sm text-gray-500">
              <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 flex-shrink-0" />
              <span className="truncate">Available for in-person or online sessions</span>
            </div>
          </div>
          
          <Button 
            className="w-full mt-1 bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
            asChild
          >
            <Link to={`/tutors/${tutor.id}`}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TutorCardDesktop;
