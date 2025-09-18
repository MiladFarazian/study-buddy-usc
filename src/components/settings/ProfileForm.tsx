import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, DollarSign } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { Profile } from "@/integrations/supabase/types-extension";
type UserRole = Database['public']['Enums']['user_role'];
interface ProfileFormProps {
  formData: {
    first_name: string;
    last_name: string;
    major: string;
    graduation_year: string;
    student_bio: string;
    tutor_bio: string;
    hourly_rate: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isStudent: boolean;
  isTutor: boolean;
  loading: boolean;
  uploadingAvatar: boolean;
  handleRoleChange: (role: UserRole) => Promise<void>;
  handleProfileUpdate: () => Promise<void>;
  userEmail?: string;
  approvedTutor?: boolean;
}
export const ProfileForm = ({
  formData,
  handleInputChange,
  isStudent,
  isTutor,
  loading,
  uploadingAvatar,
  handleRoleChange,
  handleProfileUpdate,
  userEmail,
  approvedTutor
}: ProfileFormProps) => {
  return <Card className="lg:col-span-2">
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
            <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleInputChange} placeholder="Your first name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleInputChange} placeholder="Your last name" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" value={userEmail || ""} placeholder="your.email@usc.edu" readOnly />
          <p className="text-sm text-muted-foreground">
            Your email cannot be changed
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">User Role</Label>
          <div className="flex items-center space-x-4">
            <Button variant={isStudent ? "default" : "outline"} onClick={() => handleRoleChange("student")} disabled={loading || isStudent} className={isStudent ? "bg-usc-cardinal hover:bg-usc-cardinal-dark" : ""}>
              Student
            </Button>
            <Button variant={isTutor ? "default" : "outline"} onClick={() => handleRoleChange("tutor")} disabled={loading || isTutor || !approvedTutor} className={isTutor ? "bg-usc-cardinal hover:bg-usc-cardinal-dark" : ""}>
              Tutor
            </Button>
          </div>
          {approvedTutor ? <p className="text-sm font-medium mt-2 text-usc-cardinal">
              You are StudyBuddy approved! Let's get to tutoring!
            </p> : <a href="https://usc.qualtrics.com/jfe/form/SV_7QU9OKorLMDmxNk" target="_blank" rel="noopener noreferrer" className="text-sm text-usc-cardinal hover:text-usc-cardinal-dark font-medium mt-2 inline-block">
              Apply to be a StudyBuddy Tutor today!
            </a>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="major">Major</Label>
          <Input id="major" name="major" value={formData.major} onChange={handleInputChange} placeholder="Computer Science" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="graduation_year">Graduation Year</Label>
          <Input id="graduation_year" name="graduation_year" value={formData.graduation_year} onChange={handleInputChange} placeholder="2026" />
        </div>

        {isTutor && <div className="space-y-2">
            <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input id="hourly_rate" name="hourly_rate" value={formData.hourly_rate} onChange={handleInputChange} placeholder="25" className="pl-10" />
            </div>
            <p className="text-sm text-muted-foreground">
              Set your hourly tutoring rate - this will be displayed on your profile
            </p>
          </div>}
        
        <div className="space-y-2">
          <Label htmlFor="bio">
            {isStudent ? "Bio (Student)" : "Bio (Tutor)"}
          </Label>
          <Textarea 
            id="bio" 
            name={isStudent ? "studentBio" : "tutorBio"}
            value={isStudent ? formData.student_bio : formData.tutor_bio} 
            onChange={handleInputChange} 
            placeholder={isStudent ? "Tell students about your learning style and what subjects you need help with..." : "Tell students about your teaching experience and approach..."}
          />
        </div>
        
        <Button className="bg-usc-cardinal hover:bg-usc-cardinal-dark" onClick={handleProfileUpdate} disabled={loading || uploadingAvatar}>
          {loading || uploadingAvatar ? <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </> : "Save Changes"}
        </Button>
      </CardContent>
    </Card>;
};