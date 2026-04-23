/**
 * Validation utilities for shortcut payloads and imports.
 */

import { RESERVED_SHORTCUTS } from '../config/constants.js';
import { normalizeShortcut } from './normalizer.js';

const ACTION_MAX_LENGTH = 80;
const CATEGORY_MAX_LENGTH = 30;
const DESCRIPTION_MAX_LENGTH = 200;

function coerceBoolean(value, defaultValue = true) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return defaultValue;
}

function sanitizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateShortcut(data) {
  const errors = [];
  const warnings = [];

  const action = sanitizeText(data?.action);
  const rawKeys = sanitizeText(data?.keys);
  const category = sanitizeText(data?.category) || 'Custom';
  const description = sanitizeText(data?.description);
  const enabled = coerceBoolean(data?.enabled, true);

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

  if (!rawKeys) {
    errors.push('Shortcut keys are required');
  }

  if (category.length > CATEGORY_MAX_LENGTH) {
    errors.push(`Category must be ${CATEGORY_MAX_LENGTH} characters or fewer`);
  }

  if (description.length > DESCRIPTION_MAX_LENGTH) {
    errors.push(`Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer`);
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings, normalizedData: null };
  }

  const normalizedShortcut = normalizeShortcut(rawKeys);

  if (!normalizedShortcut.valid) {
    return {
      valid: false,
      errors: [normalizedShortcut.error],
      warnings,
      normalizedData: null
    };
  }

  if (RESERVED_SHORTCUTS.includes(normalizedShortcut.normalized)) {
    warnings.push(
      `${normalizedShortcut.normalized} can be saved, but the browser may still intercept it first. Runtime behavior can vary by browser.`
    );
  }

  return {
    valid: true,
    errors,
    warnings,
    normalizedData: {
      action,
      keys: normalizedShortcut.normalized,
      normalizedKeys: normalizedShortcut.normalized,
      category,
      description,
      enabled
    }
  };
}

export function validateImport(data) {
  const errors = [];
  const warnings = [];
  const validShortcuts = [];
  const seenKeys = new Set();

  if (!Array.isArray(data)) {
    return {
      valid: false,
      errors: ['Import data must be a JSON array of shortcuts'],
      warnings,
      validShortcuts
    };
  }

  if (data.length === 0) {
    return {
      valid: false,
      errors: ['The import file is empty'],
      warnings,
      validShortcuts
    };
  }

  data.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`Item ${index + 1}: Invalid shortcut object`);
      return;
    }

    const result = validateShortcut(item);

    if (!result.valid) {
      errors.push(`Item ${index + 1}: ${result.errors.join(', ')}`);
      return;
    }

    const normalizedKey = result.normalizedData.normalizedKeys;

    if (seenKeys.has(normalizedKey)) {
      errors.push(`Item ${index + 1}: Duplicate shortcut in import batch: ${normalizedKey}`);
      return;
    }

    seenKeys.add(normalizedKey);
    validShortcuts.push(result.normalizedData);
    warnings.push(...result.warnings.map((warning) => `Item ${index + 1}: ${warning}`));
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    validShortcuts: errors.length === 0 ? validShortcuts : []
  };
}
