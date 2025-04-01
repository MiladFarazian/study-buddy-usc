
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChangeEvent, useState } from "react";

interface StudentInfoFormProps {
  email: string;
  onEmailChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const StudentInfoForm = ({
  email,
  onEmailChange
}: StudentInfoFormProps) => {
  const [notes, setNotes] = useState("");
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
        <Label htmlFor="email" className="mb-2 block">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={onEmailChange}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="notes" className="mb-2 block">
          Notes for the tutor <span className="text-sm text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="notes"
          placeholder="Any specific topics or areas you'd like to cover in the session?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="h-24 resize-none"
        />
      </div>
    </div>
  );
};
