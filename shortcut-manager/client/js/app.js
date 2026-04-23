/**
 * Shortcut Manager - Main Application
 * Bootstrap and wire all modules together
 */

import * as api from './api.js';
import * as state from './state.js';
import * as ui from './ui.js';
import { initCapture, clearCapture } from './shortcutCapture.js';
import { initRuntime } from './shortcutRuntime.js';
import { validateShortcutForm, validateShortcutKeys } from './validation.js';
import { handleExport, handleImport, readFile } from './importExport.js';
import { performUndo, performRedo } from './undoRedo.js';
import { initTheme, toggleThemeState } from './actionExecutor.js';

document.addEventListener('DOMContentLoaded', init);

async function init() {
  console.log('[v0] Shortcut Manager initializing...');

  initTheme();

  const elements = ui.initUI();

  initCapture(elements.captureField, handleShortcutCapture);
  initRuntime(handleShortcutExecution);

  bindEvents(elements);
  state.subscribe(handleStateChange);

  await loadShortcuts();

  console.log('[v0] Shortcut Manager initialized');
}

function bindEvents(elements) {
  elements.form.addEventListener('submit', handleFormSubmit);
  elements.clearFormBtn.addEventListener('click', handleClearForm);
  elements.cancelEditBtn.addEventListener('click', handleCancelEdit);
  elements.clearCaptureBtn.addEventListener('click', handleClearCapture);

  elements.actionInput.addEventListener('input', handleDraftValidation);
  elements.categorySelect.addEventListener('change', handleDraftValidation);
  elements.descriptionInput.addEventListener('input', handleDraftValidation);

  elements.captureField.addEventListener('focus', () => ui.setCaptureMode(true));
  elements.captureField.addEventListener('blur', () => {
    ui.setCaptureMode(false);
    if (!elements.captureField.value) {
      ui.updateCaptureStatus('', 'neutral');
    }
  });

  elements.searchInput.addEventListener('input', debounce(handleSearch, 220));
  elements.categoryFilter.addEventListener('change', handleFilterChange);
  elements.statusFilter.addEventListener('change', handleFilterChange);
  elements.sortSelect.addEventListener('change', handleSortChange);

  elements.importBtn.addEventListener('click', () => ui.showImportModal());
  elements.exportBtn.addEventListener('click', handleExportClick);

  elements.undoBtn.addEventListener('click', handleUndoClick);
  elements.redoBtn.addEventListener('click', handleRedoClick);

  elements.shortcutsTbody.addEventListener('click', handleTableAction);
  elements.emptyState.addEventListener('click', handleEmptyStateAction);

  elements.clearOutputBtn.addEventListener('click', () => {
    ui.clearOutput();
    ui.showToast('Activity feed cleared.', 'info', 'Output reset');
  });

  elements.importConfirmBtn.addEventListener('click', handleImportConfirm);
  elements.importCancelBtn.addEventListener('click', () => ui.hideImportModal());
  elements.importModalClose.addEventListener('click', () => ui.hideImportModal());
  elements.importModal.querySelector('.modal-backdrop').addEventListener('click', () => ui.hideImportModal());
  elements.importFileBtn.addEventListener('click', () => elements.importFileInput.click());
  elements.importFileInput.addEventListener('change', handleImportFileSelection);

  elements.deleteConfirmBtn.addEventListener('click', handleDeleteConfirm);
  elements.deleteCancelBtn.addEventListener('click', closeDeleteModal);
  elements.deleteModal.querySelector('.modal-backdrop').addEventListener('click', closeDeleteModal);

  elements.themeToggle.addEventListener('click', toggleTheme);

  window.addEventListener('refreshData', loadShortcuts);
}

