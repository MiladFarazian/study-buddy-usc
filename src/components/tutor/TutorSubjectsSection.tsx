
import { Badge } from "@/components/ui/badge";
import { Subject } from "@/types/tutor";

interface TutorSubjectsSectionProps {
  subjects: Subject[];
  highlightedCourses?: string[];
}

export const TutorSubjectsSection = ({ subjects, highlightedCourses = [] }: TutorSubjectsSectionProps) => {
  // Sort subjects to show matching courses first
  const sortedSubjects = [...subjects].sort((a, b) => {
    const aMatches = highlightedCourses.includes(a.code);
    const bMatches = highlightedCourses.includes(b.code);
    if (aMatches && !bMatches) return -1;
    if (!aMatches && bMatches) return 1;
    return 0;
  });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Subjects</h2>
      <div className="flex flex-wrap gap-2">
        {sortedSubjects.map((subject) => {
          const isHighlighted = highlightedCourses.includes(subject.code);
          return (
            <Badge
              key={subject.code}
              variant={isHighlighted ? "default" : "secondary"}
              className={`${
                isHighlighted
                  ? "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark font-semibold"
                  : ""
              } text-sm py-1 px-3`}
            >
              {subject.code} - {subject.name}
              {isHighlighted && <span className="ml-1.5">✓</span>}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};
