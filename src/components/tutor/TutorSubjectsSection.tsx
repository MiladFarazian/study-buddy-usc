
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
            variant="outline"
            className="bg-red-50 hover:bg-red-100 text-usc-cardinal border-red-100 text-sm py-1 px-3"
          >
            {subject.code} - {subject.name}
          </Badge>
        ))}
      </div>
    </div>
  );
};
