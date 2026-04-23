/**
 * API module with consistent response handling.
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
  } catch {
    throw {
      status: 0,
      message: 'Network error. Please check the server connection.',
      errors: []
    };
  }

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw {
      status: response.status,
      message: payload?.message || 'Request failed',
      errors: payload?.errors || []
    };
  }

  return payload;
}

function buildShortcutQuery(params = {}) {
  const query = new URLSearchParams();

  if (params.search) query.append('search', params.search);
  if (params.category) query.append('category', params.category);
  if (params.enabled !== undefined && params.enabled !== '') {
    query.append('enabled', params.enabled);
  }
  if (params.sort) query.append('sort', params.sort);

  const queryString = query.toString();
  return `/shortcuts${queryString ? `?${queryString}` : ''}`;
}

export function getShortcuts(params = {}) {
  return request(buildShortcutQuery(params));
}

export function getShortcut(id) {
  return request(`/shortcuts/${id}`);
}

export function createShortcut(data) {
  return request('/shortcuts', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function updateShortcut(id, data) {
  return request(`/shortcuts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export function deleteShortcut(id) {
  return request(`/shortcuts/${id}`, {
    method: 'DELETE'
  });
}

export function toggleShortcut(id) {
  return request(`/shortcuts/${id}/toggle`, {
    method: 'PATCH'
  });
}

export function importShortcuts(data) {
  return request('/shortcuts/import', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function exportShortcuts() {
  return request('/shortcuts/export');
}

export function getCategories() {
  return request('/shortcuts/categories');
}

export function getRuntimeIndex() {
  return request('/shortcuts/runtime-index');
}

export function undo() {
  return request('/history/undo', {
    method: 'POST'
  });
}

export function redo() {
  return request('/history/redo', {
    method: 'POST'
  });
}

export function getHistoryStatus() {
  return request('/history/status');
}
