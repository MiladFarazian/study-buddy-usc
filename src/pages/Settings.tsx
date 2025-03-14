
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type ProfileUpdateDto = Database['public']['Tables']['profiles']['Update'];
type UserRole = Database['public']['Enums']['user_role'];

const Settings = () => {
  const { user, profile, isStudent, isTutor } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    major: "",
    graduation_year: "",
    bio: "",
    role: "student" as UserRole,
    hourly_rate: "",
    subjects: [] as string[],
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        major: profile.major || "",
        graduation_year: profile.graduation_year || "",
        bio: profile.bio || "",
        role: profile.role,
        hourly_rate: profile.hourly_rate?.toString() || "",
        subjects: profile.subjects || [],
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = async (role: UserRole) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const updateData: ProfileUpdateDto = { role };
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: `Your role has been updated to ${role}`,
      });

      setFormData((prev) => ({
        ...prev,
        role,
      }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const updateData: ProfileUpdateDto = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        major: formData.major,
        graduation_year: formData.graduation_year,
        bio: formData.bio,
        updated_at: new Date().toISOString(),
      };
      
      if (formData.role === 'tutor' && formData.hourly_rate) {
        updateData.hourly_rate = parseFloat(formData.hourly_rate);
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and profile</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and how it appears on your profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input 
                      id="first_name" 
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="Your first name" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input 
                      id="last_name" 
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Your last name" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={user?.email || ""} 
                    placeholder="your.email@usc.edu" 
                    readOnly 
                  />
                  <p className="text-sm text-muted-foreground">
                    Your email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">User Role</Label>
                  <div className="flex items-center space-x-4">
                    <Button 
                      variant={isStudent ? "default" : "outline"}
                      onClick={() => handleRoleChange("student")}
                      disabled={loading || isStudent}
                      className={isStudent ? "bg-usc-cardinal hover:bg-usc-cardinal-dark" : ""}
                    >
                      Student
                    </Button>
                    <Button 
                      variant={isTutor ? "default" : "outline"}
                      onClick={() => handleRoleChange("tutor")}
                      disabled={loading || isTutor}
                      className={isTutor ? "bg-usc-cardinal hover:bg-usc-cardinal-dark" : ""}
                    >
                      Tutor
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose whether you want to find tutors or be a tutor
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="major">Major</Label>
                  <Input 
                    id="major" 
                    name="major"
                    value={formData.major}
                    onChange={handleInputChange}
                    placeholder="Computer Science" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="graduation_year">Graduation Year</Label>
                  <Input 
                    id="graduation_year" 
                    name="graduation_year"
                    value={formData.graduation_year}
                    onChange={handleInputChange}
                    placeholder="2026" 
                  />
                </div>
                
                {isTutor && (
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                    <Input 
                      id="hourly_rate" 
                      name="hourly_rate"
                      type="number"
                      value={formData.hourly_rate}
                      onChange={handleInputChange}
                      placeholder="25" 
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..." 
                  />
                </div>
                
                <Button 
                  className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
                  onClick={handleProfileUpdate}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>
                  Update your profile photo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile?.avatar_url || ""} alt="Profile" />
                    <AvatarFallback className="bg-usc-cardinal text-white text-xl">
                      {getInitials(formData.first_name || user?.email?.charAt(0) || "U")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline">Upload New Photo</Button>
                  <Button variant="outline" className="text-red-500 hover:text-red-600">
                    Remove Photo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Authentication Method</Label>
                <div className="flex items-center gap-2 p-3 border rounded-md">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                  </svg>
                  <div className="ml-2">
                    <p className="font-medium">Google</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Danger Zone</h3>
                <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
                  Deactivate Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
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
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">New Messages</h3>
                    <p className="text-sm text-muted-foreground">
                      Get notified when you receive new messages
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Resource Updates</h3>
                    <p className="text-sm text-muted-foreground">
                      Notifications about new resources in your courses
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Platform Updates</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive news and updates about Study Buddy
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
              
              <Button className="bg-usc-cardinal hover:bg-usc-cardinal-dark">
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy">
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
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Show Online Status</h3>
                    <p className="text-sm text-muted-foreground">
                      Display when you're active on the platform
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Data Usage</h3>
                    <p className="text-sm text-muted-foreground">
                      Allow anonymous usage data to improve the platform
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <Button className="bg-usc-cardinal hover:bg-usc-cardinal-dark">
                Save Privacy Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
