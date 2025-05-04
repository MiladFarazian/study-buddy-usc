
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useScheduling } from "@/contexts/SchedulingContext";
import { ArrowLeft, User } from "lucide-react";
import { useAuthState } from "@/hooks/useAuthState";

interface StudentInfoFormProps {
  onBack?: () => void;
  onContinue?: () => void;
}

export function StudentInfoForm({ onBack, onContinue }: StudentInfoFormProps) {
  const { state, dispatch } = useScheduling();
  const { user, profile } = useAuthState();
  
  const [name, setName] = useState(state.studentName || "");
  const [email, setEmail] = useState(state.studentEmail || "");
  const [notes, setNotes] = useState(state.notes || "");
  const [errors, setErrors] = useState({
    name: "",
    email: ""
  });
  
  // Pre-fill form with user data if available
  useEffect(() => {
    if (user && profile) {
      if (!name && profile.first_name && profile.last_name) {
        setName(`${profile.first_name} ${profile.last_name}`);
      }
      
      if (!email && user.email) {
        setEmail(user.email);
      }
    }
  }, [user, profile, name, email]);
  
  const validateForm = () => {
    const newErrors = {
      name: "",
      email: ""
    };
    
    let isValid = true;
    
    if (!name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Valid email is required";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      dispatch({ type: 'SET_STUDENT_INFO', payload: { name, email } });
      dispatch({ type: 'SET_NOTES', payload: notes });
      
      if (onContinue) {
        onContinue();
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="mr-2 p-0">
            <ArrowLeft className="h-4 w-4" />
            <span className="ml-2">Back</span>
          </Button>
        )}
        <h3 className="text-xl font-semibold">Your Details</h3>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Add any specific topics you'd like to cover or questions you have"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
      
      {onBack && onContinue && (
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          
          <Button 
            type="submit"
            className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
          >
            Continue
          </Button>
        </div>
      )}
    </form>
  );
}
