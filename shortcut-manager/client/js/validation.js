/**
 * Client-side validation aligned with backend rules for fast feedback.
 */

import { normalizeShortcutString } from './shortcutNormalizer.js';

const ACTION_MAX_LENGTH = 80;
const CATEGORY_MAX_LENGTH = 30;
const DESCRIPTION_MAX_LENGTH = 200;

function sanitizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateShortcutKeys(keys, existingShortcuts = [], editingId = null) {
  const errors = [];
  const warnings = [];
  const shortcutResult = normalizeShortcutString(keys || '');

  if (!shortcutResult.valid) {
    errors.push(shortcutResult.error);
  } else {
    if (shortcutResult.isReserved) {
      warnings.push(
        `${shortcutResult.normalized} can be saved, but the browser may still intercept it first. Runtime behavior can vary by browser.`
      );
    }

    const duplicates = new Set(
      existingShortcuts
        .filter((shortcut) => !editingId || shortcut.id !== editingId)
        .map((shortcut) => shortcut.normalizedKeys)
    );

    if (duplicates.has(shortcutResult.normalized)) {
      errors.push(`${shortcutResult.normalized} is already assigned to another shortcut`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalizedKeys: shortcutResult.valid ? shortcutResult.normalized : ''
  };
}

export function validateShortcutForm(data, existingShortcuts = [], editingId = null) {
  const errors = [];
  const warnings = [];

  const action = sanitizeText(data?.action);
  const category = sanitizeText(data?.category) || 'Custom';
  const description = sanitizeText(data?.description);
  const keyValidation = validateShortcutKeys(data?.keys || '', existingShortcuts, editingId);

  if (!action) {
    errors.push('Action name is required');
  } else {
    if (action.length > ACTION_MAX_LENGTH) {
      errors.push(`Action name must be ${ACTION_MAX_LENGTH} characters or fewer`);
    }

    if (/[\r\n\t]/.test(action)) {
      errors.push('Action name must be a single line of text');
    }
  }

  if (category.length > CATEGORY_MAX_LENGTH) {
    errors.push(`Category must be ${CATEGORY_MAX_LENGTH} characters or fewer`);
  }

  if (description.length > DESCRIPTION_MAX_LENGTH) {
    errors.push(`Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer`);
  }

  errors.push(...keyValidation.errors);
  warnings.push(...keyValidation.warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalizedKeys: keyValidation.normalizedKeys
  };
}

export function validateImportJson(jsonString, existingShortcuts = []) {
  const errors = [];

  if (!jsonString || !jsonString.trim()) {
    return {
      valid: false,
      data: null,
      errors: ['Paste a JSON array or choose a JSON file to import']
    };
  }

  let parsed;

  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return {
      valid: false,
      data: null,
      errors: ['The JSON could not be parsed. Check for missing commas, quotes, or brackets and try again.']
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      valid: false,
      data: null,
      errors: ['Import data must be a JSON array of shortcut objects']
    };
  }

  if (parsed.length === 0) {
    return {
      valid: false,
      data: null,
      errors: ['The import file is empty']
    };
  }

  const batchSet = new Set();
  const existingSet = new Set(existingShortcuts.map((shortcut) => shortcut.normalizedKeys));

  parsed.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`Item ${index + 1}: Each entry must be a shortcut object`);
      return;
    }

    const validation = validateShortcutForm(item, [], null);

    if (!validation.valid) {
      errors.push(`Item ${index + 1}: ${validation.errors.join(', ')}`);
      return;
    }

    if (batchSet.has(validation.normalizedKeys)) {
      errors.push(`Item ${index + 1}: ${validation.normalizedKeys} appears more than once in this import`);
      return;
    }

    if (existingSet.has(validation.normalizedKeys)) {
      errors.push(`Item ${index + 1}: ${validation.normalizedKeys} already exists in the current library`);
      return;
    }

    batchSet.add(validation.normalizedKeys);
  });

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? parsed : null,
    errors
  };
}
