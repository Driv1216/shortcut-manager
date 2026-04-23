/**
 * Validation Utilities
 * Input validation helpers for shortcuts
 */

import { normalizeShortcut } from './normalizer.js';
import { RESERVED_SHORTCUTS } from '../config/constants.js';

/**
 * Validate a shortcut record for creation/update
 * @param {Object} data - Shortcut data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {{ valid: boolean, errors: string[], warnings: string[], normalizedData: Object | null }}
 */
export function validateShortcut(data, isUpdate = false) {
  const errors = [];
  const warnings = [];
  
  // Validate action
  if (!data.action || typeof data.action !== 'string' || !data.action.trim()) {
    errors.push('Action name is required');
  }
  
  // Validate keys
  if (!data.keys || typeof data.keys !== 'string' || !data.keys.trim()) {
    errors.push('Shortcut keys are required');
  }
  
  // If basic validation fails, return early
  if (errors.length > 0) {
    return { valid: false, errors, warnings, normalizedData: null };
  }
  
  // Normalize the shortcut
  const normalized = normalizeShortcut(data.keys);
  
  if (!normalized.valid) {
    errors.push(normalized.error);
    return { valid: false, errors, warnings, normalizedData: null };
  }
  
  // Check for reserved shortcuts
  if (RESERVED_SHORTCUTS.includes(normalized.normalized)) {
    warnings.push(`Warning: ${normalized.normalized} may be reserved by the browser and might not work as expected`);
  }
  
  // Validate category
  const category = data.category && typeof data.category === 'string' 
    ? data.category.trim() 
    : 'Custom';
  
  // Validate description
  const description = data.description && typeof data.description === 'string'
    ? data.description.trim()
    : '';
  
  // Validate enabled status
  const enabled = typeof data.enabled === 'boolean' ? data.enabled : true;
  
  // Build normalized data object
  const normalizedData = {
    action: data.action.trim(),
    keys: data.keys.trim(),
    normalizedKeys: normalized.normalized,
    category,
    description,
    enabled
  };
  
  return { valid: true, errors, warnings, normalizedData };
}

/**
 * Validate import data
 * @param {any} data - Data to validate as import
 * @returns {{ valid: boolean, errors: string[], validShortcuts: Object[] }}
 */
export function validateImport(data) {
  const errors = [];
  const validShortcuts = [];
  
  if (!Array.isArray(data)) {
    errors.push('Import data must be an array');
    return { valid: false, errors, validShortcuts };
  }
  
  if (data.length === 0) {
    errors.push('Import data is empty');
    return { valid: false, errors, validShortcuts };
  }
  
  // Track normalized keys within import to detect internal duplicates
  const seenKeys = new Set();
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    
    if (!item || typeof item !== 'object') {
      errors.push(`Item ${i + 1}: Invalid format`);
      continue;
    }
    
    const validation = validateShortcut(item);
    
    if (!validation.valid) {
      errors.push(`Item ${i + 1}: ${validation.errors.join(', ')}`);
      continue;
    }
    
    // Check for duplicates within the import batch
    if (seenKeys.has(validation.normalizedData.normalizedKeys)) {
      errors.push(`Item ${i + 1}: Duplicate shortcut within import: ${validation.normalizedData.normalizedKeys}`);
      continue;
    }
    
    seenKeys.add(validation.normalizedData.normalizedKeys);
    validShortcuts.push(validation.normalizedData);
  }
  
  // Only valid if no errors
  return {
    valid: errors.length === 0,
    errors,
    validShortcuts: errors.length === 0 ? validShortcuts : []
  };
}
