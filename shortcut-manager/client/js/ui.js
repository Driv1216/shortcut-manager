/**
 * UI Module
 * Handles all DOM rendering and UI updates
 */

import * as state from './state.js';
import { filterAndSort, extractCategories } from './filterSort.js';

let elements = {};

export function initUI() {
  elements = {
    form: document.getElementById('shortcut-form'),
    formTitle: document.getElementById('form-title'),
    formCard: document.querySelector('.form-card'),
    actionInput: document.getElementById('action-input'),
    categorySelect: document.getElementById('category-select'),
    descriptionInput: document.getElementById('description-input'),
    captureField: document.getElementById('shortcut-capture'),
    captureWrapper: document.querySelector('.capture-wrapper'),
    capturePreview: document.getElementById('capture-preview'),
    captureIndicator: document.getElementById('capture-indicator'),
    captureStatus: document.getElementById('capture-status'),
    clearCaptureBtn: document.getElementById('clear-capture-btn'),
    enabledToggle: document.getElementById('enabled-toggle'),
    submitBtn: document.getElementById('submit-btn'),
    clearFormBtn: document.getElementById('clear-form-btn'),
    editIdInput: document.getElementById('edit-id'),
    editBanner: document.getElementById('edit-banner'),
    editTargetLabel: document.getElementById('edit-target-label'),
    cancelEditBtn: document.getElementById('cancel-edit-btn'),
    formMessages: document.getElementById('form-messages'),

    searchInput: document.getElementById('search-input'),
    categoryFilter: document.getElementById('category-filter'),
    statusFilter: document.getElementById('status-filter'),
    sortSelect: document.getElementById('sort-select'),
    activeFilterSummary: document.getElementById('active-filter-summary'),
    importBtn: document.getElementById('import-btn'),
    exportBtn: document.getElementById('export-btn'),
    undoBtn: document.getElementById('undo-btn'),
    redoBtn: document.getElementById('redo-btn'),

    shortcutsTable: document.getElementById('shortcuts-table'),
    shortcutsTbody: document.getElementById('shortcuts-tbody'),
    emptyState: document.getElementById('empty-state'),
    tableSummary: document.getElementById('table-summary'),

    outputPanel: document.getElementById('output-panel'),
    clearOutputBtn: document.getElementById('clear-output-btn'),

    importModal: document.getElementById('import-modal'),
    importTextarea: document.getElementById('import-textarea'),
    importErrors: document.getElementById('import-errors'),
    importConfirmBtn: document.getElementById('import-confirm-btn'),
    importCancelBtn: document.getElementById('import-cancel-btn'),
    importModalClose: document.getElementById('import-modal-close'),
    importFileInput: document.getElementById('import-file-input'),
    importFileBtn: document.getElementById('import-file-btn'),
    importFileName: document.getElementById('import-file-name'),

    deleteModal: document.getElementById('delete-modal'),
    deleteShortcutName: document.getElementById('delete-shortcut-name'),
    deleteConfirmBtn: document.getElementById('delete-confirm-btn'),
    deleteCancelBtn: document.getElementById('delete-cancel-btn'),

    totalShortcutsCount: document.getElementById('total-shortcuts-count'),
    enabledShortcutsCount: document.getElementById('enabled-shortcuts-count'),
    disabledShortcutsCount: document.getElementById('disabled-shortcuts-count'),

    themeToggle: document.getElementById('theme-toggle'),
    toastRegion: document.getElementById('toast-region')
  };

  renderSummaryStats();
  updateFilterSummary();
  syncCapturePreview();
  return elements;
}

export function getElements() {
  return elements;
}

export function renderTable() {
  const shortcuts = state.getShortcuts();
  const filters = state.getFilters();
  const displayed = filterAndSort(shortcuts, filters);
  const editMode = state.getEditMode();

  elements.shortcutsTbody.innerHTML = '';

  renderSummaryStats();
  updateFilterSummary(displayed.length, shortcuts.length);
  updateTableSummary(displayed.length, shortcuts.length);

  if (displayed.length === 0) {
    elements.shortcutsTable.style.display = 'none';
    elements.emptyState.style.display = 'block';
    renderEmptyState(filters, shortcuts.length);
    return;
  }

  elements.shortcutsTable.style.display = 'table';
  elements.emptyState.style.display = 'none';

  displayed.forEach((shortcut) => {
    const row = createTableRow(shortcut, editMode.shortcutId);
    elements.shortcutsTbody.appendChild(row);
  });
}

