
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { CoursesSettings } from "@/components/settings/CoursesSettings";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { TutorSettingsTab } from "@/components/settings/TutorSettingsTab";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { PaymentSettingsTab } from "@/components/settings/PaymentSettingsTab";
import { TutorStudentCoursesSettings } from "@/components/settings/TutorStudentCoursesSettings";

export default function Settings() {
  // Redirect to login if not authenticated
  const { user, profile, loading, isTutor } = useAuthRedirect("/settings");
  
  const [activeTab, setActiveTab] = useState("profile");
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) return null; // Handled by useAuthRedirect

  return (
    <div className="px-4 md:px-6 py-4 md:py-8 mb-20">
      <div className="mx-auto max-w-6xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground mb-8">
            Manage your account settings and preferences.
          </p>
        </div>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full h-auto flex flex-wrap md:flex-nowrap overflow-auto">
            <TabsTrigger value="profile" className="flex-1 data-[state=active]:bg-usc-cardinal data-[state=active]:text-white">
              Profile
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex-1 data-[state=active]:bg-usc-cardinal data-[state=active]:text-white">
              Courses
            </TabsTrigger>
            {isTutor && (
              <TabsTrigger value="tutor-settings" className="flex-1 data-[state=active]:bg-usc-cardinal data-[state=active]:text-white">
                Tutor Settings
              </TabsTrigger>
            )}
            <TabsTrigger value="account" className="flex-1 data-[state=active]:bg-usc-cardinal data-[state=active]:text-white">
              Account
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 data-[state=active]:bg-usc-cardinal data-[state=active]:text-white">
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex-1 data-[state=active]:bg-usc-cardinal data-[state=active]:text-white">
              Privacy
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex-1 data-[state=active]:bg-usc-cardinal data-[state=active]:text-white">
              Payment
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4">
            <ProfileSettings />
          </TabsContent>
          
          <TabsContent value="courses" className="space-y-6">
            <CoursesSettings />
            {isTutor && (
              <>
                <Separator className="my-6" />
                <TutorStudentCoursesSettings />
              </>
            )}
          </TabsContent>
          
          {isTutor && (
            <TabsContent value="tutor-settings" className="space-y-4">
              <TutorSettingsTab />
            </TabsContent>
          )}
          
          <TabsContent value="account" className="space-y-4">
            <AccountSettings />
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4">
            <NotificationSettings />
          </TabsContent>
          
          <TabsContent value="privacy" className="space-y-4">
            <PrivacySettings />
          </TabsContent>
          
          <TabsContent value="payment" className="space-y-4">
            <PaymentSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
