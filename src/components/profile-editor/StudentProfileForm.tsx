import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface StudentProfileFormProps {
  formData: {
    first_name: string;
    last_name: string;
    major: string;
    graduation_year: string;
    student_bio: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  loading: boolean;
  uploadingAvatar: boolean;
  handleProfileUpdate: () => Promise<void>;
  userEmail?: string;
}

export const StudentProfileForm = ({
  formData,
  handleInputChange,
  loading,
  uploadingAvatar,
  handleProfileUpdate,
  userEmail,
}: StudentProfileFormProps) => {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Student Profile</CardTitle>
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
            value={userEmail || ""} 
            placeholder="your.email@usc.edu" 
            readOnly 
          />
          <p className="text-sm text-muted-foreground">
            Your email cannot be changed
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
        
        <div className="space-y-2">
          <Label htmlFor="student_bio">Bio</Label>
          <Textarea 
            id="student_bio" 
            name="student_bio"
            value={formData.student_bio} 
            onChange={handleInputChange} 
            placeholder="Tell others about your learning style and what subjects you need help with..."
          />
        </div>
        
        <Button 
          className="bg-primary hover:bg-primary/90" 
          onClick={handleProfileUpdate} 
          disabled={loading || uploadingAvatar}
        >
          {loading || uploadingAvatar ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};