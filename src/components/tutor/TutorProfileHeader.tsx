
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Star } from "lucide-react";
import { Tutor } from "@/types/tutor";

interface TutorProfileHeaderProps {
  tutor: Tutor;
  reviewsCount: number;
  getInitials: (name: string) => string;
}

export const TutorProfileHeader = ({ tutor, reviewsCount, getInitials }: TutorProfileHeaderProps) => {
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={tutor.imageUrl} alt={tutor.name} />
          <AvatarFallback className="bg-usc-cardinal text-white text-xl">
            {getInitials(tutor.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{tutor.name}</h1>
          <p className="text-xl text-muted-foreground">{tutor.field}</p>
          <div className="flex items-center mt-2">
            <Star className="h-5 w-5 fill-usc-gold text-usc-gold" />
            <span className="ml-1 font-medium">{tutor.rating.toFixed(1)}/5.0</span>
            <span className="ml-2 text-muted-foreground">({reviewsCount} reviews)</span>
          </div>
        </div>
      </div>
      <Separator className="my-6" />
    </div>
  );
};
