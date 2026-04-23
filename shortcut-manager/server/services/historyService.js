/**
 * Stack-based undo/redo history service.
 */

import { MAX_HISTORY_SIZE } from '../config/constants.js';
import * as storageService from './storageService.js';
import { rebuildRuntimeIndex } from './runtimeIndexService.js';

const undoStack = [];
const redoStack = [];

function getOperationLabel(type) {
  const labels = {
    create: 'shortcut creation',
    delete: 'shortcut deletion',
    update: 'shortcut edit',
    toggle: 'status change',
    import: 'shortcut import'
  };

  return labels[type] || type;
}

function cloneRecord(record) {
  return record ? { ...record } : null;
}

function cloneRecords(records = []) {
  return records.map((record) => ({ ...record }));
}

function pushUndo(operation) {
  undoStack.push(operation);

  while (undoStack.length > MAX_HISTORY_SIZE) {
    undoStack.shift();
  }

  redoStack.length = 0;
}

async function writeSnapshot(shortcuts) {
  // Import undo/redo restores the full persisted list in one write.
  await storageService.replaceAllShortcuts(cloneRecords(shortcuts));
  await rebuildRuntimeIndex();
}

export function recordCreate(item) {
  pushUndo({
    type: 'create',
    item: cloneRecord(item)
  });
}

export function recordDelete(item) {
  pushUndo({
    type: 'delete',
    item: cloneRecord(item)
  });
}

export function recordUpdate(before, after) {
  pushUndo({
    type: 'update',
    before: cloneRecord(before),
    after: cloneRecord(after)
  });
}

export function recordToggle(before, after) {
  pushUndo({
    type: 'toggle',
    before: cloneRecord(before),
    after: cloneRecord(after)
  });
}

export function recordImport(before, after) {
  pushUndo({
    type: 'import',
    before: cloneRecords(before),
    after: cloneRecords(after)
  });
}

async function applyUndo(operation) {
  switch (operation.type) {
    case 'create':
      await storageService.deleteShortcut(operation.item.id);
      break;
    case 'delete':
      await storageService.addShortcut(operation.item);
      break;
    case 'update':
    case 'toggle':
      await storageService.updateShortcut(operation.before.id, operation.before);
      break;
    case 'import':
      await writeSnapshot(operation.before);
      return;
    default:
      throw new Error(`Unsupported undo operation: ${operation.type}`);
  }

  await rebuildRuntimeIndex();
}

async function applyRedo(operation) {
  switch (operation.type) {
    case 'create':
      await storageService.addShortcut(operation.item);
      break;
    case 'delete':
      await storageService.deleteShortcut(operation.item.id);
      break;
    case 'update':
    case 'toggle':
      await storageService.updateShortcut(operation.after.id, operation.after);
      break;
    case 'import':
      await writeSnapshot(operation.after);
      return;
    default:
      throw new Error(`Unsupported redo operation: ${operation.type}`);
  }

  await rebuildRuntimeIndex();
}

export async function undo() {
  if (undoStack.length === 0) {
    return { success: false, message: 'There is nothing to undo right now.', operation: null };
  }

  const operation = undoStack.pop();

  try {
    await applyUndo(operation);
    redoStack.push(operation);

    return {
      success: true,
      message: `Reverted the last ${getOperationLabel(operation.type)}.`,
      operation
    };
  } catch (error) {
    undoStack.push(operation);
    throw error;
  }
}

export async function redo() {
  if (redoStack.length === 0) {
    return { success: false, message: 'There is nothing to redo right now.', operation: null };
  }

  const operation = redoStack.pop();

  try {
    await applyRedo(operation);
    undoStack.push(operation);

    return {
      success: true,
      message: `Reapplied the last ${getOperationLabel(operation.type)}.`,
      operation
    };
  } catch (error) {
    redoStack.push(operation);
    throw error;
  }
}

export function getHistoryStatus() {
  return {
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoCount: undoStack.length,
    redoCount: redoStack.length
  };
}

export function clearHistory() {
  undoStack.length = 0;
  redoStack.length = 0;
}
