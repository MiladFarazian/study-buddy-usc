
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

export async function removeCourseFromProfile(userId: string, courseNumber: string) {
  try {
    // First check if the user is a tutor
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, subjects')
      .eq('id', userId)
      .single();
      
    if (!profileData) {
      throw new Error("User profile not found");
    }
    
    // Remove course from subjects array in profile
    const subjects = profileData.subjects || [];
    if (subjects.includes(courseNumber)) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          subjects: subjects.filter(subject => subject !== courseNumber) 
        })
        .eq('id', userId);
        
      if (updateError) {
        throw updateError;
      }
    }
    
    // If user is a tutor, also remove from tutor_courses table
    if (profileData.role === 'tutor') {
      const { error: deleteError } = await supabase
        .from('tutor_courses')
        .delete()
        .eq('tutor_id', userId)
        .eq('course_number', courseNumber);
        
      if (deleteError) {
        throw deleteError;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error removing course:", error);
    throw error;
  }
}
