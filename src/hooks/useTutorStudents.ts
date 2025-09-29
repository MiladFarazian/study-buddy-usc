
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
        
        // Fetch tutor-student assignments and join with profile data
        // Explicitly specify which profile we're referring to with profiles!student_id
        const { data, error } = await supabase
          .from('tutor_students')
          .select(`
            id,
            student_id,
            created_at,
            profiles!student_id(
              id,
              first_name,
              last_name,
              major,
              graduation_year,
              avatar_url,
              created_at
            )
          `)
          .eq('tutor_id', user.id)
          .eq('active', true);
        
        if (error) throw error;
        
        // Transform data into the Student type, filtering out any null profiles
        const mappedStudents: Student[] = (data || [])
          .filter((item): item is typeof item & { profiles: NonNullable<typeof item.profiles> } => {
            if (!item.profiles) {
              console.warn('Skipping student with null profile:', item.student_id);
              return false;
            }
            return true;
          })
          .map((item) => ({
            id: item.profiles.id,
            name: `${item.profiles.first_name || ''} ${item.profiles.last_name || ''}`.trim(),
            firstName: item.profiles.first_name,
            lastName: item.profiles.last_name,
            major: item.profiles.major,
            graduationYear: item.profiles.graduation_year,
            avatarUrl: item.profiles.avatar_url,
            joined: item.created_at,
            sessions: 0, // Will be implemented later
          }));
        
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
