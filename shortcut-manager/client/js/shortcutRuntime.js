/**
 * Shortcut Runtime Module
 * Listens for runtime key presses and executes matching shortcuts
 */

import { normalizeFromEvent } from './shortcutNormalizer.js';
import { lookupShortcut, isCapturing } from './state.js';
import { executeAction } from './actionExecutor.js';
import { isCaptureActive } from './shortcutCapture.js';

let onExecuteCallback = null;
let isActive = true;

/**
 * Initialize the runtime listener
 * @param {Function} onExecute - Callback when shortcut is executed
 */
export function initRuntime(onExecute) {
  onExecuteCallback = onExecute;
  
  // Listen for keydown events at document level
  document.addEventListener('keydown', handleKeyDown, true);
}

/**
 * Handle keydown events for runtime execution
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleKeyDown(event) {
  // Don't execute if runtime is disabled
  if (!isActive) return;
  
  // Don't execute if capture is active
  if (isCaptureActive()) return;
  
  // Don't execute if typing in text inputs (except the capture field)
  const target = event.target;
  const tagName = target?.tagName ? target.tagName.toLowerCase() : '';
  const isEditable = Boolean(target?.isContentEditable);
  const isInput = tagName === 'input' || tagName === 'textarea' || isEditable;
  
  // Allow runtime execution on capture field (it's readonly)
  const isCaptureField = target?.id === 'shortcut-capture';
  
  if (isInput && !isCaptureField) {
    return;
  }
  
  // Normalize the pressed keys
  const result = normalizeFromEvent(event);
  
  if (!result.valid) return;
  
  // Runtime lookup uses the prebuilt Map so the key press path stays fast
  // even as the saved shortcut list grows.
  const shortcut = lookupShortcut(result.normalized);
  
  if (shortcut && shortcut.enabled) {
    // Prevent default browser behavior
    event.preventDefault();
    event.stopPropagation();
    
    // Execute the action
    const execResult = executeAction(shortcut.action, shortcut);
    
    // Notify callback
    if (onExecuteCallback) {
      onExecuteCallback({
        shortcut,
        normalizedKeys: result.normalized,
        result: execResult
      });
    }
  }
}

/**
 * Enable runtime shortcut execution
 */
export function enableRuntime() {
  isActive = true;
}

/**
 * Disable runtime shortcut execution
 */
export function disableRuntime() {
  isActive = false;
}

/**
 * Check if runtime is active
 * @returns {boolean} True if active
 */
export function isRuntimeActive() {
  return isActive;
}

/**
 * Remove runtime listener (cleanup)
 */
export function destroyRuntime() {
  document.removeEventListener('keydown', handleKeyDown, true);
}
