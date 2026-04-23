/**
 * Storage Service
 * Handles JSON file persistence for shortcuts
 * Abstracted so it can later be switched to MongoDB with minimal changes
 */

import { DATA_FILE_PATH } from '../config/constants.js';
import { readJsonFile, writeJsonFile, fileExists, ensureDirectory } from '../utils/fileHelpers.js';

/**
 * Ensure the data file exists with valid structure
 */
export async function ensureDataFile() {
  const exists = await fileExists(DATA_FILE_PATH);
  if (!exists) {
    await writeJsonFile(DATA_FILE_PATH, []);
  } else {
    // Validate existing file is valid JSON array
    try {
      const data = await readJsonFile(DATA_FILE_PATH);
      if (!Array.isArray(data)) {
        console.warn('Data file was not an array, resetting...');
        await writeJsonFile(DATA_FILE_PATH, []);
      }
    } catch (error) {
      console.warn('Data file was malformed, resetting...');
      await writeJsonFile(DATA_FILE_PATH, []);
    }
  }
}

/**
 * Get all shortcuts from storage
 * @returns {Promise<Array>} Array of shortcut records
 */
export async function getAllShortcuts() {
  const data = await readJsonFile(DATA_FILE_PATH);
  return Array.isArray(data) ? data : [];
}

/**
 * Get a single shortcut by ID
 * @param {string} id - Shortcut ID
 * @returns {Promise<Object|null>} Shortcut record or null
 */
export async function getShortcutById(id) {
  const shortcuts = await getAllShortcuts();
  return shortcuts.find(s => s.id === id) || null;
}

/**
 * Save all shortcuts to storage
 * @param {Array} shortcuts - Array of shortcut records
 */
export async function saveAllShortcuts(shortcuts) {
  await writeJsonFile(DATA_FILE_PATH, shortcuts);
}

/**
 * Add a new shortcut
 * @param {Object} shortcut - Shortcut record to add
 * @returns {Promise<Object>} Added shortcut
 */
export async function addShortcut(shortcut) {
  const shortcuts = await getAllShortcuts();
  shortcuts.push(shortcut);
  await saveAllShortcuts(shortcuts);
  return shortcut;
}

/**
 * Update an existing shortcut
 * @param {string} id - Shortcut ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated shortcut or null if not found
 */
export async function updateShortcut(id, updates) {
  const shortcuts = await getAllShortcuts();
  const index = shortcuts.findIndex(s => s.id === id);
  
  if (index === -1) {
    return null;
  }
  
  shortcuts[index] = { ...shortcuts[index], ...updates };
  await saveAllShortcuts(shortcuts);
  return shortcuts[index];
}

/**
 * Delete a shortcut
 * @param {string} id - Shortcut ID
 * @returns {Promise<Object|null>} Deleted shortcut or null if not found
 */
export async function deleteShortcut(id) {
  const shortcuts = await getAllShortcuts();
  const index = shortcuts.findIndex(s => s.id === id);
  
  if (index === -1) {
    return null;
  }
  
  const deleted = shortcuts.splice(index, 1)[0];
  await saveAllShortcuts(shortcuts);
  return deleted;
}

/**
 * Replace all shortcuts (for import)
 * @param {Array} shortcuts - New shortcuts array
 */
export async function replaceAllShortcuts(shortcuts) {
  await saveAllShortcuts(shortcuts);
}
