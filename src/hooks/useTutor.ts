
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tutor, Subject, Review } from "@/types/tutor";

export function useTutor(id: string) {
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutor = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch tutor profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .eq('role', 'tutor')
          .single();

        if (error) {
          throw error;
        }

        if (!profile) {
          setTutor(null);
          setLoading(false);
          return;
        }

        // Fetch tutor courses
        const { data: tutorCourses, error: coursesError } = await supabase
          .from('tutor_courses')
          .select('*')
          .eq('tutor_id', id);

        if (coursesError) {
          console.error("Error fetching tutor courses:", coursesError);
        }

        // Convert to subjects format
        const subjects: Subject[] = tutorCourses?.map(course => ({
          code: course.course_number,
          name: course.course_title || course.course_number
        })) || [];

        // If the profile has subjects array but no tutor_courses
        if ((!subjects || subjects.length === 0) && profile.subjects && profile.subjects.length > 0) {
          // Use subjects from profile
          profile.subjects.forEach(courseCode => {
            subjects.push({
              code: courseCode,
              name: courseCode
            });
          });
        }

        // Fetch reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            *,
            profiles!reviewer_id (
              first_name,
              last_name
            )
          `)
          .eq('tutor_id', id);

        if (reviewsError) {
          console.error("Error fetching reviews:", reviewsError);
        }

        const formattedReviews: Review[] = reviewsData?.map(review => ({
          id: review.id,
          reviewerId: review.reviewer_id,
          reviewerName: review.profiles ? 
            `${review.profiles.first_name || ''} ${review.profiles.last_name || ''}`.trim() : 
            undefined,
          tutorId: review.tutor_id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.created_at
        })) || [];

        // Create tutor object
        const tutorData: Tutor = {
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          field: profile.major || 'USC Student',
          rating: profile.average_rating || 4.5,
          hourlyRate: profile.hourly_rate || 25,
          subjects: subjects,
          imageUrl: profile.avatar_url || '',
          bio: profile.bio || '',
          graduationYear: profile.graduation_year || ''
        };

        setTutor(tutorData);
        setReviews(formattedReviews);
      } catch (error) {
        console.error("Error fetching tutor:", error);
        setTutor(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTutor();
  }, [id]);

  return { tutor, reviews, loading };
}
