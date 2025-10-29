import { Tutor } from "@/types/tutor";
import { Course } from "@/types/CourseTypes";

/**
 * Normalize text for searching: lowercase, remove special chars, trim
 */
const normalizeText = (text: string): string => {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');
};

/**
 * Tokenize text into searchable parts
 */
const tokenize = (text: string): string[] => {
  return normalizeText(text).split(' ').filter(token => token.length > 0);
};

/**
 * Calculate match score for a tutor based on search query
 * Higher score = better match
 */
interface SearchScore {
  tutor: Tutor;
  score: number;
}

/**
 * Multi-tier search scoring system with instructor support
 */
export const searchTutors = (tutors: Tutor[], searchQuery: string): Tutor[] => {
  if (!searchQuery || searchQuery.trim() === "") {
    return tutors;
  }

  const normalizedQuery = normalizeText(searchQuery);
  const queryTokens = tokenize(searchQuery);
  
  const scoredTutors: SearchScore[] = tutors.map(tutor => {
    let score = 0;
    
    const tutorName = normalizeText(tutor.name);
    const tutorField = normalizeText(tutor.field);
    const tutorSubjects = tutor.subjects.map(s => ({
      code: normalizeText(s.code),
      name: normalizeText(s.name),
      instructor: normalizeText(s.instructor || ''),
    }));

    // TIER 1: Exact matches (highest priority) - 1000 points
    if (tutorName === normalizedQuery) score += 1000;
    if (tutorField === normalizedQuery) score += 1000;
    if (tutorSubjects.some(s => s.code === normalizedQuery || s.name === normalizedQuery)) {
      score += 1000;
    }

    // TIER 2: Direct substring matches - 500 points
    if (tutorName.includes(normalizedQuery)) score += 500;
    if (tutorField.includes(normalizedQuery)) score += 500;
    if (tutorSubjects.some(s => 
      s.code.includes(normalizedQuery) || 
      s.name.includes(normalizedQuery) ||
      s.instructor.includes(normalizedQuery)
    )) {
      score += 500;
    }

    // TIER 3: Tokenized matches (all tokens present in any order) - 300 points per token
    const nameTokens = tokenize(tutor.name);
    const fieldTokens = tokenize(tutor.field);
    const subjectTokens = tutorSubjects.flatMap(s => [
      ...tokenize(s.code), 
      ...tokenize(s.name),
      ...(s.instructor ? tokenize(s.instructor) : [])
    ]);
    
    for (const queryToken of queryTokens) {
      // Check name tokens
      if (nameTokens.some(t => t.includes(queryToken) || queryToken.includes(t))) {
        score += 300;
      }
      
      // Check field tokens
      if (fieldTokens.some(t => t.includes(queryToken) || queryToken.includes(t))) {
        score += 300;
      }
      
      // Check subject tokens (with bonus for course codes)
      if (subjectTokens.some(t => t.includes(queryToken) || queryToken.includes(t))) {
        score += 400; // Higher weight for subjects
      }
    }

    // TIER 4: Partial matches - 100 points
    // Handle course codes like "437" matching "FBE-437" or "CSCI" matching "CSCI-201"
    for (const subject of tutorSubjects) {
      const codeParts = subject.code.split(/[\s\-]/);
      const nameParts = subject.name.split(/[\s\-]/);
      
      for (const queryToken of queryTokens) {
        if (codeParts.some(part => part.includes(queryToken) || queryToken.includes(part))) {
          score += 100;
        }
        if (nameParts.some(part => part.includes(queryToken) || queryToken.includes(part))) {
          score += 100;
        }
      }
    }

    // TIER 5: Bonus for multiple token matches
    const allTokens = [...nameTokens, ...fieldTokens, ...subjectTokens];
    const matchedTokenCount = queryTokens.filter(qt => 
      allTokens.some(t => t.includes(qt) || qt.includes(t))
    ).length;
    
    if (matchedTokenCount === queryTokens.length) {
      score += 200; // All query tokens matched somewhere
    }

    return { tutor, score };
  });

  // Filter out tutors with zero score and sort by score (descending)
  return scoredTutors
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.tutor);
};

/**
 * Filter tutors by department code
 */
export const filterTutorsBySubject = (tutors: Tutor[], selectedSubject: string): Tutor[] => {
  if (selectedSubject === "all") {
    return tutors;
  }

  // selectedSubject is now a department code like "CSCI" or "FBE"
  const upperSubject = selectedSubject.toUpperCase();
  
  return tutors.filter(tutor => {
    return tutor.subjects.some(subject => {
      // Check if the course code starts with the department code
      return subject.code.toUpperCase().startsWith(upperSubject);
    });
  });
};

/**
 * Multi-tier search scoring system for courses
 */
interface CourseSearchScore {
  course: Course;
  score: number;
}

