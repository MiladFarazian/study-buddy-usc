import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GraduationCap, MapPin, Calendar, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { Tutor } from "@/types/tutor";
import StarRating from "./StarRating";
import { useTutorBadges } from "@/hooks/useTutorBadges";
import { sortBadgesByRarity } from "@/lib/badgeConfig";
import { BadgeIcon } from "@/components/ui/BadgeIcon";
import { MatchBadge } from "@/components/ui/MatchBadge";
import { useTutorMatches } from "@/hooks/useTutorMatches";
import { MatchType } from "@/lib/instructor-matching-utils";

interface TutorCardDesktopProps {
  tutor: Tutor;
  getInitials: (name: string) => string;
  highlightedCourses?: string[];
}

const TutorCardDesktop = ({
  tutor,
  getInitials,
  highlightedCourses = []
}: TutorCardDesktopProps) => {
  const { earnedBadges } = useTutorBadges(tutor.id);
  const { getMatchForTutor } = useTutorMatches();
  
  // Determine the best match type for this tutor
  const matchResult = getMatchForTutor(tutor.id);
  const bestMatchType: MatchType = matchResult?.exactMatches.length 
    ? 'exact' 
    : matchResult?.courseOnlyMatches.length 
    ? 'course-only' 
    : 'none';
  
  // Sort subjects: exact matches first, then course-only matches, then others
  const sortedSubjects = [...tutor.subjects].sort((a, b) => {
    const aExactMatch = matchResult?.exactMatches.some(m => m.course_number === a.code);
    const bExactMatch = matchResult?.exactMatches.some(m => m.course_number === b.code);
    const aCourseMatch = matchResult?.courseOnlyMatches.some(m => m.course_number === a.code);
    const bCourseMatch = matchResult?.courseOnlyMatches.some(m => m.course_number === b.code);
    
    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;
    if (aCourseMatch && !bCourseMatch) return -1;
    if (!aCourseMatch && bCourseMatch) return 1;
    return 0;
  });
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow w-full min-w-[260px] max-w-[400px] mx-auto">
      <div className="bg-gradient-to-r from-yellow-500 to-red-600 h-4"></div>
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex items-start gap-3 md:gap-4">
            <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-white shadow-md flex-shrink-0">
              <AvatarImage src={tutor.imageUrl} alt={tutor.name} width={80} height={80} loading="lazy" decoding="async" />
              <AvatarFallback className="bg-usc-cardinal text-white text-lg md:text-xl">
                {getInitials(tutor.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg md:text-xl font-bold text-ellipsis overflow-hidden whitespace-nowrap">{tutor.name}</h3>
              </div>
              <div className="flex items-center mt-1">
                <GraduationCap className="h-4 w-4 text-gray-500 mr-1 flex-shrink-0" />
                <p className="text-gray-600 text-sm text-ellipsis overflow-hidden whitespace-nowrap">{tutor.field}</p>
              </div>
              <div className="flex items-center mt-1">
                <MapPin className="h-4 w-4 text-gray-500 mr-1 flex-shrink-0" />
                <p className="text-gray-600 text-sm text-ellipsis overflow-hidden whitespace-nowrap">USC Campus</p>
              </div>
              {tutor.rating > 0 && (
                <div className="flex items-center mt-2">
                  <StarRating rating={tutor.rating} />
                </div>
              )}
              <span className="text-sm text-gray-500 whitespace-nowrap mt-1">({sortedSubjects.length} courses)</span>
            </div>
          </div>
          
          {earnedBadges.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">Achievements</span>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                {sortBadgesByRarity(earnedBadges).slice(0, 5).map(badge => (
                  <BadgeIcon 
                    key={badge.id} 
                    badgeType={badge.badge_type}
                    size="sm"
                    showTooltip={true}
                  />
                ))}
                {earnedBadges.length > 5 && (
                  <span className="text-xs text-gray-500 font-medium ml-1 flex-shrink-0">
                    +{earnedBadges.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between py-1 md:py-2 border-b">
              <span className="font-medium text-sm whitespace-nowrap">Hourly Rate</span>
              <span className="font-bold text-usc-cardinal whitespace-nowrap">
                ${tutor.hourlyRate}/hr
              </span>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 text-sm">Available for:</h4>
              <div className="flex flex-nowrap overflow-hidden gap-2">
                {sortedSubjects.slice(0, 2).map(subject => {
                  const matchResult = getMatchForTutor(tutor.id);
                  const isExactMatch = matchResult?.exactMatches.some(m => m.course_number === subject.code);
                  const isCourseMatch = matchResult?.courseOnlyMatches.some(m => m.course_number === subject.code);
                  
                  return (
                    <Badge 
                      key={subject.code} 
                      variant="outline" 
                      className={`${
                        isExactMatch
                          ? "bg-emerald-600 text-white border-emerald-600 font-semibold hover:bg-emerald-700" 
                          : isCourseMatch
                          ? "bg-red-700 text-white border-red-700 font-semibold hover:bg-red-800"
                          : "bg-yellow-500 text-black border-yellow-500 hover:bg-yellow-600"
                      } text-xs md:text-sm whitespace-nowrap py-0 h-5 md:h-6 flex-shrink-0`}
                    >
                      {subject.code}
                      {(isExactMatch || isCourseMatch) && <span className="ml-1">✓</span>}
                    </Badge>
                  );
                })}
                {sortedSubjects.length > 2 && (
                  <Badge 
                    variant="outline" 
                    className="bg-red-100/80 hover:bg-red-100 text-usc-cardinal border-red-100 text-xs md:text-sm whitespace-nowrap py-0 h-5 md:h-6 flex-shrink-0"
                  >
                    +{sortedSubjects.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center text-xs md:text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1 md:mr-2 flex-shrink-0" />
              <span className="line-clamp-1">Available for in-person or online sessions</span>
            </div>
          </div>
          
          <Button className="w-full mt-1 bg-usc-cardinal hover:bg-usc-cardinal-dark text-white text-sm md:text-base" asChild>
            <Link to={`/tutors/${tutor.id}`}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TutorCardDesktop;
