import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GraduationCap, MapPin, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { Tutor } from "@/types/tutor";
import StarRating from "./StarRating";
import { useTutorBadges } from "@/hooks/useTutorBadges";
import { getBadgeConfig } from "@/lib/badgeConfig";

interface TutorCardMobileProps {
  tutor: Tutor;
  getInitials: (name: string) => string;
  highlightedCourses?: string[];
}

const TutorCardMobile = ({ tutor, getInitials, highlightedCourses = [] }: TutorCardMobileProps) => {
  const { earnedBadges } = useTutorBadges(tutor.id);
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow w-full">
      <div className="bg-gradient-to-r from-yellow-500 to-red-600 h-2"></div>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14 border-2 border-white shadow-md flex-shrink-0">
              <AvatarImage src={tutor.imageUrl} alt={tutor.name} />
              <AvatarFallback className="bg-usc-cardinal text-white text-sm">
                {getInitials(tutor.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold truncate">{tutor.name}</h3>
              <div className="flex items-center mt-0.5">
                <GraduationCap className="h-3 w-3 text-gray-500 mr-1 flex-shrink-0" />
                <p className="text-gray-600 text-xs truncate">{tutor.field}</p>
              </div>
              <div className="flex items-center mt-0.5">
                <MapPin className="h-3 w-3 text-gray-500 mr-1 flex-shrink-0" />
                <p className="text-gray-600 text-xs truncate">USC Campus</p>
              </div>
              <div className="flex items-center justify-between mt-1">
                {tutor.rating > 0 && <StarRating rating={tutor.rating} />}
                {earnedBadges.length > 0 && (
                  <div className="flex items-center gap-1">
                    {earnedBadges.slice(0, 2).map(badge => {
                      const config = getBadgeConfig(badge.badge_type);
                      return (
                        <span key={badge.id} className="text-xs" title={config?.name}>
                          {config?.icon}
                        </span>
                      );
                    })}
                    {earnedBadges.length > 2 && (
                      <span className="text-xs text-gray-400">+{earnedBadges.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1 border-b">
              <span className="font-medium text-xs">Hourly Rate</span>
              <span className="font-bold text-usc-cardinal text-sm">
                ${tutor.hourlyRate}/hr
              </span>
            </div>
            
            <div>
              <h4 className="font-medium text-xs mb-1">Available for:</h4>
              <div className="flex flex-nowrap overflow-hidden gap-1">
                {tutor.subjects.slice(0, 2).map((subject) => {
                  const isHighlighted = highlightedCourses.includes(subject.code);
                  return (
                    <Badge
                      key={subject.code}
                      variant="outline"
                      className={`${
                        isHighlighted 
                          ? "bg-usc-cardinal text-white border-usc-cardinal font-semibold" 
                          : "bg-red-50 hover:bg-red-100 text-usc-cardinal border-red-100"
                      } text-xs py-0 h-5 flex-shrink-0`}
                    >
                      {subject.code}
                      {isHighlighted && <span className="ml-1">✓</span>}
                    </Badge>
                  );
                })}
                {tutor.subjects.length > 2 && (
                  <Badge 
                    variant="outline" 
                    className="bg-red-100/80 hover:bg-red-100 text-usc-cardinal border-red-100 text-xs py-0 h-5 flex-shrink-0"
                  >
                    +{tutor.subjects.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Button 
            className="w-full mt-2 bg-usc-cardinal hover:bg-usc-cardinal-dark text-white text-xs py-1 h-8"
            asChild
          >
            <Link to={`/tutors/${tutor.id}`}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TutorCardMobile;