export const searchCourses = (courses: Course[], searchQuery: string): Course[] => {
  if (!searchQuery || searchQuery.trim() === "") {
    return courses;
  }

  const normalizedQuery = normalizeText(searchQuery);
  const queryTokens = tokenize(searchQuery);
  
  const scoredCourses: CourseSearchScore[] = courses.map(course => {
    let score = 0;
    
    const courseNumber = normalizeText(course.course_number || '');
    const courseTitle = normalizeText(course.course_title || '');
    const description = normalizeText(course.description || '');
    const department = normalizeText(course.department || '');
    const instructor = normalizeText(course.instructor || '');

    // TIER 1: Exact matches (highest priority) - 1000 points
    if (courseNumber === normalizedQuery) score += 1000;
    if (courseTitle === normalizedQuery) score += 1000;
    if (instructor === normalizedQuery) score += 1000;
    if (department === normalizedQuery) score += 800;

    // TIER 2: Direct substring matches - 500 points
    if (courseNumber.includes(normalizedQuery)) score += 500;
    if (courseTitle.includes(normalizedQuery)) score += 500;
    if (instructor.includes(normalizedQuery)) score += 500;
    if (department.includes(normalizedQuery)) score += 400;
    if (description.includes(normalizedQuery)) score += 300;

    // TIER 3: Tokenized matches (all tokens present in any order) - 300 points per token
    const numberTokens = tokenize(course.course_number || '');
    const titleTokens = tokenize(course.course_title || '');
    const descriptionTokens = tokenize(course.description || '');
    const departmentTokens = tokenize(course.department || '');
    const instructorTokens = tokenize(course.instructor || '');
    
    for (const queryToken of queryTokens) {
      // Check course number tokens (highest weight for course codes)
      if (numberTokens.some(t => t.includes(queryToken) || queryToken.includes(t))) {
        score += 400;
      }
      
      // Check title tokens
      if (titleTokens.some(t => t.includes(queryToken) || queryToken.includes(t))) {
        score += 350;
      }
      
      // Check instructor tokens
      if (instructorTokens.some(t => t.includes(queryToken) || queryToken.includes(t))) {
        score += 350;
      }
      
      // Check department tokens
      if (departmentTokens.some(t => t.includes(queryToken) || queryToken.includes(t))) {
        score += 300;
      }
      
      // Check description tokens
      if (descriptionTokens.some(t => t.includes(queryToken) || queryToken.includes(t))) {
        score += 200;
      }
    }

    // TIER 4: Partial matches - 100 points
    // Handle course codes like "201" matching "CSCI-201"
    const numberParts = courseNumber.split(/[\s\-]/);
    const titleParts = courseTitle.split(/[\s\-]/);
    
    for (const queryToken of queryTokens) {
      if (numberParts.some(part => part.includes(queryToken) || queryToken.includes(part))) {
        score += 100;
      }
      if (titleParts.some(part => part.includes(queryToken) || queryToken.includes(part))) {
        score += 100;
      }
    }

    // TIER 5: Bonus for multiple token matches
    const allTokens = [...numberTokens, ...titleTokens, ...instructorTokens, ...departmentTokens, ...descriptionTokens];
    const matchedTokenCount = queryTokens.filter(qt => 
      allTokens.some(t => t.includes(qt) || qt.includes(t))
    ).length;
    
    if (matchedTokenCount === queryTokens.length) {
      score += 200; // All query tokens matched somewhere
    }

    return { course, score };
  });

  // Filter out courses with zero score and sort by score (descending)
  return scoredCourses
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.course);
};

/**
 * Multi-tier search scoring system for resources
 */
interface Resource {
  id: string;
  title: string;
  description: string | null;
  resource_type: string;
  download_count: number;
  uploaded_at: string;
  file_name: string;
  courses?: Array<{
    course_number: string;
    course_title: string | null;
  }>;
  uploader?: {
    first_name: string | null;
    last_name: string | null;
  };
}

interface ResourceSearchScore {
  resource: Resource;
  score: number;
}

export const searchResources = (resources: Resource[], searchQuery: string): Resource[] => {
  if (!searchQuery || searchQuery.trim() === "") {
    return resources;
  }

  // Transform resources into course-like objects to use the same algorithm
  const pseudoCourses: Course[] = resources.map(resource => {
    const courseCodes = resource.courses?.map(c => c.course_number).join(' ') || '';
    const firstCourse = resource.courses?.[0];
    const department = firstCourse?.course_number.split('-')[0] || '';
    const uploaderName = resource.uploader 
      ? `${resource.uploader.first_name || ''} ${resource.uploader.last_name || ''}`.trim()
      : '';

    return {
      course_number: courseCodes,
      course_title: resource.title,
      description: resource.description || '',
      instructor: uploaderName,
      department: department,
      // Add a reference to the original resource
      _resourceId: resource.id,
    } as Course & { _resourceId: string };
  });

  // Use the searchCourses algorithm
  const searchedPseudoCourses = searchCourses(pseudoCourses, searchQuery);

  // Map back to original resources in the order returned by searchCourses
  const resourceMap = new Map(resources.map(r => [r.id, r]));
  return searchedPseudoCourses
    .map(pc => resourceMap.get((pc as any)._resourceId))
    .filter((r): r is Resource => r !== undefined);
};