function createTableRow(shortcut, editingId) {
  const row = document.createElement('tr');
  row.dataset.id = shortcut.id;

  if (!shortcut.enabled) {
    row.classList.add('disabled-row');
  }

  if (editingId === shortcut.id) {
    row.classList.add('editing-row');
  }

  const updatedDate = new Date(shortcut.updatedAt);
  const isRecent = Date.now() - updatedDate.getTime() < 86400000;
  const hasDescription = Boolean(shortcut.description);
  const description = hasDescription ? escapeHtml(shortcut.description) : 'No description provided';
  const displayTimestamp = updatedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: updatedDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
  const relativeTimestamp = formatDate(updatedDate);

  row.innerHTML = `
    <td class="action-cell">
      <div class="action-cell-title">
        <span class="action-name">${escapeHtml(shortcut.action)}</span>
        ${isRecent ? '<span class="subtle-badge">Updated</span>' : ''}
      </div>
      <div class="action-description${hasDescription ? '' : ' action-description-empty'}">${description}</div>
    </td>
    <td>
      <div class="shortcut-keys" title="${escapeHtml(shortcut.normalizedKeys)}">${renderShortcutKeys(shortcut.normalizedKeys)}</div>
    </td>
    <td><span class="category-badge">${escapeHtml(shortcut.category || 'Custom')}</span></td>
    <td>
      <span class="status-badge ${shortcut.enabled ? 'status-enabled' : 'status-disabled'}">
        ${shortcut.enabled ? 'Enabled' : 'Disabled'}
      </span>
    </td>
    <td><span class="timestamp" title="${escapeHtml(relativeTimestamp)}">${displayTimestamp}</span></td>
    <td class="action-buttons">
      <button class="btn btn-icon btn-row-action edit-btn" data-id="${shortcut.id}" type="button" aria-label="Edit shortcut" title="Edit">
        <span aria-hidden="true">✎</span>
      </button>
      <button class="btn btn-icon btn-row-action toggle-btn ${shortcut.enabled ? 'status-on' : 'status-off'}" data-id="${shortcut.id}" type="button" aria-label="${shortcut.enabled ? 'Disable shortcut' : 'Enable shortcut'}" title="${shortcut.enabled ? 'Disable' : 'Enable'}">
        <span aria-hidden="true">${shortcut.enabled ? '◒' : '◐'}</span>
      </button>
      <button class="btn btn-icon btn-row-action btn-row-danger delete-btn" data-id="${shortcut.id}" type="button" aria-label="Delete shortcut" title="Delete">
        <span aria-hidden="true">×</span>
      </button>
    </td>
  `;

  return row;
}

function renderShortcutKeys(normalizedKeys = '') {
  return normalizedKeys
    .split('+')
    .filter(Boolean)
    .map((part, index, allParts) => {
      const delay = Math.min(index * 80, 320);
      const separator = index < allParts.length - 1 ? '<span class="shortcut-separator">+</span>' : '';
      return `<span class="keycap" style="animation-delay:${delay}ms">${escapeHtml(part)}</span>${separator}`;
    })
    .join('');
}

function renderEmptyState(filters, totalShortcuts) {
  const hasFilters = filters.search || filters.category || filters.enabled;

  elements.emptyState.innerHTML = hasFilters
    ? `
      <p class="empty-line">No matches.</p>
    `
    : `
      <p class="empty-line">No shortcuts configured. <button class="empty-link" type="button" data-empty-action="focus-form">Create one</button></p>
    `;
}

function updateTableSummary(displayedCount, totalCount) {
  if (!elements.tableSummary) return;

  elements.tableSummary.textContent = displayedCount === totalCount
    ? `${totalCount} shortcut${totalCount === 1 ? '' : 's'} currently loaded`
    : `${displayedCount} of ${totalCount} shortcut${totalCount === 1 ? '' : 's'} shown`;
}

export function renderSummaryStats() {
  const shortcuts = state.getShortcuts();
  const enabledCount = shortcuts.filter((shortcut) => shortcut.enabled).length;
  const disabledCount = shortcuts.length - enabledCount;

  if (elements.totalShortcutsCount) {
    elements.totalShortcutsCount.textContent = shortcuts.length;
    elements.enabledShortcutsCount.textContent = enabledCount;
    elements.disabledShortcutsCount.textContent = disabledCount;
  }
}

export function updateFilterSummary(displayedCount = null, totalCount = null) {
  if (!elements.activeFilterSummary) return;

  const filters = state.getFilters();
  const activeParts = [];

  if (filters.search) activeParts.push(`Search: "${filters.search}"`);
  if (filters.category) activeParts.push(`Category: ${filters.category}`);
  if (filters.enabled !== '') activeParts.push(filters.enabled === 'true' ? 'Status: enabled' : 'Status: disabled');

  if (activeParts.length === 0) {
    elements.activeFilterSummary.textContent = displayedCount !== null && totalCount !== null
      ? `Showing all ${totalCount} shortcuts`
      : 'Showing all shortcuts';
    return;
  }

  const shownText = displayedCount !== null && totalCount !== null
    ? `${displayedCount} of ${totalCount} shown`
    : 'Filtered results';

  elements.activeFilterSummary.textContent = `${shownText} • ${activeParts.join(' • ')}`;
}

