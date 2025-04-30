
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { PaymentSettingsTab } from "@/components/settings/PaymentSettingsTab";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { TutorSettingsTab } from "@/components/settings/TutorSettingsTab";
import { CoursesSettings } from "@/components/settings/CoursesSettings";
import { TutorStudentCoursesSettings } from "@/components/settings/TutorStudentCoursesSettings";

const Settings = () => {
  const { loading, profile, isTutor } = useAuthRedirect('/settings', true);
  const [activeTab, setActiveTab] = useState("profile");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6 md:py-10">
      <div className="space-y-0.5 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="flex flex-wrap h-auto py-2 gap-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          {isTutor && (
            <TabsTrigger value="student-courses">Courses I Need Help With</TabsTrigger>
          )}
          {isTutor && (
            <TabsTrigger value="tutor-settings">Tutor Settings</TabsTrigger>
          )}
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <ProfileSettings />
        </TabsContent>
        
        <TabsContent value="account" className="space-y-6">
          <AccountSettings />
        </TabsContent>
        
        <TabsContent value="courses" className="space-y-6">
          <CoursesSettings />
        </TabsContent>

        {isTutor && (
          <TabsContent value="student-courses" className="space-y-6">
            <TutorStudentCoursesSettings />
          </TabsContent>
        )}
        
        {isTutor && (
          <TabsContent value="tutor-settings" className="space-y-6">
            <TutorSettingsTab />
          </TabsContent>
        )}
        
        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
        </TabsContent>
        
        <TabsContent value="payment" className="space-y-6">
          <PaymentSettingsTab />
        </TabsContent>
        
        <TabsContent value="privacy" className="space-y-6">
          <PrivacySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
