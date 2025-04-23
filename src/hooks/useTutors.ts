
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tutor, Subject } from "@/types/tutor";

export function useTutors() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutors = async () => {
      setLoading(true);
      try {
        // Fetch tutors - no authentication required, these are public profiles
        const { data: tutorProfiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'tutor')
          .order('average_rating', { ascending: false }); // Order by rating so best tutors show first

        if (error) {
          console.error("Error fetching tutor profiles:", error);
          setTutors([]);
          setLoading(false);
          return;
        }

        // If no tutors found, just set empty array
        if (!tutorProfiles || tutorProfiles.length === 0) {
          console.log("No tutor profiles found");
          setTutors([]);
          setLoading(false);
          return;
        }

        console.log("Tutors found:", tutorProfiles.length);

        // Process tutor profiles to create tutor objects
        const processedTutors = tutorProfiles.map(profile => {
          // Get subjects from profile if available
          const subjects: Subject[] = profile.subjects && Array.isArray(profile.subjects) && profile.subjects.length > 0 
            ? profile.subjects.map((courseCode: string) => ({
                code: courseCode,
                name: courseCode
              }))
            : [];

          // Create tutor object from real data
          return {
            id: profile.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'USC Tutor',
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            field: profile.major || 'USC Student',
            rating: profile.average_rating || 0,
            hourlyRate: profile.hourly_rate || 0,
            subjects: subjects,
            imageUrl: profile.avatar_url || '',
            bio: profile.bio || '',
            graduationYear: profile.graduation_year || ''
          };
        });

        setTutors(processedTutors);

      } catch (error) {
        console.error("Error fetching tutors:", error);
        setTutors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, []);

  return { tutors, loading };
}
