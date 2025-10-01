import { Tutor } from "@/types/tutor";

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
 * Filter tutors by subject
 */
export const filterTutorsBySubject = (tutors: Tutor[], selectedSubject: string): Tutor[] => {
  if (selectedSubject === "all") {
    return tutors;
  }

  const normalizedSubject = normalizeText(selectedSubject);
  
  return tutors.filter(tutor => {
    const tutorField = normalizeText(tutor.field);
    const tutorSubjects = tutor.subjects.map(s => ({
      code: normalizeText(s.code),
      name: normalizeText(s.name),
    }));

    return tutorField.includes(normalizedSubject) ||
      tutorSubjects.some(s => s.code.includes(normalizedSubject) || s.name.includes(normalizedSubject));
  });
};
