
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChangeEvent } from "react";

interface StudentInfoFormProps {
  email: string;
  onEmailChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const StudentInfoForm = ({ email, onEmailChange }: StudentInfoFormProps) => {
  return (
    <div className="space-y-2">
      <Label>4. Your Email</Label>
      <Input 
        type="email" 
        placeholder="your@email.com" 
        value={email}
        onChange={onEmailChange}
      />
      <p className="text-xs text-muted-foreground">A confirmation will be sent to this email address</p>
    </div>
  );
};
