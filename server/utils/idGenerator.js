/**
 * ID Generator Utility
 * Generates unique identifiers for shortcut records
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique ID for a shortcut record
 * @returns {string} Unique identifier
 */
export function generateId() {
  return uuidv4();
}
