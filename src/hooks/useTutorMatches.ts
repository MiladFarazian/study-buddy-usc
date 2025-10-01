import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MatchResult, findMatchingTutorsWithInstructor } from "@/lib/instructor-matching-utils";

/**
 * Hook to get tutor match results for the current user
 */
export function useTutorMatches() {
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchMatches() {
      if (!user?.id) {
        setMatchResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const results = await findMatchingTutorsWithInstructor(user.id);
        setMatchResults(results);
      } catch (error) {
        console.error("Error fetching tutor matches:", error);
        setMatchResults([]);
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, [user?.id]);

  const getMatchForTutor = (tutorId: string): MatchResult | undefined => {
    return matchResults.find(m => m.tutorId === tutorId);
  };

  return { matchResults, loading, getMatchForTutor };
}
