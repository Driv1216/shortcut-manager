/**
 * Import/Export Module
 * Client-side import/export interaction handlers
 */

import * as api from './api.js';
import { validateImportJson } from './validation.js';
import { getShortcuts } from './state.js';

/**
 * Export shortcuts to a downloadable JSON file
 * @param {Array} shortcuts - Shortcuts to export
 */
export function downloadExport(shortcuts) {
  const json = JSON.stringify(shortcuts, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `shortcuts-${formatDate(new Date())}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format date for filename
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Handle export button click
 * @returns {Promise<{ success: boolean, message: string, count?: number }>}
 */
export async function handleExport() {
  try {
    const response = await api.exportShortcuts();
    const shortcuts = response.data || [];
    
    if (shortcuts.length === 0) {
      return { success: false, message: 'There are no shortcuts to export yet.' };
    }
    
    downloadExport(shortcuts);
    
    return {
      success: true,
      message: `Exported ${shortcuts.length} shortcut${shortcuts.length === 1 ? '' : 's'} to JSON.`,
      count: shortcuts.length
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Export could not be completed.'
    };
  }
}

/**
 * Handle import submission
 * @param {string} jsonString - JSON string to import
 * @returns {Promise<{ success: boolean, message: string, errors?: string[], count?: number }>}
 */
export async function handleImport(jsonString) {
  // Validate JSON first
  const validation = validateImportJson(jsonString, getShortcuts());
  
  if (!validation.valid) {
    return {
      success: false,
      message: 'Import validation failed.',
      errors: validation.errors
    };
  }
  
  try {
    const result = await api.importShortcuts(validation.data);
    
    return {
      success: true,
      message: result.message,
      count: result.data ? result.data.length : 0,
      warnings: result.warnings || []
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Import could not be completed.',
      errors: error.errors || []
    };
  }
}

/**
 * Read a file and return its contents
 * @param {File} file - File to read
 * @returns {Promise<string>} File contents
 */
export function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}
