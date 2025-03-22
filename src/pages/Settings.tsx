
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { CoursesSettings } from "@/components/settings/CoursesSettings";
import { useIsMobile } from "@/hooks/use-mobile";

const Settings = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="py-4 md:py-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Settings</h1>
        <p className="text-sm md:text-base text-muted-foreground">Manage your account preferences and profile</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={`mb-6 md:mb-8 ${isMobile ? "w-full grid grid-cols-5 gap-1" : ""}`}>
          <TabsTrigger value="profile" className={isMobile ? "text-xs py-1 px-2" : ""}>Profile</TabsTrigger>
          <TabsTrigger value="account" className={isMobile ? "text-xs py-1 px-2" : ""}>Account</TabsTrigger>
          <TabsTrigger value="courses" className={isMobile ? "text-xs py-1 px-2" : ""}>Courses</TabsTrigger>
          <TabsTrigger value="notifications" className={isMobile ? "text-xs py-1 px-2" : ""}>Notif.</TabsTrigger>
          <TabsTrigger value="privacy" className={isMobile ? "text-xs py-1 px-2" : ""}>Privacy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>
        
        <TabsContent value="account">
          <AccountSettings />
        </TabsContent>
        
        <TabsContent value="courses">
          <CoursesSettings />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
        
        <TabsContent value="privacy">
          <PrivacySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
