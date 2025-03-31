
import React from 'react';
import { useNavigate } from "react-router-dom";
import { useTutors } from "@/hooks/useTutors";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function RecommendedTutors() {
  const navigate = useNavigate();
  const { tutors, loading } = useTutors();
  
  const handleTutorClick = (tutorId: string) => {
    navigate(`/tutor/${tutorId}`);
  };
  
  // Filter tutors with high ratings (4.0+)
  const recommendedTutors = tutors
    .filter(tutor => tutor.rating >= 4.0)
    .slice(0, 5); // Show top 5
  
  if (loading) {
    return (
      <div className="space-y-4 mt-8">
        <h2 className="text-2xl font-bold">Recommended Tutors</h2>
        {[1, 2].map(index => (
          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="ml-3">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    );
  }
  
  if (recommendedTutors.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-4 mt-8">
      <h2 className="text-2xl font-bold">Recommended Tutors</h2>
      
      {recommendedTutors.map(tutor => (
        <div 
          key={tutor.id} 
          className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
          onClick={() => handleTutorClick(tutor.id)}
        >
          <div className="flex items-center">
            <Avatar className="h-12 w-12">
              <AvatarImage src={tutor.avatar} alt={tutor.name} />
              <AvatarFallback>
                {tutor.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <h3 className="font-medium">{tutor.name}</h3>
              <div className="flex items-center">
                <span className="text-yellow-500">★</span>
                <span className="ml-1 text-sm">{tutor.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
          
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      ))}
    </div>
  );
}
