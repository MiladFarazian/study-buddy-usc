
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const NotificationSettings = () => {
  const { toast } = useToast();
  const [notificationSettings, setNotificationSettings] = useState({
    sessionReminders: true,
    newMessages: true,
    resourceUpdates: true,
    platformUpdates: false
  });

  const handleToggleChange = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const savePreferences = () => {
    // In a real app, this would save to the database
    toast({
      title: "Preferences Saved",
      description: "Your notification preferences have been updated"
    });
  };

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
        >
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
};
