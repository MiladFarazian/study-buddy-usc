
import { Badge } from "@/components/ui/badge";
import { Subject } from "@/types/tutor";

interface TutorSubjectsSectionProps {
  subjects: Subject[];
  highlightedCourses?: string[];
  mutualCourses?: string[];
}

export const TutorSubjectsSection = ({ 
  subjects, 
  highlightedCourses = [], 
  mutualCourses = [] 
}: TutorSubjectsSectionProps) => {
  // Sort subjects to show matching courses first (mutual courses prioritized)
  const sortedSubjects = [...subjects].sort((a, b) => {
    const aMutual = mutualCourses.includes(a.code);
    const bMutual = mutualCourses.includes(b.code);
    const aHighlighted = highlightedCourses.includes(a.code);
    const bHighlighted = highlightedCourses.includes(b.code);
    
    // Mutual courses first
    if (aMutual && !bMutual) return -1;
    if (!aMutual && bMutual) return 1;
    
    // Then highlighted courses
    if (aHighlighted && !bHighlighted) return -1;
    if (!aHighlighted && bHighlighted) return 1;
    
    return 0;
  });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Subjects</h2>
      <div className="flex flex-wrap gap-2">
        {sortedSubjects.map((subject) => {
          const isMutual = mutualCourses.includes(subject.code);
          const isHighlighted = highlightedCourses.includes(subject.code);
          return (
            <Badge
              key={subject.code}
              variant={isMutual || isHighlighted ? "default" : "secondary"}
              className={`${
                isMutual
                  ? "bg-green-600 text-white hover:bg-green-700 font-semibold"
                  : isHighlighted
                    ? "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark font-semibold"
                    : ""
              } text-sm py-1 px-3`}
            >
              {subject.code} - {subject.name}
              {(isMutual || isHighlighted) && <span className="ml-1.5">✓</span>}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};
