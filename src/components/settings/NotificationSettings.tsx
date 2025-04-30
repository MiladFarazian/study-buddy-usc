
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { 
  NotificationPreferences, 
  getUserNotificationPreferences, 
  saveUserNotificationPreferences 
} from "@/lib/notification-utils";

export const NotificationSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [notificationSettings, setNotificationSettings] = useState<NotificationPreferences>({
    sessionReminders: true,
    newMessages: true,
    resourceUpdates: true,
    platformUpdates: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching notification preferences for user:", user.id);
        const prefs = await getUserNotificationPreferences(user.id);
        console.log("Fetched preferences:", prefs);
        setNotificationSettings(prefs);
      } catch (error) {
        console.error("Failed to fetch notification preferences:", error);
        toast({
          title: "Error",
          description: "Failed to load notification preferences",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [user, toast]);

  const handleToggleChange = (setting: keyof NotificationPreferences) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const savePreferences = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      console.log("Saving notification preferences:", notificationSettings);
      const { success, error } = await saveUserNotificationPreferences(
        user.id, 
        notificationSettings
      );
      
      if (!success) {
        throw new Error(error || "Failed to save preferences");
      }
      
      toast({
        title: "Preferences Saved",
        description: "Your notification preferences have been updated"
      });
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Loading your notification settings...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-usc-cardinal" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Manage how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Session Reminders</h3>
              <p className="text-sm text-muted-foreground">
                Receive notifications about upcoming sessions
              </p>
            </div>
            <Switch 
              checked={notificationSettings.sessionReminders} 
              onCheckedChange={() => handleToggleChange('sessionReminders')} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">New Messages</h3>
              <p className="text-sm text-muted-foreground">
                Get notified when you receive new messages
              </p>
            </div>
            <Switch 
              checked={notificationSettings.newMessages} 
              onCheckedChange={() => handleToggleChange('newMessages')} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Resource Updates</h3>
              <p className="text-sm text-muted-foreground">
                Notifications about new resources in your courses
              </p>
            </div>
            <Switch 
              checked={notificationSettings.resourceUpdates} 
              onCheckedChange={() => handleToggleChange('resourceUpdates')} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Platform Updates</h3>
              <p className="text-sm text-muted-foreground">
                Receive news and updates about Study Buddy
              </p>
            </div>
            <Switch 
              checked={notificationSettings.platformUpdates} 
              onCheckedChange={() => handleToggleChange('platformUpdates')} 
            />
          </div>
        </div>
        
        <Button 
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
          onClick={savePreferences}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
