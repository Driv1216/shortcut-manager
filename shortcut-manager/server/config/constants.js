import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MODIFIER_ORDER, RESERVED_SHORTCUTS } from '../../shared/shortcutSpec.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const DATA_FILE_PATH = join(__dirname, '../data/shortcuts.json');

export const DEFAULT_CATEGORIES = [
  'File',
  'Edit',
  'View',
  'Navigation',
  'Tools',
  'Help',
  'Custom'
];

export const MAX_HISTORY_SIZE = 50;

export { MODIFIER_ORDER, RESERVED_SHORTCUTS };
