
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/types/CourseTypes";

export async function addCourseToProfile(userId: string, course: Course) {
  // First check if the user is a tutor
  const { data: profileData } = await supabase
    .from('profiles')
    .select('role, subjects')
    .eq('id', userId)
    .single();
    
  if (!profileData) {
    throw new Error("User profile not found");
  }
  
  // Add course to subjects array in profile
  const subjects = profileData.subjects || [];
  if (!subjects.includes(course.course_number)) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        subjects: [...subjects, course.course_number] 
      })
      .eq('id', userId);
      
    if (updateError) {
      throw updateError;
    }
  }
  
  // If user is a tutor, also add to tutor_courses table
  if (profileData.role === 'tutor') {
    // Check if course already exists in tutor_courses
    const { data: existingCourse } = await supabase
      .from('tutor_courses')
      .select('id')
      .eq('tutor_id', userId)
      .eq('course_number', course.course_number)
      .maybeSingle();
      
    if (!existingCourse) {
      const { error: insertError } = await supabase
        .from('tutor_courses')
        .insert({
          tutor_id: userId,
          course_number: course.course_number,
          course_title: course.course_title,
          department: course.department
        });
        
      if (insertError) {
        throw insertError;
      }
    }
  }
  
  return true;
}
