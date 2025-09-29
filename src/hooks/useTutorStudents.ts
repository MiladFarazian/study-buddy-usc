
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export type Student = {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  major: string | null;
  graduationYear: string | null;
  avatarUrl: string | null;
  email?: string;
  sessions?: number;
  joined: string;
};

export const useTutorStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Step 1: Fetch all completed sessions for this tutor
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('student_id, created_at')
          .eq('tutor_id', user.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false });
        
        if (sessionError) throw sessionError;
        
        if (!sessionData || sessionData.length === 0) {
          setStudents([]);
          return;
        }
        
        // Group by student and count sessions
        const studentMap = new Map<string, { firstSession: string, count: number }>();
        
        sessionData.forEach(session => {
          const existing = studentMap.get(session.student_id);
          if (existing) {
            existing.count++;
            // Keep the earliest session date
            if (session.created_at < existing.firstSession) {
              existing.firstSession = session.created_at;
            }
          } else {
            studentMap.set(session.student_id, {
              firstSession: session.created_at,
              count: 1
            });
          }
        });
        
        // Step 2: Fetch profiles for all unique student IDs
        const studentIds = Array.from(studentMap.keys());
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, major, graduation_year, avatar_url')
          .in('id', studentIds);
        
        if (profilesError) throw profilesError;
        
        // Step 3: Combine the data
        const mappedStudents: Student[] = (profilesData || [])
          .map(profile => {
            const studentInfo = studentMap.get(profile.id);
            if (!studentInfo) return null;
            
            return {
              id: profile.id,
              name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
              firstName: profile.first_name,
              lastName: profile.last_name,
              major: profile.major,
              graduationYear: profile.graduation_year,
              avatarUrl: profile.avatar_url,
              joined: studentInfo.firstSession,
              sessions: studentInfo.count,
            };
          })
          .filter(student => student !== null)
          .sort((a, b) => (b.sessions || 0) - (a.sessions || 0));
        
        setStudents(mappedStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast({
          title: "Failed to load students",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudents();
  }, [user, toast]);
  
  const addStudent = async (studentId: string) => {
    if (!user) return { success: false, error: "Not authenticated" };
    
    try {
      const { error } = await supabase
        .from('tutor_students')
        .insert({
          tutor_id: user.id,
          student_id: studentId
        });
      
      if (error) throw error;
      
      // Refresh the student list
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, major, graduation_year, avatar_url, created_at')
        .eq('id', studentId)
        .single();
        
      if (fetchError) throw fetchError;
      
      const newStudent: Student = {
        id: data.id,
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        firstName: data.first_name,
        lastName: data.last_name,
        major: data.major,
        graduationYear: data.graduation_year,
        avatarUrl: data.avatar_url,
        joined: new Date().toISOString(),
        sessions: 0,
      };
      
      setStudents(prev => [...prev, newStudent]);
      
      return { success: true, student: newStudent };
    } catch (error: any) {
      console.error('Error adding student:', error);
      return { 
        success: false, 
        error: error.message || "Failed to add student" 
      };
    }
  };
  
  const removeStudent = async (studentId: string) => {
    if (!user) return { success: false, error: "Not authenticated" };
    
    try {
      const { error } = await supabase
        .from('tutor_students')
        .delete()
        .eq('tutor_id', user.id)
        .eq('student_id', studentId);
      
      if (error) throw error;
      
      // Update the state
      setStudents(prev => prev.filter(student => student.id !== studentId));
      
      return { success: true };
    } catch (error: any) {
      console.error('Error removing student:', error);
      return { 
        success: false, 
        error: error.message || "Failed to remove student" 
      };
    }
  };
  
  return { students, loading, addStudent, removeStudent };
};
