
// Request validation
export function validateRequest(sessionId?: string, amount?: number, tutorId?: string, studentId?: string) {
  if (!sessionId || amount === undefined || !tutorId || !studentId) {
    return { 
      isValid: false, 
      error: 'Missing required parameters',
      code: 'missing_parameters'
    };
  }
  
  return { isValid: true };
}
