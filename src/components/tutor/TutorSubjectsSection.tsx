
import { Badge } from "@/components/ui/badge";
import { Subject } from "@/types/tutor";

interface TutorSubjectsSectionProps {
  subjects: Subject[];
}

export const TutorSubjectsSection = ({ subjects }: TutorSubjectsSectionProps) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Subjects</h2>
      <div className="flex flex-wrap gap-2">
        {subjects.map((subject) => (
          <Badge
            key={subject.code}
            variant="secondary"
            className="text-sm py-1 px-3 hover:bg-secondary"
          >
            {subject.code} - {subject.name}
          </Badge>
        ))}
      </div>
    </div>
  );
};
