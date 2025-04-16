
import React from "react";
import { Tutor } from "@/types/tutor";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface TutorCardMobileProps {
  tutor: Tutor;
  getInitials: (name: string) => string;
}

const TutorCardMobile = ({ tutor, getInitials }: TutorCardMobileProps) => {
  return (
    <Card className="overflow-hidden h-full">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={tutor.imageUrl} alt={tutor.name} />
            <AvatarFallback>{getInitials(tutor.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{tutor.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{tutor.field}</p>
          </div>
        </div>

        <div className="flex items-center mt-3">
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(tutor.rating) ? "text-yellow-500" : "text-gray-300"
                } fill-current`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                  clipRule="evenodd"
                />
              </svg>
            ))}
            <span className="ml-1 text-sm">{tutor.rating.toFixed(1)}</span>
          </div>
          <p className="ml-auto text-sm">${tutor.hourlyRate?.toFixed(2)}/hr</p>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {tutor.subjects.slice(0, 2).map((subject) => (
            <Badge variant="secondary" key={subject.code} className="text-xs">
              {subject.code}
            </Badge>
          ))}
          {tutor.subjects.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{tutor.subjects.length - 2} more
            </Badge>
          )}
        </div>

        <div className="mt-3 flex justify-end">
          <Button asChild size="sm" className="w-full">
            <Link to={`/tutors/${tutor.id}`}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TutorCardMobile;
