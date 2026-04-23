/**
 * Runtime Index Service
 * Maintains a Hash Map / Map for fast shortcut lookup during runtime execution
 */

import { getAllShortcuts } from './storageService.js';

// In-memory runtime index for fast lookups
let runtimeIndex = new Map();

/**
 * Build the runtime index from stored shortcuts
 * Only includes enabled shortcuts
 * @returns {Promise<Map>} The rebuilt runtime index
 */
export async function rebuildRuntimeIndex() {
  const shortcuts = await getAllShortcuts();
  runtimeIndex = new Map();
  
  for (const shortcut of shortcuts) {
    if (shortcut.enabled && shortcut.normalizedKeys) {
      runtimeIndex.set(shortcut.normalizedKeys, shortcut);
    }
  }
  
  return runtimeIndex;
}

/**
 * Get the current runtime index
 * @returns {Map} The runtime index map
 */
export function getRuntimeIndex() {
  return runtimeIndex;
}

/**
 * Lookup a shortcut by normalized key
 * @param {string} normalizedKey - The normalized shortcut key
 * @returns {Object|undefined} The shortcut object or undefined
 */
export function lookupShortcut(normalizedKey) {
  return runtimeIndex.get(normalizedKey);
}

/**
 * Add a shortcut to the runtime index
 * @param {Object} shortcut - The shortcut to add
 */
export function addToRuntimeIndex(shortcut) {
  if (shortcut.enabled && shortcut.normalizedKeys) {
    runtimeIndex.set(shortcut.normalizedKeys, shortcut);
  }
}

/**
 * Remove a shortcut from the runtime index
 * @param {string} normalizedKey - The normalized key to remove
 */
export function removeFromRuntimeIndex(normalizedKey) {
  runtimeIndex.delete(normalizedKey);
}

/**
 * Update a shortcut in the runtime index
 * @param {Object} oldShortcut - The old shortcut data
 * @param {Object} newShortcut - The new shortcut data
 */
export function updateRuntimeIndex(oldShortcut, newShortcut) {
  // Remove old key if it changed
  if (oldShortcut && oldShortcut.normalizedKeys) {
    runtimeIndex.delete(oldShortcut.normalizedKeys);
  }
  
  // Add new key if enabled
  if (newShortcut.enabled && newShortcut.normalizedKeys) {
    runtimeIndex.set(newShortcut.normalizedKeys, newShortcut);
  }
}

/**
 * Get all active shortcuts from the runtime index
 * @returns {Array} Array of active shortcut objects
 */
export function getActiveShortcuts() {
  return Array.from(runtimeIndex.values());
}

/**
 * Export runtime index as plain object for API response
 * @returns {Object} Plain object representation of the index
 */
export function exportRuntimeIndexAsObject() {
  const obj = {};
  for (const [key, value] of runtimeIndex) {
    obj[key] = value;
  }
  return obj;
}
