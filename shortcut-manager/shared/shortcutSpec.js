export const MODIFIER_ORDER = ['Ctrl', 'Alt', 'Shift', 'Meta'];

export const RESERVED_SHORTCUTS = [
  'Ctrl+R',
  'Ctrl+T',
  'Ctrl+W',
  'Ctrl+N',
  'Ctrl+L',
  'Ctrl+Q',
  'Ctrl+Tab',
  'Ctrl+Shift+Tab',
  'Alt+F4',
  'F5',
  'F11',
  'F12'
];

const MODIFIER_ALIASES = {
  ctrl: 'Ctrl',
  control: 'Ctrl',
  alt: 'Alt',
  option: 'Alt',
  shift: 'Shift',
  meta: 'Meta',
  cmd: 'Meta',
  command: 'Meta',
  win: 'Meta',
  windows: 'Meta'
};

const KEY_ALIASES = {
  esc: 'Escape',
  escape: 'Escape',
  return: 'Enter',
  enter: 'Enter',
  del: 'Delete',
  delete: 'Delete',
  ins: 'Insert',
  insert: 'Insert',
  pgup: 'PageUp',
  pageup: 'PageUp',
  pgdn: 'PageDown',
  pagedown: 'PageDown',
  backspace: 'Backspace',
  tab: 'Tab',
  home: 'Home',
  end: 'End',
  capslock: 'CapsLock',
  numlock: 'NumLock',
  scrolllock: 'ScrollLock',
  pause: 'Pause',
  printscreen: 'PrintScreen',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  space: 'Space',
  ' ': 'Space'
};

const EVENT_MODIFIER_KEYS = new Set(['Control', 'Alt', 'Shift', 'Meta']);

function toTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function isModifierToken(value) {
  const lowered = toTrimmedString(value).toLowerCase();
  return Boolean(MODIFIER_ALIASES[lowered]);
}

export function normalizeKeyToken(value) {
  const raw = toTrimmedString(value);

  if (!raw) {
    return '';
  }

  const lowered = raw.toLowerCase();

  if (MODIFIER_ALIASES[lowered]) {
    return MODIFIER_ALIASES[lowered];
  }

  if (KEY_ALIASES[lowered]) {
    return KEY_ALIASES[lowered];
  }

  if (/^[a-z]$/i.test(raw)) {
    return raw.toUpperCase();
  }

  if (/^[0-9]$/.test(raw)) {
    return raw;
  }

  if (/^f([1-9]|1[0-9]|2[0-4])$/i.test(raw)) {
    return raw.toUpperCase();
  }

  if (/^[a-z][a-z0-9]*$/i.test(raw)) {
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }

  return raw;
}

function parseShortcutParts(shortcutString) {
  const raw = toTrimmedString(shortcutString);

  if (!raw) {
    return { valid: false, error: 'Shortcut is required', parts: [] };
  }

  const rawParts = raw.split('+');

  if (rawParts.some((part) => !part.trim())) {
    return { valid: false, error: 'Shortcut format is invalid', parts: [] };
  }

  return {
    valid: true,
    error: null,
    parts: rawParts.map((part) => part.trim())
  };
}

export function normalizeShortcut(shortcutString) {
  const parsed = parseShortcutParts(shortcutString);

  if (!parsed.valid) {
    return {
      normalized: '',
      valid: false,
      error: parsed.error,
      isReserved: false
    };
  }

  const modifiers = new Set();
  let mainKey = '';

  for (const part of parsed.parts) {
    const normalizedPart = normalizeKeyToken(part);

    if (!normalizedPart) {
      return {
        normalized: '',
        valid: false,
        error: 'Shortcut format is invalid',
        isReserved: false
      };
    }

    if (isModifierToken(part)) {
      if (modifiers.has(normalizedPart)) {
        return {
          normalized: '',
          valid: false,
          error: `Duplicate modifier: ${normalizedPart}`,
          isReserved: false
        };
      }

      modifiers.add(normalizedPart);
      continue;
    }

    if (mainKey) {
      return {
        normalized: '',
        valid: false,
        error: 'Shortcut must include exactly one non-modifier key',
        isReserved: false
      };
    }

    mainKey = normalizedPart;
  }

  if (!mainKey) {
    return {
      normalized: '',
      valid: false,
      error: 'Shortcut must include a non-modifier key',
      isReserved: false
    };
  }

  const orderedModifiers = MODIFIER_ORDER.filter((modifier) => modifiers.has(modifier));
  const normalized = [...orderedModifiers, mainKey].join('+');

  return {
    normalized,
    valid: true,
    error: null,
    isReserved: RESERVED_SHORTCUTS.includes(normalized)
  };
}

export function normalizeFromEventLike(eventLike) {
  const { ctrlKey, altKey, shiftKey, metaKey, key } = eventLike ?? {};

  if (!key || EVENT_MODIFIER_KEYS.has(key)) {
    return {
      normalized: '',
      valid: false,
      error: 'Shortcut must include a non-modifier key',
      isReserved: false
    };
  }

  const normalizedKey = normalizeKeyToken(key);

  if (!normalizedKey || MODIFIER_ORDER.includes(normalizedKey)) {
    return {
      normalized: '',
      valid: false,
      error: 'Shortcut must include a non-modifier key',
      isReserved: false
    };
  }

  const parts = [];

  if (ctrlKey) parts.push('Ctrl');
  if (altKey) parts.push('Alt');
  if (shiftKey) parts.push('Shift');
  if (metaKey) parts.push('Meta');

  parts.push(normalizedKey);

  const normalized = parts.join('+');

  return {
    normalized,
    valid: true,
    error: null,
    isReserved: RESERVED_SHORTCUTS.includes(normalized)
  };
}
