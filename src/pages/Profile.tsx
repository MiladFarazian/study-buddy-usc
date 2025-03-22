
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Loader2, X, AlertTriangle } from "lucide-react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { useProfilePage } from "@/hooks/useProfilePage";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { removeCourseFromProfile } from "@/lib/course-utils";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Profile = () => {
  // Redirect to login if not authenticated
  const { user, profile, loading, isProfileComplete } = useAuthRedirect("/profile", true);
  const { toast } = useToast();
  const [removingCourse, setRemovingCourse] = useState<string | null>(null);
  const location = useLocation();
  
  // Check if user was redirected here to complete their profile
  const requireProfileCompletion = location.state?.requireCompletion || !isProfileComplete;
  
  // Use our custom hook for profile state management
  const {
    firstName, lastName, major, gradYear, bio,
    avatarUrl, avatarFile, uploadingAvatar, isSubmitting,
    setFirstName, setLastName, setMajor, setGradYear, setBio,
    setAvatarUrl, setAvatarFile, setUploadingAvatar,
    removeAvatar, handleSubmit
  } = useProfilePage(profile, user);

  const handleRemoveCourse = async (courseNumber: string) => {
    if (!user) return;
    
    try {
      setRemovingCourse(courseNumber);
      await removeCourseFromProfile(user.id, courseNumber);
      toast({
        title: "Course removed",
        description: `${courseNumber} has been removed from your profile`,
      });
      
      // Force refresh auth context to update the profile
      if (profile) {
        profile.subjects = profile.subjects?.filter(subject => subject !== courseNumber) || [];
      }
    } catch (error) {
      console.error("Failed to remove course:", error);
      toast({
        title: "Failed to remove course",
        description: "An error occurred while removing the course",
        variant: "destructive",
      });
    } finally {
      setRemovingCourse(null);
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

  return (
    <div className="container py-8">
      <ProfileHeader title="Your Profile" />
      
      {requireProfileCompletion && (
        <Alert variant="default" className="mb-6 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-800">Profile Completion Required</AlertTitle>
          <AlertDescription className="text-amber-700">
            Please complete your profile details below to continue using all features of the application.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <ProfileAvatar 
            avatarUrl={avatarUrl}
            setAvatarUrl={setAvatarUrl}
            setAvatarFile={setAvatarFile}
            avatarFile={avatarFile}
            userEmail={user.email}
            firstName={firstName}
            lastName={lastName}
            isSubmitting={isSubmitting}
            uploadingAvatar={uploadingAvatar}
            setUploadingAvatar={setUploadingAvatar}
            removeAvatar={removeAvatar}
            userRole={profile?.role}
            profile={profile}
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
                          {removingCourse === course ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          <span className="sr-only">Remove</span>
                        </Button>
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You haven't added any courses yet. Browse the courses page to add courses to your profile.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <ProfileForm 
            firstName={firstName}
            lastName={lastName}
            major={major}
            gradYear={gradYear}
            bio={bio}
            isSubmitting={isSubmitting}
            uploadingAvatar={uploadingAvatar}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            onMajorChange={setMajor}
            onGradYearChange={setGradYear}
            onBioChange={setBio}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default Profile;
