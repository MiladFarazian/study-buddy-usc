import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Loader2, X, AlertTriangle, LogOut } from "lucide-react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileEditorForm } from "@/components/profile-editor/ProfileEditorForm";
import { ProfileAvatarCard } from "@/components/profile-editor/ProfileAvatarCard";
import { useProfileEditor } from "@/hooks/useProfileEditor";
import { updateUserProfile, updateUserRole } from "@/components/settings/profileSettingsUtils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { removeCourseFromProfile } from "@/lib/course-utils";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Profile = () => {
  const { user, profile, loading, isProfileComplete, signOut } = useAuthRedirect("/profile", true);
  const { updateProfile } = useAuth();
  const { toast } = useToast();
  const [removingCourse, setRemovingCourse] = useState<string | null>(null);
  const location = useLocation();

  // Only show completion alert if profile is actually incomplete
  const shouldShowCompletionAlert = !isProfileComplete;

  // Unified profile editor state (shared with Settings)
  const {
    loading: settingsLoading,
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
  } = useProfileEditor(profile);

  const handleRemoveCourse = async (courseNumber: string) => {
    if (!user) return;

    try {
      setRemovingCourse(courseNumber);
      await removeCourseFromProfile(user.id, courseNumber);
      toast({ title: "Course removed", description: `${courseNumber} has been removed from your profile` });
      if (profile && updateProfile) {
        updateProfile({ ...profile, subjects: (profile.subjects || []).filter((s: string) => s !== courseNumber) });
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
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (!user) return null; // will be redirected by useAuthRedirect

  // Handlers aligned with Settings page to keep behavior identical
  const handleRoleChange = async (role: "student" | "tutor") => {
    if (!user) return;

    if (role === "tutor" && !profile?.approved_tutor) {
      toast({ title: "Not Approved", description: "You must be approved as a tutor before selecting this role.", variant: "destructive" });
      return;
    }

    const { error } = await updateUserRole(user, role as any, setLoading);
    if (error) {
      toast({ title: "Error", description: error || "Failed to update role", variant: "destructive" });
      return;
    }

    toast({ title: "Profile Updated", description: `Your role has been updated to ${role}` });
    setFormData((prev: any) => ({ ...prev, role }));
    if (updateProfile && profile) updateProfile({ ...profile, role });
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    const { data, error } = await updateUserProfile(
      user,
      profile,
      formData,
      avatarFile,
      profile?.avatar_url,
      setLoading,
      setUploadingAvatar
    );

    if (error) {
      toast({ title: "Error", description: error || "Failed to update profile", variant: "destructive" });
      return;
    }

    if (updateProfile && data) updateProfile(data);
    setAvatarFile(null);
    toast({ title: "Profile Updated", description: "Your profile has been successfully updated" });
  };

  return (
    <div className="container py-8 pb-20">
      <ProfileHeader title="Your Profile" />

      {shouldShowCompletionAlert && (
        <Alert variant="default" className="mb-6 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-800">Profile Completion Required</AlertTitle>
          <AlertDescription className="text-amber-700">Please complete your profile details below to continue using all features of the application.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <ProfileAvatarCard
            avatarUrl={avatarUrl}
            setAvatarUrl={setAvatarUrl}
            setAvatarFile={setAvatarFile}
            avatarFile={avatarFile}
            loading={settingsLoading}
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
              {profile?.subjects && profile.subjects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.subjects.map((course) => (
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
          <ProfileEditorForm
            formData={formData as any}
            handleInputChange={handleInputChange}
            isStudent={profile?.role === "student"}
            isTutor={profile?.role === "tutor"}
            loading={settingsLoading}
            uploadingAvatar={uploadingAvatar}
            handleRoleChange={handleRoleChange as any}
            handleProfileUpdate={handleProfileUpdate}
            userEmail={user.email}
            approvedTutor={profile?.approved_tutor}
          />
        </div>
      </div>

      {/* Sign Out Button at the bottom of the page */}
      <div className="flex justify-center mt-12">
        <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Profile;