export function updateCategoryFilter() {
  const shortcuts = state.getShortcuts();
  const categories = extractCategories(shortcuts);
  const currentValue = elements.categoryFilter.value;

  elements.categoryFilter.innerHTML = '<option value="">All Categories</option>';

  categories.forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    elements.categoryFilter.appendChild(option);
  });

  if (currentValue && categories.includes(currentValue)) {
    elements.categoryFilter.value = currentValue;
  }
}

export function updateHistoryButtons() {
  const status = state.getHistoryStatus();
  elements.undoBtn.disabled = !status.canUndo;
  elements.redoBtn.disabled = !status.canRedo;
  elements.undoBtn.title = status.canUndo
    ? `Undo last change (${status.undoCount} available)`
    : 'Undo unavailable';
  elements.redoBtn.title = status.canRedo
    ? `Redo last reverted change (${status.redoCount} available)`
    : 'Redo unavailable';
}

export function showFormMessage(message, type = 'info') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.textContent = message;

  elements.formMessages.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}

export function showFormMessages(messages, type = 'info') {
  messages.forEach((message) => showFormMessage(message, type));
}

export function clearFormMessages() {
  elements.formMessages.innerHTML = '';
}

export function addOutputMessage(message, type = 'info') {
  if (!message) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = `output-message output-${type}`;
  const timestamp = new Date();
  const actionMeta = buildOutputMeta(message, type, timestamp);

  messageDiv.innerHTML = `
    <span class="output-line">
      <time class="output-time">${escapeHtml(actionMeta.time)}</time>
      <span class="output-badge">${escapeHtml(actionMeta.label)}</span>
      <span class="output-shortcut-text">${escapeHtml(actionMeta.shortcut)}</span>
      <span class="output-body">${escapeHtml(actionMeta.body)}</span>
    </span>
  `;

  const emptyState = elements.outputPanel.querySelector('.output-empty');
  if (emptyState) {
    emptyState.remove();
  }

  elements.outputPanel.insertBefore(messageDiv, elements.outputPanel.firstChild);

  while (elements.outputPanel.children.length > 20) {
    elements.outputPanel.removeChild(elements.outputPanel.lastChild);
  }
}

function buildOutputMeta(message, type, timestamp) {
  const base = {
    time: timestamp.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    label: getOutputLabel(type),
    shortcut: type === 'action' ? 'runtime' : 'system',
    body: message
  };

  if (type === 'action') {
    const match = /^\[([^\]]+)\]\s*(.+)$/.exec(message);
    if (match) {
      return {
        ...base,
        shortcut: match[1],
        body: match[2]
      };
    }
  }

  return base;
}

function getOutputHeading(type) {
  const headings = {
    success: 'Operation completed',
    warning: 'Attention needed',
    error: 'Operation failed',
    action: 'Shortcut executed',
    info: 'System update'
  };

  return headings[type] || headings.info;
}

function getOutputLabel(type) {
  const labels = {
    success: 'Success',
    warning: 'Warning',
    error: 'Error',
    action: 'Action',
    info: 'Info'
  };

  return labels[type] || labels.info;
}

export function clearOutput() {
  elements.outputPanel.innerHTML = `
    <div class="output-empty">
      <div class="output-empty-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <rect x="3.5" y="6.5" width="17" height="11" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.25"/>
          <path d="M7.5 10.5h1.5M10.5 10.5h1.5M13.5 10.5h1.5M16.5 10.5h1.5M6.5 13.5h5M12.5 13.5h5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.25"/>
        </svg>
      </div>
      <div class="output-empty-title">Waiting for activity</div>
      <div class="output-empty-copy">Trigger a shortcut to see it appear here</div>
    </div>
  `;
}

