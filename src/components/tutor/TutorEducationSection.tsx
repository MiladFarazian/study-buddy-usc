
import { Separator } from "@/components/ui/separator";

interface TutorEducationSectionProps {
  field: string;
  graduationYear?: string;
}

export const TutorEducationSection = ({ field, graduationYear }: TutorEducationSectionProps) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Education</h2>
      <p className="font-medium">University of Southern California</p>
      <p className="text-muted-foreground">
        {field} {graduationYear ? `(Class of ${graduationYear})` : ""}
      </p>
      <Separator className="my-6" />
    </div>
  );
};
