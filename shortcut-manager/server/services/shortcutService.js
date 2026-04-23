/**
 * Shortcut service with validation, duplicate checks, persistence, and history.
 */

import * as storageService from './storageService.js';
import * as historyService from './historyService.js';
import { isDuplicate, validateImportDuplicates } from './duplicateService.js';
import { rebuildRuntimeIndex, removeFromRuntimeIndex, updateRuntimeIndex } from './runtimeIndexService.js';
import { validateImport, validateShortcut } from '../utils/validators.js';
import { generateId } from '../utils/idGenerator.js';

export async function getAll(options = {}) {
  let shortcuts = await storageService.getAllShortcuts();
  const { search, category, enabled, sort } = options;

  if (search) {
    const searchLower = search.toLowerCase();
    shortcuts = shortcuts.filter((shortcut) =>
      shortcut.action.toLowerCase().includes(searchLower) ||
      shortcut.keys.toLowerCase().includes(searchLower) ||
      shortcut.normalizedKeys.toLowerCase().includes(searchLower) ||
      (shortcut.category && shortcut.category.toLowerCase().includes(searchLower)) ||
      (shortcut.description && shortcut.description.toLowerCase().includes(searchLower))
    );
  }

  if (category) {
    shortcuts = shortcuts.filter((shortcut) => shortcut.category === category);
  }

  if (enabled !== undefined) {
    const enabledBool = enabled === 'true' || enabled === true;
    shortcuts = shortcuts.filter((shortcut) => shortcut.enabled === enabledBool);
  }

  switch (sort) {
    case 'action_asc':
      shortcuts.sort((a, b) => a.action.localeCompare(b.action));
      break;
    case 'action_desc':
      shortcuts.sort((a, b) => b.action.localeCompare(a.action));
      break;
    case 'shortcut_asc':
      shortcuts.sort((a, b) => a.normalizedKeys.localeCompare(b.normalizedKeys));
      break;
    case 'shortcut_desc':
      shortcuts.sort((a, b) => b.normalizedKeys.localeCompare(a.normalizedKeys));
      break;
    case 'updated_desc':
      shortcuts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      break;
    case 'created_desc':
      shortcuts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    default:
      shortcuts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  return shortcuts;
}

export async function getById(id) {
  return storageService.getShortcutById(id);
}

export async function create(data) {
  const validation = validateShortcut(data);

  if (!validation.valid) {
    return {
      success: false,
      message: validation.errors.join(', '),
      errors: validation.errors
    };
  }

  const { normalizedData } = validation;

  if (await isDuplicate(normalizedData.normalizedKeys)) {
    return {
      success: false,
      message: `${normalizedData.normalizedKeys} is already assigned to another shortcut.`,
      errors: [`${normalizedData.normalizedKeys} is already assigned to another shortcut`]
    };
  }

  const now = new Date().toISOString();
  const shortcut = {
    id: generateId(),
    ...normalizedData,
    createdAt: now,
    updatedAt: now
  };

  await storageService.addShortcut(shortcut);
  historyService.recordCreate(shortcut);
  await rebuildRuntimeIndex();

  return {
    success: true,
    message: 'Shortcut created.',
    data: shortcut,
    warnings: validation.warnings
  };
}

export async function update(id, data) {
  const existing = await storageService.getShortcutById(id);

  if (!existing) {
    return {
      success: false,
      message: 'Shortcut not found',
      errors: ['Shortcut not found']
    };
  }

  const validation = validateShortcut(data);

  if (!validation.valid) {
    return {
      success: false,
      message: validation.errors.join(', '),
      errors: validation.errors
    };
  }

  const { normalizedData } = validation;

  if (await isDuplicate(normalizedData.normalizedKeys, id)) {
    return {
      success: false,
      message: `${normalizedData.normalizedKeys} is already assigned to another shortcut.`,
      errors: [`${normalizedData.normalizedKeys} is already assigned to another shortcut`]
    };
  }

  const updated = {
    ...existing,
    ...normalizedData,
    updatedAt: new Date().toISOString()
  };

  await storageService.updateShortcut(id, updated);
  historyService.recordUpdate(existing, updated);
  updateRuntimeIndex(existing, updated);

  return {
    success: true,
    message: 'Shortcut updated.',
    data: updated,
    warnings: validation.warnings
  };
}

export async function remove(id) {
  const existing = await storageService.getShortcutById(id);

  if (!existing) {
    return {
      success: false,
      message: 'Shortcut not found',
      errors: ['Shortcut not found']
    };
  }

  await storageService.deleteShortcut(id);
  historyService.recordDelete(existing);
  removeFromRuntimeIndex(existing.normalizedKeys);

  return {
    success: true,
    message: 'Shortcut deleted successfully',
    data: existing
  };
}

export async function toggleEnabled(id) {
  const existing = await storageService.getShortcutById(id);

  if (!existing) {
    return {
      success: false,
      message: 'Shortcut not found',
      errors: ['Shortcut not found']
    };
  }

  const updated = {
    ...existing,
    enabled: !existing.enabled,
    updatedAt: new Date().toISOString()
  };

  await storageService.updateShortcut(id, updated);
  historyService.recordToggle(existing, updated);
  updateRuntimeIndex(existing, updated);

  return {
    success: true,
    message: `Shortcut ${updated.enabled ? 'enabled' : 'disabled'} successfully`,
    data: updated
  };
}

export async function importShortcuts(data) {
  const validation = validateImport(data);

  if (!validation.valid) {
    return {
      success: false,
      message: 'Import validation failed',
      errors: validation.errors
    };
  }

  const duplicateResult = await validateImportDuplicates(validation.validShortcuts);

  if (!duplicateResult.valid) {
    return {
      success: false,
      message: 'Import contains duplicate shortcuts',
      errors: duplicateResult.errors
    };
  }

  const beforeImport = await storageService.getAllShortcuts();
  const now = new Date().toISOString();
  const importedShortcuts = validation.validShortcuts.map((shortcut) => ({
    id: generateId(),
    ...shortcut,
    createdAt: now,
    updatedAt: now
  }));
  const afterImport = [...beforeImport, ...importedShortcuts];

  await storageService.replaceAllShortcuts(afterImport);
  historyService.recordImport(beforeImport, afterImport);
  await rebuildRuntimeIndex();

  return {
    success: true,
    message: `Successfully imported ${importedShortcuts.length} shortcut${importedShortcuts.length === 1 ? '' : 's'}`,
    data: importedShortcuts,
    warnings: validation.warnings
  };
}

export async function exportShortcuts() {
  return storageService.getAllShortcuts();
}

export async function getCategories() {
  const shortcuts = await storageService.getAllShortcuts();
  const categories = new Set();

  shortcuts.forEach((shortcut) => {
    if (shortcut.category) {
      categories.add(shortcut.category);
    }
  });

  return Array.from(categories).sort();
}