export function enterEditMode(shortcut) {
  elements.formCard.classList.add('edit-mode');
  elements.formTitle.textContent = 'Edit Shortcut';
  elements.submitBtn.textContent = 'Save Changes';
  elements.clearFormBtn.textContent = 'Reset Draft';
  elements.editBanner.hidden = false;
  elements.editTargetLabel.textContent = shortcut.action;

  elements.actionInput.value = shortcut.action;
  elements.categorySelect.value = shortcut.category || 'Custom';
  elements.descriptionInput.value = shortcut.description || '';
  elements.captureField.value = shortcut.normalizedKeys;
  elements.enabledToggle.checked = shortcut.enabled;
  elements.editIdInput.value = shortcut.id;
  updateCaptureStatus(`Editing ${shortcut.normalizedKeys}`, 'warning');
  updateCaptureIndicator('Editing');
  syncCapturePreview();
  renderTable();

  elements.formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function exitEditMode() {
  elements.formCard.classList.remove('edit-mode');
  elements.formTitle.textContent = 'Create New Shortcut';
  elements.submitBtn.textContent = 'Create Shortcut';
  elements.clearFormBtn.textContent = 'Reset';
  elements.editBanner.hidden = true;
  elements.editTargetLabel.textContent = 'Updating an existing shortcut';
  clearForm();
  renderTable();
}

export function clearForm() {
  elements.actionInput.value = '';
  elements.categorySelect.value = 'Custom';
  elements.descriptionInput.value = '';
  elements.captureField.value = '';
  elements.enabledToggle.checked = true;
  elements.editIdInput.value = '';
  clearFormMessages();
  updateCaptureStatus('', 'neutral');
  updateCaptureIndicator('Ready to record');
  syncCapturePreview();
}

export function getFormData() {
  return {
    action: elements.actionInput.value,
    keys: elements.captureField.value,
    category: elements.categorySelect.value,
    description: elements.descriptionInput.value,
    enabled: elements.enabledToggle.checked
  };
}

export function showImportModal() {
  elements.importModal.style.display = 'flex';
  elements.importModal.setAttribute('aria-hidden', 'false');
  elements.importTextarea.value = '';
  elements.importErrors.innerHTML = '';
  setImportFileName('');
}

export function hideImportModal() {
  elements.importModal.style.display = 'none';
  elements.importModal.setAttribute('aria-hidden', 'true');
  elements.importFileInput.value = '';
}

export function showImportErrors(errors) {
  elements.importErrors.innerHTML = errors
    .map((err) => `<div class="message message-error">${escapeHtml(err)}</div>`)
    .join('');
}

export function clearImportErrors() {
  elements.importErrors.innerHTML = '';
}

export function setImportFileName(fileName = '') {
  if (!elements.importFileName) return;
  elements.importFileName.textContent = fileName || 'No JSON file selected';
}

export function showDeleteModal(shortcut) {
  elements.deleteModal.style.display = 'flex';
  elements.deleteModal.setAttribute('aria-hidden', 'false');
  elements.deleteShortcutName.textContent = `${shortcut.action} (${shortcut.normalizedKeys})`;
}

export function hideDeleteModal() {
  elements.deleteModal.style.display = 'none';
  elements.deleteModal.setAttribute('aria-hidden', 'true');
}

export function setButtonLoading(button, loading, loadingText = 'Loading...') {
  if (loading) {
    button.disabled = true;
    button.dataset.loading = 'true';
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
  } else {
    button.disabled = false;
    delete button.dataset.loading;
    button.textContent = button.dataset.originalText || button.textContent;
  }
}

export function updateCaptureStatus(message, type = 'neutral') {
  if (!elements.captureStatus) return;

  elements.captureStatus.textContent = message;
  elements.captureStatus.className = `capture-status capture-status-${type}`;

  if (elements.captureWrapper) {
    elements.captureWrapper.dataset.state = type;
  }

  syncCapturePreview();
}

export function setCaptureMode(isCapturing) {
  if (!elements.captureField) return;

  elements.captureField.classList.toggle('capturing', isCapturing);
  updateCaptureIndicator(isCapturing ? 'Recording' : elements.captureField.value ? 'Captured' : 'Ready to record');
  syncCapturePreview();

  if (isCapturing) {
    updateCaptureStatus('Recording the next key combination...', 'info');
  }
}

export function updateCaptureIndicator(text) {
  if (elements.captureIndicator) {
    elements.captureIndicator.textContent = text;
  }
}

function syncCapturePreview() {
  if (!elements.capturePreview || !elements.captureField) return;

  const value = elements.captureField.value.trim();

  if (!value) {
    elements.capturePreview.innerHTML = '<span class="capture-placeholder">awaiting input</span>';
    return;
  }

  elements.capturePreview.innerHTML = renderShortcutKeys(value);
}

export function focusForm() {
  elements.actionInput.focus();
  elements.formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function showToast(message, type = 'info', title = '') {
  if (!elements.toastRegion || !message) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div>
      <strong>${escapeHtml(title || getOutputHeading(type))}</strong>
      <p>${escapeHtml(message)}</p>
    </div>
  `;

  elements.toastRegion.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3200);
}

function formatDate(date) {
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) {
    return 'Just now';
  }

  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins} min${mins > 1 ? 's' : ''} ago`;
  }

  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
