import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique ID using uuid v4 with a fallback to a random string 
 * if crypto.randomUUID is not available in non-secure contexts.
 */
export const generateId = (): string => {
  try {
    // Prefer native crypto.randomUUID if available
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (e) {
    // Fallback to uuid package
  }
  return uuidv4();
};