async function loadShortcuts() {
  try {
    const response = await api.getShortcuts();
    state.setShortcuts(response.data);

    if (response.historyStatus) {
      state.setHistoryStatus(response.historyStatus);
    }

    ui.updateCategoryFilter();
    ui.renderTable();
    ui.updateHistoryButtons();
  } catch (error) {
    console.error('[v0] Failed to load shortcuts:', error);
    ui.addOutputMessage('Failed to load shortcuts: ' + error.message, 'error');
    ui.showToast(error.message, 'error', 'Unable to load shortcuts');
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const formData = ui.getFormData();
  const editMode = state.getEditMode();
  const validation = validateShortcutForm(formData, state.getShortcuts(), editMode.shortcutId);

  ui.clearFormMessages();

  if (!validation.valid) {
    validation.errors.forEach((err) => ui.showFormMessage(err, 'error'));
    return;
  }

  validation.warnings.forEach((warn) => ui.showFormMessage(warn, 'warning'));

  const elements = ui.getElements();

  try {
    ui.setButtonLoading(elements.submitBtn, true, editMode.active ? 'Saving...' : 'Creating...');

    let response;
    if (editMode.active) {
      response = await api.updateShortcut(editMode.shortcutId, formData);
    } else {
      response = await api.createShortcut(formData);
    }

    ui.showFormMessage(response.message, 'success');
    ui.showToast(response.message, 'success', editMode.active ? 'Shortcut updated' : 'Shortcut created');
    ui.addOutputMessage(response.message, 'success');

    if (response.warnings) {
      response.warnings.forEach((warn) => ui.showFormMessage(warn, 'warning'));
    }

    if (response.historyStatus) {
      state.setHistoryStatus(response.historyStatus);
    }

    await loadShortcuts();

    if (editMode.active) {
      state.exitEditMode();
      ui.exitEditMode();
    } else {
      ui.clearForm();
      clearCapture();
    }
  } catch (error) {
    ui.showFormMessages(error.errors?.length ? error.errors : [error.message], 'error');
    ui.addOutputMessage('Error: ' + error.message, 'error');
    ui.showToast(error.message, 'error', 'Unable to save shortcut');
  } finally {
    ui.setButtonLoading(elements.submitBtn, false);
  }
}

function handleClearForm() {
  const editMode = state.getEditMode();

  if (editMode.active) {
    const editingShortcut = state.getEditingShortcut();
    if (editingShortcut) {
      ui.enterEditMode(editingShortcut);
      ui.clearFormMessages();
      ui.showToast('Restored the saved shortcut values for this edit.', 'info', 'Draft reset');
      return;
    }
  } else {
    ui.showToast('Form cleared and ready for a new shortcut.', 'info', 'Form reset');
  }

  ui.clearForm();
  clearCapture();
  ui.clearFormMessages();
}

function handleCancelEdit() {
  const editMode = state.getEditMode();
  if (!editMode.active) return;

  state.exitEditMode();
  ui.exitEditMode();
  clearCapture();
  ui.showToast('Returned to create mode.', 'info', 'Edit cancelled');
}

function handleClearCapture() {
  clearCapture();
  ui.updateCaptureIndicator('Ready to record');
  ui.updateCaptureStatus('', 'neutral');
  ui.clearFormMessages();
  ui.getElements().captureField.focus();
}

function handleShortcutCapture(result) {
  const editMode = state.getEditMode();
  const validation = validateShortcutKeys(result.normalized, state.getShortcuts(), editMode.shortcutId);

  ui.clearFormMessages();
  ui.updateCaptureIndicator(validation.valid ? 'Captured' : 'Needs review');
  ui.updateCaptureStatus(
    validation.valid ? `Captured ${result.normalized}` : validation.errors[0],
    validation.valid ? 'success' : 'error'
  );

  if (!validation.valid) {
    ui.showFormMessages(validation.errors, 'error');
    return;
  }

  if (validation.warnings.length > 0) {
    ui.showFormMessages(validation.warnings, 'warning');
    ui.updateCaptureStatus(validation.warnings[0], 'warning');
    ui.showToast(validation.warnings[0], 'warning', 'Browser-reserved shortcut');
  }
}

function handleShortcutExecution({ normalizedKeys, result }) {
  if (result.message) {
    ui.addOutputMessage(`[${normalizedKeys}] ${result.message}`, 'action');
  }
}

function handleSearch(event) {
  state.setFilter('search', event.target.value);
  ui.renderTable();
}

function handleFilterChange() {
  const elements = ui.getElements();
  state.setFilters({
    category: elements.categoryFilter.value,
    enabled: elements.statusFilter.value
  });
  ui.renderTable();
}

function handleSortChange() {
  const elements = ui.getElements();
  state.setFilter('sort', elements.sortSelect.value);
  ui.renderTable();
}

async function handleTableAction(event) {
  const target = event.target.closest('button');

  if (!target || !target.classList.contains('btn')) return;

  const id = target.dataset.id;
  if (!id) return;

  if (target.classList.contains('edit-btn')) {
    const shortcut = state.findShortcut(id);
    if (shortcut) {
      state.enterEditMode(id);
      ui.enterEditMode(shortcut);
      ui.showToast(`Editing ${shortcut.action}.`, 'info', 'Edit mode');
    }
  } else if (target.classList.contains('toggle-btn')) {
    await handleToggle(id);
  } else if (target.classList.contains('delete-btn')) {
    const shortcut = state.findShortcut(id);
    if (shortcut) {
      state.setPendingDelete(shortcut);
      ui.showDeleteModal(shortcut);
    }
  }
}

async function handleToggle(id) {
  try {
    const response = await api.toggleShortcut(id);
    ui.addOutputMessage(response.message, 'success');
    ui.showToast(response.message, 'success', 'Shortcut updated');

    if (response.historyStatus) {
      state.setHistoryStatus(response.historyStatus);
    }

    await loadShortcuts();
  } catch (error) {
    ui.addOutputMessage('Error: ' + error.message, 'error');
    ui.showToast(error.message, 'error', 'Unable to update shortcut');
  }
}

async function handleDeleteConfirm() {
  const shortcut = state.getPendingDelete();
  if (!shortcut) return;

  const elements = ui.getElements();

  try {
    ui.setButtonLoading(elements.deleteConfirmBtn, true, 'Deleting...');

    const response = await api.deleteShortcut(shortcut.id);
    ui.addOutputMessage(response.message, 'success');
    ui.showToast(response.message, 'success', 'Shortcut deleted');

    if (response.historyStatus) {
      state.setHistoryStatus(response.historyStatus);
    }

    const editMode = state.getEditMode();
    if (editMode.active && editMode.shortcutId === shortcut.id) {
      state.exitEditMode();
      ui.exitEditMode();
    }

    await loadShortcuts();
  } catch (error) {
    ui.addOutputMessage('Error: ' + error.message, 'error');
    ui.showToast(error.message, 'error', 'Delete failed');
  } finally {
    ui.setButtonLoading(elements.deleteConfirmBtn, false);
    closeDeleteModal();
  }
}

function closeDeleteModal() {
  ui.hideDeleteModal();
  state.setPendingDelete(null);
}

async function handleExportClick() {
  const result = await handleExport();
  ui.addOutputMessage(result.message, result.success ? 'success' : 'error');
  ui.showToast(result.message, result.success ? 'success' : 'error', result.success ? 'Export complete' : 'Export failed');
}

async function handleImportConfirm() {
  const elements = ui.getElements();
  const jsonString = elements.importTextarea.value;

  ui.clearImportErrors();
  ui.setButtonLoading(elements.importConfirmBtn, true, 'Importing...');

  try {
    const result = await handleImport(jsonString);

    if (!result.success) {
      ui.showImportErrors(result.errors || [result.message]);
      ui.showToast(result.message, 'error', 'Import blocked');
      return;
    }

    ui.hideImportModal();
    ui.addOutputMessage(result.message, 'success');
    ui.showToast(result.message, 'success', 'Import complete');
    (result.warnings || []).forEach((warning) => ui.addOutputMessage(warning, 'warning'));
    await loadShortcuts();
  } catch (error) {
    ui.showImportErrors([error.message]);
    ui.showToast(error.message, 'error', 'Import failed');
  } finally {
    ui.setButtonLoading(elements.importConfirmBtn, false);
  }
}

async function handleImportFileSelection(event) {
  const file = event.target.files?.[0];
  if (!file) {
    ui.setImportFileName('');
    return;
  }

  ui.setImportFileName(file.name);

  try {
    const contents = await readFile(file);
    ui.getElements().importTextarea.value = contents;
    ui.clearImportErrors();
    ui.showToast(`${file.name} loaded into the import editor.`, 'info', 'File ready');
  } catch (error) {
    ui.showImportErrors([error.message]);
    ui.showToast(error.message, 'error', 'Unable to read file');
  }
}

async function handleUndoClick() {
  const result = await performUndo();
  ui.addOutputMessage(result.message, result.success ? 'success' : 'warning');
  ui.showToast(result.message, result.success ? 'success' : 'warning', result.success ? 'Undo complete' : 'Undo unavailable');

  if (result.success) {
    await loadShortcuts();
  }
}

async function handleRedoClick() {
  const result = await performRedo();
  ui.addOutputMessage(result.message, result.success ? 'success' : 'warning');
  ui.showToast(result.message, result.success ? 'success' : 'warning', result.success ? 'Redo complete' : 'Redo unavailable');

  if (result.success) {
    await loadShortcuts();
  }
}

function handleEmptyStateAction(event) {
  const action = event.target.dataset.emptyAction;
  if (!action) return;

  if (action === 'focus-form') {
    ui.focusForm();
    return;
  }

  if (action === 'reset-filters') {
    state.resetFilters();
    const elements = ui.getElements();
    elements.searchInput.value = '';
    elements.categoryFilter.value = '';
    elements.statusFilter.value = '';
    elements.sortSelect.value = 'updated_desc';
    ui.renderTable();
    ui.showToast('Filters cleared. Showing the full library again.', 'info', 'Filters reset');
  }
}

function toggleTheme() {
  const nextTheme = toggleThemeState();
  ui.showToast(`Theme switched to ${nextTheme} mode.`, 'info', 'Appearance updated');
}

function handleStateChange(type) {
  switch (type) {
    case 'shortcuts':
    case 'filters':
      ui.renderTable();
      break;
    case 'history':
      ui.updateHistoryButtons();
      break;
    case 'editMode':
      break;
    default:
      break;
  }
}

function handleDraftValidation() {
  const formData = ui.getFormData();

  if (!formData.action && !formData.keys) {
    ui.clearFormMessages();
    ui.updateCaptureStatus('', 'neutral');
    ui.updateCaptureIndicator('Ready to record');
    return;
  }

  const editMode = state.getEditMode();
  const validation = formData.action
    ? validateShortcutForm(formData, state.getShortcuts(), editMode.shortcutId)
    : validateShortcutKeys(formData.keys, state.getShortcuts(), editMode.shortcutId);

  ui.clearFormMessages();

  if (!formData.keys) {
    ui.updateCaptureStatus('Add a shortcut combination to continue.', 'neutral');
    ui.updateCaptureIndicator('Awaiting keys');
    return;
  }

  if (!validation.valid) {
    ui.showFormMessages(validation.errors, 'error');
    ui.updateCaptureStatus(validation.errors[0], 'error');
    ui.updateCaptureIndicator('Needs review');
    return;
  }

  if (validation.warnings.length > 0) {
    ui.showFormMessages(validation.warnings, 'warning');
    ui.updateCaptureStatus(validation.warnings[0], 'warning');
    ui.updateCaptureIndicator('Review warning');
    return;
  }

  ui.updateCaptureStatus(`Ready to save ${validation.normalizedKeys}`, 'success');
  ui.updateCaptureIndicator('Ready');
}

function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}
