import {
  normalizeFromEventLike,
  normalizeShortcut as normalizeShortcutWithSpec,
  RESERVED_SHORTCUTS
} from '../../shared/shortcutSpec.js';

export function normalizeFromEvent(event) {
  // Keyboard events and imported strings go through the same shared spec
  // so duplicate detection, persistence, and runtime lookup stay aligned.
  return normalizeFromEventLike(event);
}

export function normalizeShortcutString(shortcutString) {
  return normalizeShortcutWithSpec(shortcutString);
}

export function isReservedShortcut(shortcut) {
  return RESERVED_SHORTCUTS.includes(shortcut);
}
