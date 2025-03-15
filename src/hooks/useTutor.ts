
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tutor, Review } from "@/types/tutor";

export const useTutor = (tutorId: string | undefined) => {
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTutor = async () => {
      if (!tutorId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch the tutor profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", tutorId)
          .eq("role", "tutor")
          .single();

        if (profileError) {
          throw profileError;
        }

        if (!profileData) {
          throw new Error("Tutor not found");
        }

        // Map the database profile to our Tutor type
        const tutorData: Tutor = {
          id: profileData.id,
          name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
          firstName: profileData.first_name || '',
          lastName: profileData.last_name || '',
          field: profileData.major || '',
          rating: profileData.average_rating || 0,
          hourlyRate: profileData.hourly_rate || 0,
          subjects: (profileData.subjects || []).map((code: string) => ({
            code,
            name: code
          })),
          imageUrl: profileData.avatar_url || '',
          bio: profileData.bio || '',
          graduationYear: profileData.graduation_year || ''
        };

        setTutor(tutorData);

        // Fetch reviews for this tutor
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("reviews")
          .select(`
            *,
            reviewer:reviewer_id (
              first_name,
              last_name
            )
          `)
          .eq("tutor_id", tutorId)
          .order("created_at", { ascending: false });

        if (reviewsError) {
          throw reviewsError;
        }

        // Map the reviews data
        const mappedReviews: Review[] = reviewsData.map((review: any) => ({
          id: review.id,
          reviewerId: review.reviewer_id,
          reviewerName: review.reviewer ? 
            `${review.reviewer.first_name || ''} ${review.reviewer.last_name || ''}`.trim() : 
            'Anonymous Student',
          tutorId: review.tutor_id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.created_at
        }));

        setReviews(mappedReviews);
      } catch (err) {
        console.error("Error fetching tutor:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch tutor");
      } finally {
        setLoading(false);
      }
    };

    fetchTutor();
  }, [tutorId]);

  return { tutor, reviews, loading, error };
};
