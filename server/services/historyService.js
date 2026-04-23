/**
 * History Service
 * Implements undo/redo using two stacks
 * Each operation descriptor contains enough info to reverse/reapply
 */

import { MAX_HISTORY_SIZE } from '../config/constants.js';
import * as storageService from './storageService.js';
import { rebuildRuntimeIndex } from './runtimeIndexService.js';

// Undo and Redo stacks
const undoStack = [];
const redoStack = [];

/**
 * Operation types
 */
export const OperationType = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  TOGGLE: 'TOGGLE',
  IMPORT: 'IMPORT'
};

/**
 * Push an operation to the undo stack
 * Clears redo stack when new operation is performed
 * @param {Object} operation - Operation descriptor
 */
export function pushUndo(operation) {
  undoStack.push(operation);
  
  // Limit stack size
  while (undoStack.length > MAX_HISTORY_SIZE) {
    undoStack.shift();
  }
  
  // Clear redo stack on new operation
  redoStack.length = 0;
}

/**
 * Record a create operation
 * @param {Object} shortcut - The created shortcut
 */
export function recordCreate(shortcut) {
  pushUndo({
    type: OperationType.CREATE,
    data: { shortcut: { ...shortcut } }
  });
}

/**
 * Record an update operation
 * @param {Object} previous - The shortcut before update
 * @param {Object} updated - The shortcut after update
 */
export function recordUpdate(previous, updated) {
  pushUndo({
    type: OperationType.UPDATE,
    data: {
      previous: { ...previous },
      updated: { ...updated }
    }
  });
}

/**
 * Record a delete operation
 * @param {Object} shortcut - The deleted shortcut
 */
export function recordDelete(shortcut) {
  pushUndo({
    type: OperationType.DELETE,
    data: { shortcut: { ...shortcut } }
  });
}

/**
 * Record a toggle operation
 * @param {Object} shortcut - The shortcut with toggled state
 * @param {boolean} previousEnabled - The previous enabled state
 */
export function recordToggle(shortcut, previousEnabled) {
  pushUndo({
    type: OperationType.TOGGLE,
    data: {
      shortcut: { ...shortcut },
      previousEnabled,
      newEnabled: !previousEnabled
    }
  });
}

/**
 * Record an import operation
 * @param {Array} importedShortcuts - The imported shortcuts
 * @param {Array} previousShortcuts - The shortcuts before import (if replacing)
 */
export function recordImport(importedShortcuts, previousShortcuts = null) {
  pushUndo({
    type: OperationType.IMPORT,
    data: {
      imported: importedShortcuts.map(s => ({ ...s })),
      previous: previousShortcuts ? previousShortcuts.map(s => ({ ...s })) : null
    }
  });
}

/**
 * Execute undo operation
 * @returns {Promise<{ success: boolean, message: string, operation: Object|null }>}
 */
export async function undo() {
  if (undoStack.length === 0) {
    return { success: false, message: 'Nothing to undo', operation: null };
  }
  
  const operation = undoStack.pop();
  
  try {
    switch (operation.type) {
      case OperationType.CREATE:
        // Undo create = delete the created shortcut
        await storageService.deleteShortcut(operation.data.shortcut.id);
        break;
        
      case OperationType.UPDATE:
        // Undo update = restore previous state
        await storageService.updateShortcut(
          operation.data.previous.id,
          operation.data.previous
        );
        break;
        
      case OperationType.DELETE:
        // Undo delete = recreate the shortcut
        await storageService.addShortcut(operation.data.shortcut);
        break;
        
      case OperationType.TOGGLE:
        // Undo toggle = restore previous enabled state
        await storageService.updateShortcut(operation.data.shortcut.id, {
          enabled: operation.data.previousEnabled,
          updatedAt: new Date().toISOString()
        });
        break;
        
      case OperationType.IMPORT:
        // Undo import = remove imported shortcuts
        if (operation.data.previous) {
          await storageService.replaceAllShortcuts(operation.data.previous);
        } else {
          const currentShortcuts = await storageService.getAllShortcuts();
          const importedIds = new Set(operation.data.imported.map(s => s.id));
          const filtered = currentShortcuts.filter(s => !importedIds.has(s.id));
          await storageService.replaceAllShortcuts(filtered);
        }
        break;
    }
    
    // Rebuild runtime index
    await rebuildRuntimeIndex();
    
    // Push to redo stack
    redoStack.push(operation);
    
    return {
      success: true,
      message: `Undid ${operation.type.toLowerCase()} operation`,
      operation
    };
  } catch (error) {
    // Restore operation to undo stack if failed
    undoStack.push(operation);
    throw error;
  }
}

/**
 * Execute redo operation
 * @returns {Promise<{ success: boolean, message: string, operation: Object|null }>}
 */
export async function redo() {
  if (redoStack.length === 0) {
    return { success: false, message: 'Nothing to redo', operation: null };
  }
  
  const operation = redoStack.pop();
  
  try {
    switch (operation.type) {
      case OperationType.CREATE:
        // Redo create = recreate the shortcut
        await storageService.addShortcut(operation.data.shortcut);
        break;
        
      case OperationType.UPDATE:
        // Redo update = apply the update again
        await storageService.updateShortcut(
          operation.data.updated.id,
          operation.data.updated
        );
        break;
        
      case OperationType.DELETE:
        // Redo delete = delete again
        await storageService.deleteShortcut(operation.data.shortcut.id);
        break;
        
      case OperationType.TOGGLE:
        // Redo toggle = apply new enabled state
        await storageService.updateShortcut(operation.data.shortcut.id, {
          enabled: operation.data.newEnabled,
          updatedAt: new Date().toISOString()
        });
        break;
        
      case OperationType.IMPORT:
        // Redo import = add imported shortcuts back
        const currentShortcuts = await storageService.getAllShortcuts();
        const combined = [...currentShortcuts, ...operation.data.imported];
        await storageService.replaceAllShortcuts(combined);
        break;
    }
    
    // Rebuild runtime index
    await rebuildRuntimeIndex();
    
    // Push back to undo stack
    undoStack.push(operation);
    
    return {
      success: true,
      message: `Redid ${operation.type.toLowerCase()} operation`,
      operation
    };
  } catch (error) {
    // Restore operation to redo stack if failed
    redoStack.push(operation);
    throw error;
  }
}

/**
 * Get current history status
 * @returns {Object} Status object with canUndo and canRedo
 */
export function getHistoryStatus() {
  return {
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoCount: undoStack.length,
    redoCount: redoStack.length
  };
}

/**
 * Clear all history (use with caution)
 */
export function clearHistory() {
  undoStack.length = 0;
  redoStack.length = 0;
}
