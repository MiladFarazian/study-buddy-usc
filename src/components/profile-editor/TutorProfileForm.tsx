import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, DollarSign } from "lucide-react";

interface TutorProfileFormProps {
  formData: {
    first_name: string;
    last_name: string;
    major: string;
    graduation_year: string;
    tutor_bio: string;
    hourly_rate: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  loading: boolean;
  uploadingAvatar: boolean;
  handleProfileUpdate: () => Promise<void>;
  userEmail?: string;
  approvedTutor?: boolean;
}

export const TutorProfileForm = ({
  formData,
  handleInputChange,
  loading,
  uploadingAvatar,
  handleProfileUpdate,
  userEmail,
  approvedTutor,
}: TutorProfileFormProps) => {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Tutor Profile</CardTitle>
        <CardDescription>
          Update your tutoring profile and rates
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
          <Label>Tutor Status</Label>
          <div className="p-3 border rounded-md">
            {approvedTutor ? (
              <p className="text-sm font-medium text-primary">
                ✅ You are StudyBuddy approved! Let's get to tutoring!
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  You are not yet approved as a tutor.
                </p>
                <a 
                  href="https://usc.qualtrics.com/jfe/form/SV_7QU9OKorLMDmxNk" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-primary hover:text-primary/80 font-medium inline-block"
                >
                  Apply to be a StudyBuddy Tutor today!
                </a>
              </div>
            )}
          </div>
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
          <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <Input 
              id="hourly_rate" 
              name="hourly_rate" 
              value={formData.hourly_rate} 
              onChange={handleInputChange} 
              placeholder="25" 
              className="pl-10" 
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Set your hourly tutoring rate - this will be displayed on your profile
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tutor_bio">Bio</Label>
          <Textarea 
            id="tutor_bio" 
            name="tutor_bio"
            value={formData.tutor_bio} 
            onChange={handleInputChange} 
            placeholder="Tell students about your teaching experience and approach..."
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