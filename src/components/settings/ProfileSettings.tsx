import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ProfileAvatarCard } from "@/components/profile-editor/ProfileAvatarCard";
import { StudentProfileForm } from "@/components/profile-editor/StudentProfileForm";
import { TutorProfileForm } from "@/components/profile-editor/TutorProfileForm";
import { CoursesSettings } from "./CoursesSettings";
import { useTutorProfile } from "@/hooks/useTutorProfile";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, AlertCircle } from "lucide-react";

export const ProfileSettings = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Track current profile view with localStorage persistence
  const [profileView, setProfileView] = useState<'student' | 'tutor'>(() => {
    const saved = localStorage.getItem('profileView');
    if (saved === 'student' || saved === 'tutor') return saved;
    return 'student';
  });

  // Set initial view based on approval status
  useEffect(() => {
    if (profile) {
      const canViewTutor = profile.approved_tutor === true;
      const currentView = localStorage.getItem('profileView') as 'student' | 'tutor' || 'student';
      
      // If viewing tutor but not approved, switch to student
      if (currentView === 'tutor' && !canViewTutor) {
        setProfileView('student');
        localStorage.setItem('profileView', 'student');
      }
    }
  }, [profile?.approved_tutor]);
  
  const tutorProfileHook = useTutorProfile(profile);
  const studentProfileHook = useStudentProfile(profile);

  // Use the appropriate hook based on profile view
  const {
    loading,
    formData,
    avatarUrl,
    setAvatarUrl,
    uploadingAvatar,
    setUploadingAvatar,
    avatarFile,
    setAvatarFile,
    handleInputChange,
    handleProfileUpdate,
  } = profileView === 'tutor' ? tutorProfileHook : studentProfileHook;

  const handleRoleToggle = async (newView: 'student' | 'tutor') => {
    // Check if user can access tutor view
    if (newView === 'tutor' && !profile?.approved_tutor) {
      toast({
        title: "Access Denied",
        description: "You must be an approved tutor to access tutor settings",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`Switching to ${newView} view...`);
      
      // Just update localStorage for UI state
      setProfileView(newView);
      localStorage.setItem('profileView', newView);
      console.log(`Successfully switched to ${newView} view`);
    } catch (error) {
      console.error('Error switching view:', error);
      toast({
        title: "Error",
        description: `Failed to switch to ${newView} view`,
        variant: "destructive",
      });
    }
  };

  if (!user || !profile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center space-x-2 border rounded-full p-1">
          <Button
            variant={profileView === 'student' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleRoleToggle('student')}
            className="rounded-full"
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Student
          </Button>
          <Button
            variant={profileView === 'tutor' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleRoleToggle('tutor')}
            className="rounded-full"
            disabled={!profile?.approved_tutor}
            title={!profile?.approved_tutor ? 'You must be an approved tutor' : ''}
          >
            <Users className="w-4 h-4 mr-2" />
            Tutor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {profileView === 'tutor' ? (
            <TutorProfileForm
              formData={formData as any}
              handleInputChange={handleInputChange}
              loading={loading}
              uploadingAvatar={uploadingAvatar}
              handleProfileUpdate={handleProfileUpdate}
              userEmail={user.email}
              approvedTutor={profile.approved_tutor}
            />
          ) : (
            <StudentProfileForm
              formData={formData as any}
              handleInputChange={handleInputChange}
              loading={loading}
              uploadingAvatar={uploadingAvatar}
              handleProfileUpdate={handleProfileUpdate}
              userEmail={user.email}
            />
          )}
          
          {/* Course Settings Integration */}
          <CoursesSettings profileView={profileView} />
        </div>
        
        <div className="lg:col-span-1">
          <ProfileAvatarCard 
            avatarUrl={avatarUrl}
            setAvatarUrl={setAvatarUrl}
            setAvatarFile={setAvatarFile}
            avatarFile={avatarFile}
            loading={loading}
            uploadingAvatar={uploadingAvatar}
            firstName={formData.first_name}
            userEmail={user?.email}
            setUploadingAvatar={setUploadingAvatar}
          />
        </div>
      </div>

      {!profile?.approved_tutor && profileView === 'student' && (
        <Card className="mb-6 bg-accent/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Become a Tutor</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Want to help other students and earn money? Apply to become a tutor on our platform!
                </p>
                <Button
                  onClick={() => navigate('/onboarding/tutor')}
                  className="w-full sm:w-auto"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Apply to Become a Tutor
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
