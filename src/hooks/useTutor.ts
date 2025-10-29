
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tutor, Subject, Review } from "@/types/tutor";

export function useTutor(id: string) {
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    if (!id) return;
    
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviewer_id (
            first_name,
            last_name
          )
        `)
        .eq('tutor_id', id)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error("Error fetching reviews:", reviewsError);
        return;
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

      setReviews(formattedReviews);
    } catch (error) {
      console.error("Error in fetchReviews:", error);
    }
  }, [id]);

  const fetchTutor = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch tutor from tutors table (enforces profile_visibility RLS)
      const { data: tutorData, error } = await supabase
        .from('tutors')
        .select(`
          *,
          profiles:profile_id (
            id,
            first_name,
            last_name,
            email,
            avatar_url,
            major,
            graduation_year,
            bio,
            average_rating,
            available_in_person,
            available_online
          )
        `)
        .eq('profile_id', id)
        .eq('approved_tutor', true)
        .single();

      if (error) {
        throw error;
      }

      if (!tutorData || !tutorData.profiles) {
        setTutor(null);
        setLoading(false);
        return;
      }

      const profile = tutorData.profiles;

      // Fetch tutor courses
      const { data: tutorCourses, error: coursesError } = await supabase
        .from('tutor_courses')
        .select('*')
        .eq('tutor_id', id);

      if (coursesError) {
        console.error("Error fetching tutor courses:", coursesError);
      }

      // Convert to subjects format with instructor information
      const subjects: Subject[] = tutorCourses?.map(course => ({
        code: course.course_number,
        name: course.course_title || course.course_number,
        instructor: course.instructor || undefined
      })) || [];

      // If tutorData has subjects array but no tutor_courses
      if ((!subjects || subjects.length === 0) && tutorData.subjects && tutorData.subjects.length > 0) {
        // Use subjects from tutorData
        tutorData.subjects.forEach(courseCode => {
          subjects.push({
            code: courseCode,
            name: courseCode
          });
        });
      }

      // Create tutor object with data from both tutors and profiles tables
      const formattedTutor: Tutor = {
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        field: profile.major || 'USC Student',
        rating: profile.average_rating || 4.5,
        hourlyRate: tutorData.hourly_rate || 25,
        subjects: subjects,
        imageUrl: profile.avatar_url || '',
        bio: profile.bio || '',
        graduationYear: profile.graduation_year || '',
        available_in_person: profile.available_in_person ?? true,
        available_online: profile.available_online ?? true
      };

      setTutor(formattedTutor);
      
      // Fetch reviews after setting tutor
      await fetchReviews();
    } catch (error) {
      console.error("Error fetching tutor:", error);
      setTutor(null);
    } finally {
      setLoading(false);
    }
  }, [id, fetchReviews]);

  const refreshReviews = useCallback(async () => {
    await fetchReviews();
    // Refresh tutor data to get updated average rating
    await fetchTutor();
  }, [fetchReviews, fetchTutor]);

  useEffect(() => {
    fetchTutor();
  }, [fetchTutor]);

  return { tutor, reviews, loading, refreshReviews };
}
