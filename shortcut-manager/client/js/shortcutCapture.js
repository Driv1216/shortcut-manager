/**
 * Shortcut Capture Module
 * Handles live keyboard capture for shortcut recording
 */

import { normalizeFromEvent } from './shortcutNormalizer.js';
import { setCapturing } from './state.js';

let captureField = null;
let onCaptureCallback = null;
let isCapturing = false;

/**
 * Initialize the capture module
 * @param {HTMLElement} field - The capture input field
 * @param {Function} onCapture - Callback when shortcut is captured
 */
export function initCapture(field, onCapture) {
  captureField = field;
  onCaptureCallback = onCapture;
  
  // Handle focus
  captureField.addEventListener('focus', handleFocus);
  captureField.addEventListener('blur', handleBlur);
  captureField.addEventListener('keydown', handleKeyDown);
  
  // Prevent default text input behavior
  captureField.addEventListener('keyup', (e) => {
    if (isCapturing) {
      e.preventDefault();
    }
  });
}

/**
 * Handle focus on capture field
 */
function handleFocus() {
  isCapturing = true;
  setCapturing(true);
  captureField.classList.add('capturing');
}

/**
 * Handle blur from capture field
 */
function handleBlur() {
  isCapturing = false;
  setCapturing(false);
  captureField.classList.remove('capturing');
}

/**
 * Handle keydown during capture
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleKeyDown(event) {
  if (!isCapturing) return;
  
  // Prevent default browser behavior
  event.preventDefault();
  event.stopPropagation();
  
  // Normalize the key combination
  const result = normalizeFromEvent(event);
  
  if (result.valid) {
    // Update the field value
    captureField.value = result.normalized;
    
    // Call the callback with result
    if (onCaptureCallback) {
      onCaptureCallback(result);
    }
  }
}

/**
 * Clear the capture field
 */
export function clearCapture() {
  if (captureField) {
    captureField.value = '';
  }
}

/**
 * Set the capture field value programmatically
 * @param {string} value - The value to set
 */
export function setCaptureValue(value) {
  if (captureField) {
    captureField.value = value;
  }
}

/**
 * Check if capture is currently active
 * @returns {boolean} True if capturing
 */
export function isCaptureActive() {
  return isCapturing;
}

/**
 * Stop capturing and blur the field
 */
export function stopCapture() {
  if (captureField) {
    captureField.blur();
  }
}
