/**
 * Set-backed duplicate detection for normalized shortcut keys.
 */

import { getAllShortcuts } from './storageService.js';

export async function buildDuplicateSet(excludeId = null) {
  const shortcuts = await getAllShortcuts();
  const normalizedKeys = new Set();

  shortcuts.forEach((shortcut) => {
    if (excludeId && shortcut.id === excludeId) {
      return;
    }

    if (shortcut.normalizedKeys) {
      normalizedKeys.add(shortcut.normalizedKeys);
    }
  });

  return normalizedKeys;
}

export async function isDuplicate(normalizedKey, excludeId = null) {
  const normalizedKeys = await buildDuplicateSet(excludeId);
  return normalizedKeys.has(normalizedKey);
}

export async function validateImportDuplicates(importData) {
  const existingKeys = await buildDuplicateSet();
  const duplicates = [];

  importData.forEach((shortcut, index) => {
    if (existingKeys.has(shortcut.normalizedKeys)) {
      duplicates.push(
        `Item ${index + 1}: Shortcut already exists in library: ${shortcut.normalizedKeys}`
      );
    }
  });

  return {
    valid: duplicates.length === 0,
    errors: duplicates
  };
}
