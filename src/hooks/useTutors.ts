
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tutor, Subject } from "@/types/tutor";
import { useToast } from "@/hooks/use-toast";

export function useTutors() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchTutors() {
      try {
        setLoading(true);
        
        // Fetch profiles with role = 'tutor'
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'tutor');
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Transform the data to match our Tutor interface
          const mappedTutors: Tutor[] = data.map(tutor => {
            // Map subjects array to Subject objects
            const subjects: Subject[] = (tutor.subjects || []).map((code: string) => ({
              code,
              name: getSubjectName(code)
            }));
            
            return {
              id: tutor.id,
              name: `${tutor.first_name || ''} ${tutor.last_name || ''}`.trim(),
              firstName: tutor.first_name || '',
              lastName: tutor.last_name || '',
              field: tutor.major || '',
              rating: tutor.average_rating || 4.5,
              hourlyRate: tutor.hourly_rate || 25,
              subjects: subjects,
              imageUrl: tutor.avatar_url || '', // No more random avatars
              bio: tutor.bio || '',
              graduationYear: tutor.graduation_year || ''
            };
          });
          
          setTutors(mappedTutors);
        }
      } catch (error) {
        console.error('Error fetching tutors:', error);
        toast({
          title: "Failed to load tutors",
          description: "Please try again later",
          variant: "destructive",
        });
        
        // Use fallback data if database query fails
        setTutors(getFallbackTutors());
      } finally {
        setLoading(false);
      }
    }
    
    fetchTutors();
  }, [toast]);
  
  return { tutors, loading };
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

// Fallback data if database query fails - no more random avatars
function getFallbackTutors(): Tutor[] {
  return [
    {
      id: "1",
      name: "Alex Johnson",
      firstName: "Alex",
      lastName: "Johnson",
      field: "Computer Science",
      rating: 4.9,
      hourlyRate: 25,
      subjects: [
        { code: "CSCI 103", name: "Introduction to Programming" },
        { code: "CSCI 104", name: "Data Structures and Object-Oriented Design" },
        { code: "CSCI 170", name: "Discrete Methods in Computer Science" }
      ],
      imageUrl: "", // Removed random avatar
      bio: "I specialize in making complex CS concepts easy to understand with practical examples."
    },
    {
      id: "2",
      name: "Sophia Martinez",
      firstName: "Sophia",
      lastName: "Martinez",
      field: "Biochemistry",
      rating: 4.8,
      hourlyRate: 30,
      subjects: [
        { code: "CHEM 105A", name: "General Chemistry" },
        { code: "CHEM 105B", name: "General Chemistry" },
        { code: "CHEM 300", name: "Analytical Chemistry" }
      ],
      imageUrl: "", // Removed random avatar
      bio: "Patient tutor with a passion for helping students reach their full potential in chemistry."
    }
  ];
}
