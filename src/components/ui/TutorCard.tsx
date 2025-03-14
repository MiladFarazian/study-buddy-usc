
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

interface Subject {
  code: string;
  name: string;
}

interface Tutor {
  id: string;
  name: string;
  field: string;
  rating: number;
  hourlyRate: number;
  subjects: Subject[];
  imageUrl: string;
}

interface TutorCardProps {
  tutor: Tutor;
}

const TutorCard = ({ tutor }: TutorCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-usc-gold">
              <AvatarImage src={tutor.imageUrl} alt={tutor.name} />
              <AvatarFallback className="bg-usc-cardinal text-white">
                {getInitials(tutor.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{tutor.name}</h3>
              <p className="text-gray-500">{tutor.field}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 py-2">
            <div>
              <p className="text-sm text-gray-500">Rating:</p>
              <div className="flex items-center mt-1">
                <Star className="h-4 w-4 fill-usc-gold text-usc-gold" />
                <span className="ml-1 font-medium">{tutor.rating}/5.0</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Rate:</p>
              <p className="font-medium">${tutor.hourlyRate}/hour</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 mb-2">Subjects:</p>
            <div className="flex flex-wrap gap-2">
              {tutor.subjects.slice(0, 3).map((subject) => (
                <Badge
                  key={subject.code}
                  variant="outline"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800"
                >
                  {subject.code}
                </Badge>
              ))}
              {tutor.subjects.length > 3 && (
                <Badge variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-800">
                  +{tutor.subjects.length - 3} more
                </Badge>
              )}
            </div>
          </div>
          
          <Button className="w-full mt-2 bg-usc-cardinal hover:bg-usc-cardinal-dark">
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TutorCard;
