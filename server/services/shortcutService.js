/**
 * Shortcut Service
 * Core business logic for CRUD operations on shortcuts
 */

import * as storageService from './storageService.js';
import { isDuplicate, validateImportDuplicates } from './duplicateService.js';
import { rebuildRuntimeIndex, updateRuntimeIndex, removeFromRuntimeIndex } from './runtimeIndexService.js';
import * as historyService from './historyService.js';
import { validateShortcut, validateImport } from '../utils/validators.js';
import { normalizeShortcut } from '../utils/normalizer.js';
import { generateId } from '../utils/idGenerator.js';

/**
 * Get all shortcuts with optional filtering and sorting
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Filtered and sorted shortcuts
 */
export async function getAll(options = {}) {
  let shortcuts = await storageService.getAllShortcuts();
  const { search, category, enabled, sort } = options;
  
  // Filter by search term
  if (search) {
    const searchLower = search.toLowerCase();
    shortcuts = shortcuts.filter(s =>
      s.action.toLowerCase().includes(searchLower) ||
      s.keys.toLowerCase().includes(searchLower) ||
      s.normalizedKeys.toLowerCase().includes(searchLower) ||
      (s.category && s.category.toLowerCase().includes(searchLower)) ||
      (s.description && s.description.toLowerCase().includes(searchLower))
    );
  }
  
  // Filter by category
  if (category) {
    shortcuts = shortcuts.filter(s => s.category === category);
  }
  
  // Filter by enabled status
  if (enabled !== undefined) {
    const enabledBool = enabled === 'true' || enabled === true;
    shortcuts = shortcuts.filter(s => s.enabled === enabledBool);
  }
  
  // Sort
  if (sort) {
    switch (sort) {
      case 'action_asc':
        shortcuts.sort((a, b) => a.action.localeCompare(b.action));
        break;
      case 'action_desc':
        shortcuts.sort((a, b) => b.action.localeCompare(a.action));
        break;
      case 'shortcut_asc':
        shortcuts.sort((a, b) => a.normalizedKeys.localeCompare(b.normalizedKeys));
        break;
      case 'shortcut_desc':
        shortcuts.sort((a, b) => b.normalizedKeys.localeCompare(a.normalizedKeys));
        break;
      case 'updated_desc':
        shortcuts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        break;
      case 'created_desc':
        shortcuts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        // Default: by updated date descending
        shortcuts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
  }
  
  return shortcuts;
}

/**
 * Get a single shortcut by ID
 * @param {string} id - Shortcut ID
 * @returns {Promise<Object|null>} Shortcut or null
 */
export async function getById(id) {
  return storageService.getShortcutById(id);
}

/**
 * Create a new shortcut
 * @param {Object} data - Shortcut data
 * @returns {Promise<{ success: boolean, data?: Object, message: string, warnings?: string[] }>}
 */
export async function create(data) {
  // Validate input
  const validation = validateShortcut(data);
  
  if (!validation.valid) {
    return {
      success: false,
      message: validation.errors.join(', ')
    };
  }
  
  const { normalizedData } = validation;
  
  // Check for duplicates
  const duplicate = await isDuplicate(normalizedData.normalizedKeys);
  if (duplicate) {
    return {
      success: false,
      message: `Duplicate shortcut: ${normalizedData.normalizedKeys} already exists`
    };
  }
  
  // Create the shortcut record
  const now = new Date().toISOString();
  const shortcut = {
    id: generateId(),
    ...normalizedData,
    createdAt: now,
    updatedAt: now
  };
  
  // Save to storage
  await storageService.addShortcut(shortcut);
  
  // Record for undo
  historyService.recordCreate(shortcut);
  
  // Update runtime index
  await rebuildRuntimeIndex();
  
  return {
    success: true,
    data: shortcut,
    message: 'Shortcut created successfully',
    warnings: validation.warnings
  };
}

/**
 * Update an existing shortcut
 * @param {string} id - Shortcut ID
 * @param {Object} data - Updated data
 * @returns {Promise<{ success: boolean, data?: Object, message: string, warnings?: string[] }>}
 */
export async function update(id, data) {
  // Get existing shortcut
  const existing = await storageService.getShortcutById(id);
  if (!existing) {
    return {
      success: false,
      message: 'Shortcut not found'
    };
  }
  
  // Validate input
  const validation = validateShortcut(data);
  
  if (!validation.valid) {
    return {
      success: false,
      message: validation.errors.join(', ')
    };
  }
  
  const { normalizedData } = validation;
  
  // Check for duplicates (excluding current record)
  const duplicate = await isDuplicate(normalizedData.normalizedKeys, id);
  if (duplicate) {
    return {
      success: false,
      message: `Duplicate shortcut: ${normalizedData.normalizedKeys} already exists`
    };
  }
  
  // Build updated record
  const updated = {
    ...existing,
    ...normalizedData,
    updatedAt: new Date().toISOString()
  };
  
  // Save to storage
  await storageService.updateShortcut(id, updated);
  
  // Record for undo
  historyService.recordUpdate(existing, updated);
  
  // Update runtime index
  updateRuntimeIndex(existing, updated);
  
  return {
    success: true,
    data: updated,
    message: 'Shortcut updated successfully',
    warnings: validation.warnings
  };
}

/**
 * Delete a shortcut
 * @param {string} id - Shortcut ID
 * @returns {Promise<{ success: boolean, data?: Object, message: string }>}
 */
export async function remove(id) {
  const existing = await storageService.getShortcutById(id);
  if (!existing) {
    return {
      success: false,
      message: 'Shortcut not found'
    };
  }
  
  // Delete from storage
  await storageService.deleteShortcut(id);
  
  // Record for undo
  historyService.recordDelete(existing);
  
  // Update runtime index
  removeFromRuntimeIndex(existing.normalizedKeys);
  
  return {
    success: true,
    data: existing,
    message: 'Shortcut deleted successfully'
  };
}

/**
 * Toggle enabled status
 * @param {string} id - Shortcut ID
 * @returns {Promise<{ success: boolean, data?: Object, message: string }>}
 */
export async function toggleEnabled(id) {
  const existing = await storageService.getShortcutById(id);
  if (!existing) {
    return {
      success: false,
      message: 'Shortcut not found'
    };
  }
  
  const previousEnabled = existing.enabled;
  const updated = {
    ...existing,
    enabled: !existing.enabled,
    updatedAt: new Date().toISOString()
  };
  
  // Save to storage
  await storageService.updateShortcut(id, updated);
  
  // Record for undo
  historyService.recordToggle(updated, previousEnabled);
  
  // Update runtime index
  updateRuntimeIndex(existing, updated);
  
  return {
    success: true,
    data: updated,
    message: `Shortcut ${updated.enabled ? 'enabled' : 'disabled'} successfully`
  };
}

/**
 * Import shortcuts from JSON array
 * @param {Array} data - Array of shortcut objects
 * @returns {Promise<{ success: boolean, data?: Array, message: string, errors?: string[] }>}
 */
export async function importShortcuts(data) {
  // Validate import data
  const validation = validateImport(data);
  
  if (!validation.valid) {
    return {
      success: false,
      message: 'Import validation failed',
      errors: validation.errors
    };
  }
  
  // Check for duplicates against existing data
  const duplicateCheck = await validateImportDuplicates(validation.validShortcuts);
  
  if (!duplicateCheck.valid) {
    return {
      success: false,
      message: 'Import contains duplicate shortcuts',
      errors: duplicateCheck.errors
    };
  }
  
  // Prepare shortcuts with IDs and timestamps
  const now = new Date().toISOString();
  const newShortcuts = validation.validShortcuts.map(s => ({
    id: generateId(),
    ...s,
    createdAt: now,
    updatedAt: now
  }));
  
  // Add to existing shortcuts
  const existing = await storageService.getAllShortcuts();
  const combined = [...existing, ...newShortcuts];
  
  await storageService.replaceAllShortcuts(combined);
  
  // Record for undo
  historyService.recordImport(newShortcuts);
  
  // Rebuild runtime index
  await rebuildRuntimeIndex();
  
  return {
    success: true,
    data: newShortcuts,
    message: `Successfully imported ${newShortcuts.length} shortcuts`
  };
}

/**
 * Export all shortcuts
 * @returns {Promise<Array>} All shortcuts
 */
export async function exportShortcuts() {
  return storageService.getAllShortcuts();
}

/**
 * Get unique categories
 * @returns {Promise<string[]>} Array of unique categories
 */
export async function getCategories() {
  const shortcuts = await storageService.getAllShortcuts();
  const categories = new Set();
  
  for (const shortcut of shortcuts) {
    if (shortcut.category) {
      categories.add(shortcut.category);
    }
  }
  
  return Array.from(categories).sort();
}
