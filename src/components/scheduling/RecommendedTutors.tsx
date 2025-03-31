
import React from 'react';
import { useTutors } from "@/hooks/useTutors";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function RecommendedTutors() {
  const { tutors, loading } = useTutors();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-usc-cardinal mr-2" />
          <span>Loading recommended tutors...</span>
        </CardContent>
      </Card>
    );
  }

  if (!tutors || tutors.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground">No tutors available at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <h2 className="text-xl font-bold mb-4 px-6 pt-6">Explore More Tutors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 p-6">
          {tutors.slice(0, 3).map((tutor) => {
            // Use imageUrl instead of avatarUrl
            const tutorImage = tutor.imageUrl || 'https://example.com/placeholder.jpg';
            return (
              <div key={tutor.id} className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={tutorImage} alt={tutor.name} />
                  <AvatarFallback>{tutor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{tutor.name}</h3>
                  <p className="text-sm text-muted-foreground">{tutor.field}</p>
                  <Link to={`/tutors/${tutor.id}`}>
                    <Button variant="secondary" size="sm">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
