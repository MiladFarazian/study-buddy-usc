
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

interface SessionConfirmationCardProps {
  sessionId: string;
  onConfirmed?: () => void;
}

export function SessionConfirmationCard({ sessionId, onConfirmed }: SessionConfirmationCardProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStudent = profile?.role === 'student';
  const isTutor = profile?.role === 'tutor';
  
  // Load session data
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId || !user) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('sessions')
          .select(`
            *,
            tutor:tutor_id(id, first_name, last_name),
            student:student_id(id, first_name, last_name),
            payment_transactions(*)
          `)
          .eq('id', sessionId)
          .single();
          
        if (error) throw error;
        
        setSession(data);
      } catch (error) {
        console.error('Error fetching session:', error);
        setError('Failed to load session details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSession();
  }, [sessionId, user]);
  
  // Determine if the user can confirm this session
  const canConfirm = () => {
    if (!session || !user) return false;
    
    const userRole = isStudent ? 'student' : (isTutor ? 'tutor' : null);
    if (!userRole) return false;
    
    if (userRole === 'student') {
      return session.student_id === user.id && !session.student_confirmed;
    } else if (userRole === 'tutor') {
      return session.tutor_id === user.id && !session.tutor_confirmed;
    }
    
    return false;
  };
  
  // Handle confirmation button click
  const handleConfirm = async () => {
    if (!session || !user || !profile) return;
    
    try {
      setConfirming(true);
      setError(null);
      
      const userRole = isStudent ? 'student' : (isTutor ? 'tutor' : null);
      if (!userRole) throw new Error('Invalid user role');
      
      const { data, error } = await supabase.functions.invoke('confirm-session-complete', {
        body: {
          sessionId: session.id,
          userRole
        }
      });
      
      if (error) throw error;
      
      setSession(data.session);
      toast({
        title: "Session Confirmed",
        description: "Thank you for confirming the session completion."
      });
      
      if (data.session.tutor_confirmed && data.session.student_confirmed) {
        toast({
          title: "Payment Released",
          description: "The payment has been released to the tutor."
        });
      }
      
      if (onConfirmed) {
        onConfirmed();
      }
    } catch (error) {
      console.error('Error confirming session:', error);
      setError('Failed to confirm session completion. Please try again.');
      toast({
        title: "Error",
        description: "Failed to confirm session completion.",
        variant: "destructive"
      });
    } finally {
      setConfirming(false);
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  if (!session) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Session Not Found</AlertTitle>
            <AlertDescription>The session could not be found.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Format the session date and time
  const startTime = new Date(session.start_time);
  const endTime = new Date(session.end_time);
  const formattedDate = format(startTime, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = format(startTime, 'h:mm a');
  const formattedEndTime = format(endTime, 'h:mm a');
  
  // Get the other person's name (for the student, show tutor name; for the tutor, show student name)
  const otherPerson = isStudent 
    ? `${session.tutor.first_name} ${session.tutor.last_name}`
    : `${session.student.first_name} ${session.student.last_name}`;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Session Confirmation</span>
          {session.status === 'completed' ? (
            <Badge className="bg-green-500">Completed</Badge>
          ) : (
            <Badge className="bg-amber-500">Pending Confirmation</Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isStudent
            ? "Confirm when your tutoring session has been completed"
            : "Confirm when you've completed the tutoring session"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Session Details</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Date:</div>
            <div className="font-medium">{formattedDate}</div>
            
            <div>Time:</div>
            <div className="font-medium">{formattedStartTime} - {formattedEndTime}</div>
            
            <div>{isStudent ? 'Tutor:' : 'Student:'}</div>
            <div className="font-medium">{otherPerson}</div>
          </div>
        </div>
        
        <div className="border rounded-md p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Tutor Confirmation</span>
            {session.tutor_confirmed ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Student Confirmation</span>
            {session.student_confirmed ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            )}
          </div>
        </div>
        
        {session.status === 'completed' ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Session Completed</AlertTitle>
            <AlertDescription>
              This session has been confirmed by both parties and is now marked as completed. 
              {isTutor && " The payment has been processed and will appear in your Stripe account."}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Action Required</AlertTitle>
            <AlertDescription>
              {isStudent ? (
                session.student_confirmed ? (
                  "You've confirmed this session. Waiting for tutor confirmation."
                ) : (
                  "Please confirm when this tutoring session has been completed."
                )
              ) : (
                session.tutor_confirmed ? (
                  "You've confirmed this session. Waiting for student confirmation."
                ) : (
                  "Please confirm when you've completed this tutoring session."
                )
              )}
              {isTutor && !session.tutor_confirmed && 
                " You'll receive payment after both you and the student confirm session completion."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      {canConfirm() && (
        <CardFooter>
          <Button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full bg-usc-cardinal hover:bg-usc-cardinal-dark"
          >
            {confirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              'Confirm Session Completion'
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
