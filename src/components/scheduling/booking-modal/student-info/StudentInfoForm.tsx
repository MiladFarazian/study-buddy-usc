
import { useState, useEffect } from "react";
import { useScheduling } from "@/contexts/SchedulingContext";
import { useAuthState } from "@/hooks/useAuthState";
import { User } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function StudentInfoForm() {
  const { state, dispatch } = useScheduling();
  const { user } = useAuthState();
  
  const [name, setName] = useState(state.studentName || "");
  const [email, setEmail] = useState(state.studentEmail || "");
  const [notes, setNotes] = useState(state.notes || "");
  
  // Populate form with user data if available
  useEffect(() => {
    if (user) {
      const userName = user.user_metadata?.name || "";
      const userEmail = user.email || "";
      
      if (name === "") setName(userName);
      if (email === "") setEmail(userEmail);
      
      dispatch({ 
        type: 'SET_STUDENT_INFO', 
        payload: { 
          name: userName, 
          email: userEmail 
        } 
      });
    }
  }, [user, dispatch, name, email]);
  
  // Update context when form values change
  useEffect(() => {
    dispatch({ 
      type: 'SET_STUDENT_INFO', 
      payload: { 
        name, 
        email 
      } 
    });
    
    dispatch({ 
      type: 'SET_NOTES', 
      payload: notes 
    });
  }, [name, email, notes, dispatch]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Your Details</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Please confirm your information and add any specific details for your tutor.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Your Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes for Your Tutor (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any specific topics or questions you'd like to cover"
            className="min-h-[100px]"
          />
        </div>
      </div>
    </div>
  );
}
