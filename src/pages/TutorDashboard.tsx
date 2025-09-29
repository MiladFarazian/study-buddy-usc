import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Loader2, X, LogOut } from "lucide-react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { TutorProfileForm } from "@/components/profile-editor/TutorProfileForm";
import { ProfileAvatarCard } from "@/components/profile-editor/ProfileAvatarCard";
import { useTutorProfile } from "@/hooks/useTutorProfile";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { removeCourseFromProfile } from "@/lib/course-utils";
import { useState } from "react";

const TutorDashboard = () => {
  const { user, profile, loading, signOut } = useAuthRedirect("/tutor-dashboard", true);
  const { updateProfile } = useAuth();
  const { toast } = useToast();
  const [removingCourse, setRemovingCourse] = useState<string | null>(null);

  const {
    loading: tutorLoading,
    setLoading,
    formData,
    setFormData,
    avatarUrl,
    setAvatarUrl,
    uploadingAvatar,
    setUploadingAvatar,
    avatarFile,
    setAvatarFile,
    handleInputChange,
    handleProfileUpdate,
  } = useTutorProfile(profile);

  const handleRemoveCourse = async (courseNumber: string) => {
    if (!user) return;

    try {
      setRemovingCourse(courseNumber);
      await removeCourseFromProfile(user.id, courseNumber);
      toast({ title: "Course removed", description: `${courseNumber} has been removed from your profile` });
      if (profile && updateProfile) {
        updateProfile({ ...profile, tutor_courses_subjects: (profile.tutor_courses_subjects || []).filter((s: string) => s !== courseNumber) });
      }
    } catch (error) {
      console.error("Failed to remove course:", error);
      toast({ title: "Failed to remove course", description: "An error occurred while removing the course", variant: "destructive" });
    } finally {
      setRemovingCourse(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
      toast({ title: "Sign Out Failed", description: "An error occurred while signing out", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="container py-8 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (!user) return null;

  // Redirect non-tutors
  if (profile?.role !== 'tutor') {
    window.location.href = '/profile';
    return null;
  }

  return (
    <div className="container py-8 pb-20">
      <ProfileHeader title="Tutor Dashboard" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <ProfileAvatarCard
            avatarUrl={avatarUrl}
            setAvatarUrl={setAvatarUrl}
            setAvatarFile={setAvatarFile}
            avatarFile={avatarFile}
            loading={tutorLoading}
            uploadingAvatar={uploadingAvatar}
            firstName={formData.first_name}
            userEmail={user.email}
            setUploadingAvatar={setUploadingAvatar}
          />

          {/* My Courses Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">My Courses</CardTitle>
            </CardHeader>
            <CardContent>
              {profile?.tutor_courses_subjects && profile.tutor_courses_subjects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.tutor_courses_subjects.map((course) => (
                    <div key={course} className="relative inline-flex">
                      <Badge variant="secondary" className="pr-8 py-2">
                        {course}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 absolute right-1 rounded-full"
                          onClick={() => handleRemoveCourse(course)}
                          disabled={removingCourse === course}
                        >
                          {removingCourse === course ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                          <span className="sr-only">Remove</span>
                        </Button>
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">You haven't added any courses yet. Browse the courses page to add courses to your profile.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <TutorProfileForm
            formData={formData as any}
            handleInputChange={handleInputChange}
            loading={tutorLoading}
            uploadingAvatar={uploadingAvatar}
            handleProfileUpdate={handleProfileUpdate}
            userEmail={user.email}
            approvedTutor={profile?.approved_tutor}
          />
        </div>
      </div>

      {/* Sign Out Button at the bottom of the page */}
      <div className="flex justify-center mt-12">
        <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default TutorDashboard;