import {
  normalizeFromEventLike,
  normalizeKeyToken,
  normalizeShortcut as normalizeShortcutWithSpec,
  isModifierToken
} from '../../shared/shortcutSpec.js';

export function normalizeShortcut(shortcutString) {
  return normalizeShortcutWithSpec(shortcutString);
}

export function normalizeFromEvent(eventData) {
  return normalizeFromEventLike(eventData);
}

export { normalizeKeyToken, isModifierToken };
