import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, MessageSquare, Star } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface TutorSessionData {
  tutor_id: string;
  tutor_first_name: string;
  tutor_last_name: string;
  avatar_url: string | null;
  session_count: number;
  last_session_date: string;
  tutor_bio: string | null;
  average_rating: number | null;
  subjects: string[] | null;
}

const MyTutors = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [tutors, setTutors] = useState<TutorSessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyTutors = async () => {
      if (!user) return;

      try {
        // Get all sessions for this student
        const { data: sessions, error: sessionsError } = await supabase
          .from("sessions")
          .select("tutor_id, start_time")
          .eq("student_id", user.id)
          .in("status", ["completed", "scheduled"]);

        if (sessionsError) throw sessionsError;

        // Group by tutor and count sessions
        const tutorMap = new Map<string, { count: number; lastSession: string }>();
        sessions?.forEach((session) => {
          const existing = tutorMap.get(session.tutor_id);
          if (existing) {
            existing.count += 1;
            if (new Date(session.start_time) > new Date(existing.lastSession)) {
              existing.lastSession = session.start_time;
            }
          } else {
            tutorMap.set(session.tutor_id, {
              count: 1,
              lastSession: session.start_time,
            });
          }
        });

        // Fetch tutor profiles
        const tutorIds = Array.from(tutorMap.keys());
        if (tutorIds.length === 0) {
          setTutors([]);
          setLoading(false);
          return;
        }

        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url, tutor_bio, average_rating, subjects")
          .in("id", tutorIds);

        if (profilesError) throw profilesError;

        // Combine data
        const tutorData: TutorSessionData[] =
          profiles?.map((profile) => {
            const sessionData = tutorMap.get(profile.id)!;
            return {
              tutor_id: profile.id,
              tutor_first_name: profile.first_name || "Unknown",
              tutor_last_name: profile.last_name || "",
              avatar_url: profile.avatar_url,
              session_count: sessionData.count,
              last_session_date: sessionData.lastSession,
              tutor_bio: profile.tutor_bio,
              average_rating: profile.average_rating,
              subjects: profile.subjects,
            };
          }) || [];

        // Sort by session count (most sessions first)
        tutorData.sort((a, b) => b.session_count - a.session_count);
        setTutors(tutorData);
      } catch (error) {
        console.error("Error fetching tutors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTutors();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-usc-cardinal mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your tutors...</p>
        </div>
      </div>
    );
  }

  if (tutors.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Tutors</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                You haven't had any tutoring sessions yet.
              </p>
              <Button asChild>
                <Link to="/tutors">Find a Tutor</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Tutors</h1>
      <p className="text-muted-foreground mb-6">
        Tutors you've worked with ({tutors.length})
      </p>

      <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
        {tutors.map((tutor) => (
          <Card key={tutor.tutor_id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={tutor.avatar_url || undefined} />
                  <AvatarFallback>
                    {tutor.tutor_first_name[0]}
                    {tutor.tutor_last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">
                    {tutor.tutor_first_name} {tutor.tutor_last_name}
                  </CardTitle>
                  {tutor.average_rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {tutor.average_rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {tutor.tutor_bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {tutor.tutor_bio}
                </p>
              )}

              {tutor.subjects && tutor.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tutor.subjects.slice(0, 3).map((subject, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 px-2 py-1 rounded"
                    >
                      {subject}
                    </span>
                  ))}
                  {tutor.subjects.length > 3 && (
                    <span className="text-xs text-muted-foreground px-2 py-1">
                      +{tutor.subjects.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{tutor.session_count} session{tutor.session_count !== 1 ? "s" : ""}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to={`/tutors/${tutor.tutor_id}`}>View Profile</Link>
                </Button>
                <Button asChild variant="default" size="sm" className="flex-1">
                  <Link to="/messages">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyTutors;
