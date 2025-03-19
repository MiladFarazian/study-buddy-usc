
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const PrivacySettings = () => {
  const { toast } = useToast();
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: true,
    onlineStatus: true,
    dataUsage: true
  });

  const handleToggleChange = (setting: keyof typeof privacySettings) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const savePreferences = () => {
    // In a real app, this would save to the database
    toast({
      title: "Privacy Settings Saved",
      description: "Your privacy settings have been updated"
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>
          Control your privacy and data sharing preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Profile Visibility</h3>
              <p className="text-sm text-muted-foreground">
                Make your profile visible to other USC students
              </p>
            </div>
            <Switch 
              checked={privacySettings.profileVisibility} 
              onCheckedChange={() => handleToggleChange('profileVisibility')} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Show Online Status</h3>
              <p className="text-sm text-muted-foreground">
                Display when you're active on the platform
              </p>
            </div>
            <Switch 
              checked={privacySettings.onlineStatus} 
              onCheckedChange={() => handleToggleChange('onlineStatus')} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Data Usage</h3>
              <p className="text-sm text-muted-foreground">
                Allow anonymous usage data to improve the platform
              </p>
            </div>
            <Switch 
              checked={privacySettings.dataUsage} 
              onCheckedChange={() => handleToggleChange('dataUsage')} 
            />
          </div>
        </div>
        
        <Button 
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
          onClick={savePreferences}
        >
          Save Privacy Settings
        </Button>
      </CardContent>
    </Card>
  );
};
