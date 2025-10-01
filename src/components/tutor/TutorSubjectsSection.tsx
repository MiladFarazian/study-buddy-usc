
import { Badge } from "@/components/ui/badge";
import { Subject } from "@/types/tutor";
import { MatchBadge } from "@/components/ui/MatchBadge";
import { MatchType } from "@/lib/instructor-matching-utils";

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
        {sortedSubjects.map((subject) => {
          const matchType = matchByCourse[subject.code] || 'none';
          return (
            <div key={subject.code} className="flex items-center gap-1.5">
              <Badge
                variant="secondary"
                className="text-sm py-1 px-3"
              >
                {subject.code} - {subject.name}
              </Badge>
              <MatchBadge matchType={matchType} size="sm" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
