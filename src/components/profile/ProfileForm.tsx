
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ProfileFormProps {
  firstName: string;
  lastName: string;
  major: string;
  gradYear: string;
  bio: string;
  isSubmitting: boolean;
  uploadingAvatar: boolean;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onMajorChange: (value: string) => void;
  onGradYearChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ProfileForm = ({
  firstName,
  lastName,
  major,
  gradYear,
  bio,
  isSubmitting,
  uploadingAvatar,
  onFirstNameChange,
  onLastNameChange,
  onMajorChange,
  onGradYearChange,
  onBioChange,
  onSubmit
}: ProfileFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium">
                First Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => onFirstNameChange(e.target.value)}
                placeholder="Your first name"
                required
                className={!firstName ? "border-red-300 focus:border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium">
                Last Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => onLastNameChange(e.target.value)}
                placeholder="Your last name"
                required
                className={!lastName ? "border-red-300 focus:border-red-500" : ""}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label htmlFor="major" className="text-sm font-medium">
                Major <span className="text-red-500">*</span>
              </label>
              <Input
                id="major"
                value={major}
                onChange={(e) => onMajorChange(e.target.value)}
                placeholder="e.g. Computer Science"
                required
                className={!major ? "border-red-300 focus:border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="gradYear" className="text-sm font-medium">
                Graduation Year
              </label>
              <Input
                id="gradYear"
                value={gradYear}
                onChange={(e) => onGradYearChange(e.target.value)}
                placeholder="e.g. 2025"
              />
            </div>
          </div>
          
          <div className="space-y-2 mb-6">
            <label htmlFor="bio" className="text-sm font-medium">
                Bio <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              placeholder="Tell us a bit about yourself..."
              rows={5}
              required
              className={!bio ? "border-red-300 focus:border-red-500" : ""}
            />
          </div>
          
          <Button
            type="submit"
            className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
            disabled={isSubmitting || uploadingAvatar || !firstName || !lastName || !major || !bio}
          >
            {(isSubmitting || uploadingAvatar) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
