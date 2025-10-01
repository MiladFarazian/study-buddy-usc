import { Badge } from "@/components/ui/badge";
import { Subject } from "@/types/tutor";
import { MatchType } from "@/lib/instructor-matching-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check } from "lucide-react";

interface TutorSubjectsSectionProps {
  subjects: Subject[];
  matchByCourse?: Record<string, MatchType>;
}

export const TutorSubjectsSection = ({ subjects, matchByCourse = {} }: TutorSubjectsSectionProps) => {
  // Sort subjects to show exact matches first, then course matches, then the rest
  const sortedSubjects = [...subjects].sort((a, b) => {
    const aMatch = matchByCourse[a.code] || 'none';
    const bMatch = matchByCourse[b.code] || 'none';
    
    const matchOrder = { exact: 0, 'course-only': 1, none: 2 };
    return matchOrder[aMatch] - matchOrder[bMatch];
  });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Subjects</h2>
      <div className="flex flex-wrap gap-2">
        <TooltipProvider>
          {sortedSubjects.map((subject) => {
            const matchType = matchByCourse[subject.code] || 'none';
            const isExactMatch = matchType === 'exact';
            const isCourseMatch = matchType === 'course-only';
            const hasMatch = isExactMatch || isCourseMatch;
            
            const badge = (
              <Badge
                variant="secondary"
                className={`text-sm py-1.5 px-3 ${
                  isExactMatch 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600" 
                    : isCourseMatch
                    ? "bg-usc-cardinal hover:bg-usc-cardinal-dark text-white border-usc-cardinal"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {subject.code}
                {hasMatch && <Check className="w-4 h-4 ml-1.5 inline" />}
              </Badge>
            );

            if (!hasMatch) {
              return <div key={subject.code}>{badge}</div>;
            }

            return (
              <Tooltip key={subject.code}>
                <TooltipTrigger asChild>
                  {badge}
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isExactMatch ? "Matching course and instructor" : "Matching course"}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
};
