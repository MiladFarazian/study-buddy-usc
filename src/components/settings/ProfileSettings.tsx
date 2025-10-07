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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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

    // Check if tutor onboarding is complete
    if (newView === 'tutor' && profile?.approved_tutor && !profile?.tutor_onboarding_complete) {
      navigate('/onboarding/tutor');
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
      {!profile?.approved_tutor && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Want to Become a Tutor?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Apply to join our tutor community and start helping USC students succeed!
                </p>
                <Button
                  onClick={() => window.open('https://usc.qualtrics.com/jfe/form/SV_7QU9OKorLMDmxNk', '_blank')}
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

          {/* Referral Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Referral Code
              </CardTitle>
              <CardDescription>
                Share your code with friends to unlock exclusive features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Your Code</p>
                    <p className="text-2xl font-bold font-mono tracking-wider">
                      {profile?.referral_code || "LOADING..."}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (profile?.referral_code) {
                        navigator.clipboard.writeText(profile.referral_code);
                        toast({ title: "Copied to clipboard!" });
                      }
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Successful Referrals</p>
                  <p className="text-sm text-muted-foreground">
                    Friends who joined with your code
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {profile?.referral_count || 0}
                </Badge>
              </div>
              
              {/* Unlock Progress */}
              <div className="space-y-3 pt-4 border-t">
                <p className="text-sm font-semibold">Unlock Features</p>
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  (profile?.referral_count || 0) >= 1 
                    ? "bg-green-50 border-green-200" 
                    : "bg-gray-50"
                )}>
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center",
                    (profile?.referral_count || 0) >= 1
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-gray-600"
                  )}>
                    {(profile?.referral_count || 0) >= 1 ? "✓" : "1"}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Analytics Page</p>
                    <p className="text-xs text-muted-foreground">
                      Track your study progress
                    </p>
                  </div>
                  {(profile?.referral_count || 0) >= 1 && (
                    <Badge variant="default" className="bg-green-500">
                      Unlocked
                    </Badge>
                  )}
                </div>
                
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  (profile?.referral_count || 0) >= 2 
                    ? "bg-green-50 border-green-200" 
                    : "bg-gray-50"
                )}>
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center",
                    (profile?.referral_count || 0) >= 2
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-gray-600"
                  )}>
                    {(profile?.referral_count || 0) >= 2 ? "✓" : "2"}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Resources Page</p>
                    <p className="text-xs text-muted-foreground">
                      Access study materials library
                    </p>
                  </div>
                  {(profile?.referral_count || 0) >= 2 && (
                    <Badge variant="default" className="bg-green-500">
                      Unlocked
                    </Badge>
                  )}
                </div>
                
                {/* Badges */}
                {(profile?.referral_count || 0) >= 5 && (
                  <div className="bg-purple-50 border-purple-200 p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🎉</span>
                      <p className="font-semibold text-purple-900">
                        Ambassador Badge Earned!
                      </p>
                    </div>
                  </div>
                )}
                
                {(profile?.referral_count || 0) >= 10 && (
                  <div className="bg-yellow-50 border-yellow-200 p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-yellow-600" />
                      <p className="font-semibold text-yellow-900">
                        Community Leader Badge Earned! 🏆
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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

    </div>
  );
};
