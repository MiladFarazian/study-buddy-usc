
import { Separator } from "@/components/ui/separator";

interface TutorBioSectionProps {
  bio: string | undefined;
}

export const TutorBioSection = ({ bio }: TutorBioSectionProps) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">About Me</h2>
      <p className="text-muted-foreground">
        {bio || 
          "I'm passionate about helping students understand complex topics and achieve their academic goals. My teaching approach focuses on building a strong foundation and developing problem-solving skills."}
      </p>
      <Separator className="my-6" />
    </div>
  );
};
