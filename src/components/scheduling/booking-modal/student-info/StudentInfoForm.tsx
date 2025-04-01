
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChangeEvent } from "react";

interface StudentInfoFormProps {
  email: string;
  onEmailChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const StudentInfoForm = ({ 
  email, 
  onEmailChange 
}: StudentInfoFormProps) => {
  return (
    <div className="space-y-2">
      <Label>3. Your Information</Label>
      <div className="space-y-4 border rounded-md p-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@usc.edu"
            value={email}
            onChange={onEmailChange}
            required
          />
          <p className="text-xs text-muted-foreground">
            We'll send booking confirmation and session details to this email.
          </p>
        </div>
      </div>
    </div>
  );
};
