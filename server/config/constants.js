/**
 * Application constants and configuration
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Data file path
export const DATA_FILE_PATH = join(__dirname, '../data/shortcuts.json');

// Reserved browser shortcuts that may not work as expected
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

// Modifier key order for normalization
export const MODIFIER_ORDER = ['Ctrl', 'Alt', 'Shift', 'Meta'];

// Alias mappings for normalization
export const KEY_ALIASES = {
  'control': 'Ctrl',
  'ctrl': 'Ctrl',
  'cmd': 'Meta',
  'command': 'Meta',
  'meta': 'Meta',
  'win': 'Meta',
  'windows': 'Meta',
  'option': 'Alt',
  'alt': 'Alt',
  'shift': 'Shift',
  'esc': 'Escape',
  'escape': 'Escape',
  'return': 'Enter',
  'enter': 'Enter',
  'space': 'Space',
  ' ': 'Space',
  'del': 'Delete',
  'delete': 'Delete',
  'ins': 'Insert',
  'insert': 'Insert',
  'pgup': 'PageUp',
  'pageup': 'PageUp',
  'pgdn': 'PageDown',
  'pagedown': 'PageDown',
  'arrowup': 'ArrowUp',
  'arrowdown': 'ArrowDown',
  'arrowleft': 'ArrowLeft',
  'arrowright': 'ArrowRight',
  'backspace': 'Backspace',
  'tab': 'Tab'
};

// Default categories
export const DEFAULT_CATEGORIES = [
  'File',
  'Edit',
  'View',
  'Navigation',
  'Tools',
  'Help',
  'Custom'
];

// Maximum history stack size
export const MAX_HISTORY_SIZE = 50;
