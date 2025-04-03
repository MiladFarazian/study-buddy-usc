
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { CoursesSettings } from "@/components/settings/CoursesSettings";
import { TutorSettingsTab } from "@/components/settings/TutorSettingsTab";
import { PaymentSettingsTab } from "@/components/settings/PaymentSettingsTab";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const Settings = () => {
  const isMobile = useIsMobile();
  const { isTutor, isStudent, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Check for tab parameter and set default tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (!tabParam && searchParams.has('stripe')) {
      // If coming from stripe redirect but no tab specified, set to payments
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('tab', 'payments');
        return newParams;
      });
    }
  }, [searchParams, setSearchParams]);
  
  // Get the default tab, considering URL parameters
  const getDefaultTab = () => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'account', 'courses', 'tutor', 'payments', 'notifications', 'privacy'].includes(tabParam)) {
      return tabParam;
    }
    return 'profile';
  };
  
  return (
    <div className="py-4 md:py-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Settings</h1>
        <p className="text-sm md:text-base text-muted-foreground">Manage your account preferences and profile</p>
      </div>

      <Tabs defaultValue={getDefaultTab()} className="w-full">
        <TabsList className={`mb-6 md:mb-8 ${isMobile ? "w-full grid grid-cols-7 gap-1" : ""}`}>
          <TabsTrigger value="profile" className={isMobile ? "text-xs py-1 px-2" : ""}>Profile</TabsTrigger>
          <TabsTrigger value="account" className={isMobile ? "text-xs py-1 px-2" : ""}>Account</TabsTrigger>
          <TabsTrigger value="courses" className={isMobile ? "text-xs py-1 px-2" : ""}>Courses</TabsTrigger>
          {isTutor && (
            <TabsTrigger value="tutor" className={isMobile ? "text-xs py-1 px-2" : ""}>Tutor</TabsTrigger>
          )}
          {user && (
            <TabsTrigger value="payments" className={isMobile ? "text-xs py-1 px-2" : ""}>Payments</TabsTrigger>
          )}
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
        
        {isTutor && (
          <TabsContent value="tutor">
            <TutorSettingsTab />
          </TabsContent>
        )}
        
        {user && (
          <TabsContent value="payments">
            <PaymentSettingsTab />
          </TabsContent>
        )}
        
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
