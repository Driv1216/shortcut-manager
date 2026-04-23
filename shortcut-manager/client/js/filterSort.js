/**
 * Filter and Sort Module
 * Local filtering and sorting utilities for shortcuts
 */

/**
 * Filter shortcuts based on criteria
 * @param {Array} shortcuts - Array of shortcuts
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered shortcuts
 */
export function filterShortcuts(shortcuts, filters) {
  let result = [...shortcuts];
  
  const { search, category, enabled } = filters;
  
  // Filter by search term
  if (search && search.trim()) {
    const searchLower = search.toLowerCase().trim();
    result = result.filter((s) =>
      s.action.toLowerCase().includes(searchLower) ||
      (s.keys || '').toLowerCase().includes(searchLower) ||
      s.normalizedKeys.toLowerCase().includes(searchLower) ||
      (s.category && s.category.toLowerCase().includes(searchLower)) ||
      (s.description && s.description.toLowerCase().includes(searchLower))
    );
  }
  
  // Filter by category
  if (category) {
    result = result.filter(s => s.category === category);
  }
  
  // Filter by enabled status
  if (enabled !== undefined && enabled !== '') {
    const enabledBool = enabled === 'true' || enabled === true;
    result = result.filter(s => s.enabled === enabledBool);
  }
  
  return result;
}

/**
 * Sort shortcuts based on criteria
 * @param {Array} shortcuts - Array of shortcuts
 * @param {string} sortBy - Sort criteria
 * @returns {Array} Sorted shortcuts
 */
export function sortShortcuts(shortcuts, sortBy) {
  const result = [...shortcuts];
  
  switch (sortBy) {
    case 'action_asc':
      result.sort((a, b) => a.action.localeCompare(b.action));
      break;
    case 'action_desc':
      result.sort((a, b) => b.action.localeCompare(a.action));
      break;
    case 'shortcut_asc':
      result.sort((a, b) => a.normalizedKeys.localeCompare(b.normalizedKeys));
      break;
    case 'shortcut_desc':
      result.sort((a, b) => b.normalizedKeys.localeCompare(a.normalizedKeys));
      break;
    case 'updated_desc':
      result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      break;
    case 'created_desc':
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    default:
      // Default to recently updated
      result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }
  
  return result;
}

/**
 * Filter and sort shortcuts in one operation
 * @param {Array} shortcuts - Array of shortcuts
 * @param {Object} options - Filter and sort options
 * @returns {Array} Filtered and sorted shortcuts
 */
export function filterAndSort(shortcuts, options) {
  const filtered = filterShortcuts(shortcuts, options);
  return sortShortcuts(filtered, options.sort);
}

/**
 * Extract unique categories from shortcuts
 * @param {Array} shortcuts - Array of shortcuts
 * @returns {Array} Unique categories
 */
export function extractCategories(shortcuts) {
  const categories = new Set();
  
  for (const shortcut of shortcuts) {
    if (shortcut.category) {
      categories.add(shortcut.category);
    }
  }
  
  return Array.from(categories).sort();
}
