/**
 * Shortcut Normalizer Utility
 * Transforms raw keyboard input into canonical format
 * 
 * Canonical format rules:
 * - Modifiers in order: Ctrl, Alt, Shift, Meta
 * - Main key last
 * - Single letters uppercase
 * - Named keys in standard casing (Enter, Escape, Tab, etc.)
 * - Joined with '+'
 */

import { MODIFIER_ORDER, KEY_ALIASES } from '../config/constants.js';

// Set of modifier keys for quick lookup
const MODIFIERS = new Set(['ctrl', 'alt', 'shift', 'meta', 'control', 'cmd', 'command', 'option', 'win', 'windows']);

/**
 * Normalize a single key to its canonical form
 * @param {string} key - Raw key string
 * @returns {string} Normalized key
 */
function normalizeKey(key) {
  const lowered = key.toLowerCase().trim();
  
  // Check for alias mapping
  if (KEY_ALIASES[lowered]) {
    return KEY_ALIASES[lowered];
  }
  
  // Single letter - uppercase
  if (lowered.length === 1 && /[a-z]/.test(lowered)) {
    return lowered.toUpperCase();
  }
  
  // Single digit - return as is
  if (lowered.length === 1 && /[0-9]/.test(lowered)) {
    return lowered;
  }
  
  // Function keys - normalize casing
  if (/^f([1-9]|1[0-2])$/i.test(lowered)) {
    return lowered.toUpperCase();
  }
  
  // Standard named keys - capitalize first letter
  const standardKeys = {
    'enter': 'Enter',
    'escape': 'Escape',
    'tab': 'Tab',
    'backspace': 'Backspace',
    'delete': 'Delete',
    'insert': 'Insert',
    'home': 'Home',
    'end': 'End',
    'pageup': 'PageUp',
    'pagedown': 'PageDown',
    'arrowup': 'ArrowUp',
    'arrowdown': 'ArrowDown',
    'arrowleft': 'ArrowLeft',
    'arrowright': 'ArrowRight',
    'space': 'Space',
    'capslock': 'CapsLock',
    'numlock': 'NumLock',
    'scrolllock': 'ScrollLock',
    'pause': 'Pause',
    'printscreen': 'PrintScreen'
  };
  
  if (standardKeys[lowered]) {
    return standardKeys[lowered];
  }
  
  // Return as-is with first letter capitalized for unknown keys
  return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
}

/**
 * Check if a key is a modifier
 * @param {string} key - Key to check
 * @returns {boolean} True if modifier
 */
function isModifier(key) {
  const lowered = key.toLowerCase().trim();
  return MODIFIERS.has(lowered);
}

/**
 * Normalize a shortcut string to canonical format
 * @param {string} shortcutString - Raw shortcut string (e.g., "ctrl+s", "S + CTRL")
 * @returns {{ normalized: string, valid: boolean, error: string | null }}
 */
export function normalizeShortcut(shortcutString) {
  if (!shortcutString || typeof shortcutString !== 'string') {
    return { normalized: '', valid: false, error: 'Shortcut is required' };
  }
  
  // Trim and split by + or spaces
  const trimmed = shortcutString.trim();
  if (!trimmed) {
    return { normalized: '', valid: false, error: 'Shortcut is required' };
  }
  
  // Split by + (with optional surrounding whitespace)
  const parts = trimmed.split(/\s*\+\s*/).filter(p => p.length > 0);
  
  if (parts.length === 0) {
    return { normalized: '', valid: false, error: 'Invalid shortcut format' };
  }
  
  const modifiers = {
    Ctrl: false,
    Alt: false,
    Shift: false,
    Meta: false
  };
  
  let mainKey = null;
  const seenKeys = new Set();
  
  for (const part of parts) {
    const normalized = normalizeKey(part);
    
    // Check for duplicate keys
    if (seenKeys.has(normalized.toLowerCase())) {
      return { normalized: '', valid: false, error: `Duplicate key: ${normalized}` };
    }
    seenKeys.add(normalized.toLowerCase());
    
    // Categorize as modifier or main key
    if (normalized === 'Ctrl' || part.toLowerCase() === 'control') {
      modifiers.Ctrl = true;
    } else if (normalized === 'Alt' || part.toLowerCase() === 'option') {
      modifiers.Alt = true;
    } else if (normalized === 'Shift') {
      modifiers.Shift = true;
    } else if (normalized === 'Meta' || ['cmd', 'command', 'win', 'windows'].includes(part.toLowerCase())) {
      modifiers.Meta = true;
    } else {
      // Non-modifier key
      if (mainKey !== null) {
        // Multiple main keys - only allow one
        return { normalized: '', valid: false, error: 'Only one non-modifier key allowed' };
      }
      mainKey = normalized;
    }
  }
  
  // Validate: must have at least one non-modifier key
  if (mainKey === null) {
    return { normalized: '', valid: false, error: 'Shortcut must include a non-modifier key' };
  }
  
  // Build normalized string in standard order
  const result = [];
  for (const mod of MODIFIER_ORDER) {
    if (modifiers[mod]) {
      result.push(mod);
    }
  }
  result.push(mainKey);
  
  return {
    normalized: result.join('+'),
    valid: true,
    error: null
  };
}

/**
 * Normalize from keyboard event data
 * @param {Object} eventData - Object with ctrlKey, altKey, shiftKey, metaKey, key
 * @returns {{ normalized: string, valid: boolean, error: string | null }}
 */
export function normalizeFromEvent(eventData) {
  const { ctrlKey, altKey, shiftKey, metaKey, key } = eventData;
  
  // Check if key is a modifier-only press
  const modifierKeys = ['Control', 'Alt', 'Shift', 'Meta'];
  if (modifierKeys.includes(key)) {
    return { normalized: '', valid: false, error: 'Shortcut must include a non-modifier key' };
  }
  
  const parts = [];
  if (ctrlKey) parts.push('Ctrl');
  if (altKey) parts.push('Alt');
  if (shiftKey) parts.push('Shift');
  if (metaKey) parts.push('Meta');
  
  const normalizedKey = normalizeKey(key);
  parts.push(normalizedKey);
  
  return {
    normalized: parts.join('+'),
    valid: true,
    error: null
  };
}
