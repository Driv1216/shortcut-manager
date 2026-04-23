/**
 * Duplicate Detection Service
 * Uses Set for efficient duplicate shortcut detection
 */

import { getAllShortcuts } from './storageService.js';

/**
 * Build a Set of existing normalized shortcut keys
 * @param {string|null} excludeId - Optional ID to exclude (for updates)
 * @returns {Promise<Set<string>>} Set of normalized keys
 */
export async function buildDuplicateSet(excludeId = null) {
  const shortcuts = await getAllShortcuts();
  const keySet = new Set();
  
  for (const shortcut of shortcuts) {
    if (excludeId && shortcut.id === excludeId) {
      continue; // Skip the current record when editing
    }
    if (shortcut.normalizedKeys) {
      keySet.add(shortcut.normalizedKeys);
    }
  }
  
  return keySet;
}

/**
 * Check if a normalized key already exists
 * @param {string} normalizedKey - The normalized shortcut key to check
 * @param {string|null} excludeId - Optional ID to exclude (for updates)
 * @returns {Promise<boolean>} True if duplicate exists
 */
export async function isDuplicate(normalizedKey, excludeId = null) {
  const keySet = await buildDuplicateSet(excludeId);
  return keySet.has(normalizedKey);
}

/**
 * Find duplicates in import data against existing shortcuts
 * @param {Array} importData - Array of shortcut objects to import
 * @returns {Promise<Object>} Object with duplicates array and existingSet
 */
export async function findImportDuplicates(importData) {
  const existingSet = await buildDuplicateSet();
  const duplicates = [];
  
  for (const item of importData) {
    if (item.normalizedKeys && existingSet.has(item.normalizedKeys)) {
      duplicates.push(item.normalizedKeys);
    }
  }
  
  return { duplicates, existingSet };
}

/**
 * Validate import batch for internal duplicates and existing duplicates
 * @param {Array} importData - Array of validated shortcut objects
 * @returns {Promise<{ valid: boolean, duplicates: string[], errors: string[] }>}
 */
export async function validateImportDuplicates(importData) {
  const errors = [];
  const duplicates = [];
  
  // Check for internal duplicates within the import
  const importSet = new Set();
  for (const item of importData) {
    if (importSet.has(item.normalizedKeys)) {
      duplicates.push(`Internal duplicate: ${item.normalizedKeys}`);
    }
    importSet.add(item.normalizedKeys);
  }
  
  // Check for duplicates against existing data
  const existingSet = await buildDuplicateSet();
  for (const item of importData) {
    if (existingSet.has(item.normalizedKeys)) {
      duplicates.push(`Already exists: ${item.normalizedKeys}`);
    }
  }
  
  if (duplicates.length > 0) {
    errors.push(...duplicates.map(d => `Duplicate shortcut: ${d}`));
  }
  
  return {
    valid: duplicates.length === 0,
    duplicates,
    errors
  };
}
