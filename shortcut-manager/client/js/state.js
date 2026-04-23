/**
 * State Module
 * Maintains client-side state for the application
 */

// Application state
const state = {
  // Shortcuts list from server
  shortcuts: [],
  
  // Runtime index (Map) for fast shortcut lookup
  runtimeIndex: new Map(),
  
  // Filter and sort options
  filters: {
    search: '',
    category: '',
    enabled: '',
    sort: 'updated_desc'
  },
  
  // Edit mode
  editMode: {
    active: false,
    shortcutId: null
  },
  
  // History status
  history: {
    canUndo: false,
    canRedo: false,
    undoCount: 0,
    redoCount: 0
  },
  
  // Available categories
  categories: [],
  
  // Delete confirmation
  pendingDelete: null
};

// State change subscribers
const subscribers = [];

/**
 * Subscribe to state changes
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function subscribe(callback) {
  subscribers.push(callback);
  return () => {
    const index = subscribers.indexOf(callback);
    if (index > -1) {
      subscribers.splice(index, 1);
    }
  };
}

/**
 * Notify all subscribers of state change
 * @param {string} type - Type of change
 */
function notify(type) {
  subscribers.forEach(callback => callback(type, state));
}

// Getters

export function getShortcuts() {
  return state.shortcuts;
}

export function getRuntimeIndex() {
  return state.runtimeIndex;
}

export function getFilters() {
  return { ...state.filters };
}

export function getEditMode() {
  return { ...state.editMode };
}

export function getHistoryStatus() {
  return { ...state.history };
}

export function getCategories() {
  return [...state.categories];
}

export function getPendingDelete() {
  return state.pendingDelete;
}

export function isCapturing() {
  return state.isCapturing || false;
}

// Setters

/**
 * Set shortcuts list
 * @param {Array} shortcuts - Shortcuts array
 */
export function setShortcuts(shortcuts) {
  state.shortcuts = shortcuts;
  rebuildRuntimeIndex();
  notify('shortcuts');
}

/**
 * Rebuild runtime index from shortcuts
 * Only includes enabled shortcuts
 */
export function rebuildRuntimeIndex() {
  state.runtimeIndex.clear();
  
  for (const shortcut of state.shortcuts) {
    if (shortcut.enabled && shortcut.normalizedKeys) {
      state.runtimeIndex.set(shortcut.normalizedKeys, shortcut);
    }
  }
  
  notify('runtimeIndex');
}

/**
 * Look up a shortcut by normalized key
 * @param {string} normalizedKey - The normalized key to look up
 * @returns {Object|undefined} The shortcut or undefined
 */
export function lookupShortcut(normalizedKey) {
  return state.runtimeIndex.get(normalizedKey);
}

export function buildDuplicateSet(excludeId = null) {
  const normalizedKeys = new Set();

  state.shortcuts.forEach((shortcut) => {
    if (excludeId && shortcut.id === excludeId) {
      return;
    }

    if (shortcut.normalizedKeys) {
      normalizedKeys.add(shortcut.normalizedKeys);
    }
  });

  return normalizedKeys;
}

/**
 * Set a single filter value
 * @param {string} key - Filter key
 * @param {any} value - Filter value
 */
export function setFilter(key, value) {
  state.filters[key] = value;
  notify('filters');
}

/**
 * Set all filters
 * @param {Object} filters - Filter object
 */
export function setFilters(filters) {
  state.filters = { ...state.filters, ...filters };
  notify('filters');
}

/**
 * Reset filters to defaults
 */
export function resetFilters() {
  state.filters = {
    search: '',
    category: '',
    enabled: '',
    sort: 'updated_desc'
  };
  notify('filters');
}

/**
 * Enter edit mode
 * @param {string} shortcutId - ID of shortcut to edit
 */
export function enterEditMode(shortcutId) {
  state.editMode = {
    active: true,
    shortcutId
  };
  notify('editMode');
}

/**
 * Exit edit mode
 */
export function exitEditMode() {
  state.editMode = {
    active: false,
    shortcutId: null
  };
  notify('editMode');
}

/**
 * Get shortcut being edited
 * @returns {Object|null} Shortcut or null
 */
export function getEditingShortcut() {
  if (!state.editMode.active) return null;
  return state.shortcuts.find(s => s.id === state.editMode.shortcutId) || null;
}

/**
 * Update history status
 * @param {Object} status - History status object
 */
export function setHistoryStatus(status) {
  state.history = {
    canUndo: status.canUndo || false,
    canRedo: status.canRedo || false,
    undoCount: status.undoCount || 0,
    redoCount: status.redoCount || 0
  };
  notify('history');
}

/**
 * Set available categories
 * @param {Array} categories - Categories array
 */
export function setCategories(categories) {
  state.categories = categories;
  notify('categories');
}

/**
 * Set pending delete
 * @param {Object|null} shortcut - Shortcut to delete or null
 */
export function setPendingDelete(shortcut) {
  state.pendingDelete = shortcut;
  notify('pendingDelete');
}

/**
 * Set capturing state
 * @param {boolean} capturing - Whether capturing is active
 */
export function setCapturing(capturing) {
  state.isCapturing = capturing;
  notify('capturing');
}

/**
 * Find a shortcut by ID
 * @param {string} id - Shortcut ID
 * @returns {Object|undefined} The shortcut
 */
export function findShortcut(id) {
  return state.shortcuts.find(s => s.id === id);
}
