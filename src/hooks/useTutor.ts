
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tutor, Subject, Review } from "@/types/tutor";
import { useToast } from "@/hooks/use-toast";

export function useTutor(tutorId: string) {
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchTutor() {
      if (!tutorId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch tutor profile
        const { data: tutorData, error: tutorError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', tutorId)
          .eq('role', 'tutor')
          .maybeSingle();
        
        if (tutorError) {
          throw tutorError;
        }
        
        if (tutorData) {
          // Map subjects array to Subject objects
          const subjects: Subject[] = (tutorData.subjects || []).map((code: string) => ({
            code,
            name: getSubjectName(code)
          }));
          
          setTutor({
            id: tutorData.id,
            name: `${tutorData.first_name || ''} ${tutorData.last_name || ''}`.trim(),
            firstName: tutorData.first_name || '',
            lastName: tutorData.last_name || '',
            field: tutorData.major || '',
            rating: tutorData.average_rating || 4.5,
            hourlyRate: tutorData.hourly_rate || 25,
            subjects: subjects,
            imageUrl: tutorData.avatar_url || getDefaultAvatar(),
            bio: tutorData.bio || '',
            graduationYear: tutorData.graduation_year || ''
          });
          
          // Fetch reviews for this tutor
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('reviews')
            .select('*, profiles:reviewer_id(first_name, last_name)')
            .eq('tutor_id', tutorId);
          
          if (reviewsError) {
            console.error('Error fetching reviews:', reviewsError);
          } else if (reviewsData) {
            const mappedReviews: Review[] = reviewsData.map(review => ({
              id: review.id,
              reviewerId: review.reviewer_id,
              reviewerName: review.profiles 
                ? `${review.profiles.first_name || ''} ${review.profiles.last_name || ''}`.trim() 
                : 'Anonymous',
              tutorId: review.tutor_id,
              rating: review.rating,
              comment: review.comment || '',
              createdAt: review.created_at
            }));
            
            setReviews(mappedReviews);
          }
        } else {
          toast({
            title: "Tutor not found",
            description: "The requested tutor profile could not be found",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching tutor:', error);
        toast({
          title: "Failed to load tutor profile",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchTutor();
  }, [tutorId, toast]);
  
  return { tutor, reviews, loading };
}

// Helper function to get a subject name from its code
function getSubjectName(code: string): string {
  // Simple mapping for common subjects
  const subjectMap: Record<string, string> = {
    'CSCI 103': 'Introduction to Programming',
    'CSCI 104': 'Data Structures and Object-Oriented Design',
    'CSCI 170': 'Discrete Methods in Computer Science',
    'MATH 125': 'Calculus I',
    'MATH 126': 'Calculus II',
    'PHYS 151': 'Fundamentals of Physics I',
    // Add more mappings as needed
  };
  
  return subjectMap[code] || code;
}

// Generate a default avatar URL if none is provided
function getDefaultAvatar(): string {
  const index = Math.floor(Math.random() * 10) + 1;
  const gender = Math.random() > 0.5 ? 'men' : 'women';
  return `https://randomuser.me/api/portraits/${gender}/${index}.jpg`;
}
