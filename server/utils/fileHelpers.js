/**
 * File Helper Utilities
 * Safe file read/write operations
 */

import { promises as fs } from 'fs';
import { dirname } from 'path';

/**
 * Ensure a directory exists, creating it if necessary
 * @param {string} filePath - Path to the file (directory will be extracted)
 */
export async function ensureDirectory(filePath) {
  const dir = dirname(filePath);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Safely read JSON from a file
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<any>} Parsed JSON content
 */
export async function readJsonFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // File doesn't exist
    }
    if (error instanceof SyntaxError) {
      throw new Error('Malformed JSON file');
    }
    throw error;
  }
}

/**
 * Safely write JSON to a file with pretty formatting
 * @param {string} filePath - Path to the JSON file
 * @param {any} data - Data to write
 */
export async function writeJsonFile(filePath, data) {
  await ensureDirectory(filePath);
  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} True if file exists
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
