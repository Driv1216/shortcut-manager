/**
 * Undo/Redo Module
 * Frontend handlers for undo/redo operations
 */

import * as api from './api.js';
import { setHistoryStatus } from './state.js';

/**
 * Perform undo operation
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function performUndo() {
  try {
    const result = await api.undo();
    
    if (result.historyStatus) {
      setHistoryStatus(result.historyStatus);
    }
    
    return {
      success: result.success,
      message: result.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Undo could not be completed.'
    };
  }
}

/**
 * Perform redo operation
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function performRedo() {
  try {
    const result = await api.redo();
    
    if (result.historyStatus) {
      setHistoryStatus(result.historyStatus);
    }
    
    return {
      success: result.success,
      message: result.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Redo could not be completed.'
    };
  }
}

/**
 * Fetch and update history status
 * @returns {Promise<Object>} History status
 */
export async function refreshHistoryStatus() {
  try {
    const result = await api.getHistoryStatus();
    if (result.success && result.data) {
      setHistoryStatus(result.data);
      return result.data;
    }
  } catch (error) {
    console.error('Failed to fetch history status:', error);
  }
  return { canUndo: false, canRedo: false };
}
