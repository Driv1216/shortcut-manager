/**
 * Shortcut Controller
 * Handles HTTP request/response for shortcut operations
 */

import * as shortcutService from '../services/shortcutService.js';
import { getHistoryStatus } from '../services/historyService.js';
import { exportRuntimeIndexAsObject } from '../services/runtimeIndexService.js';

/**
 * GET /api/shortcuts
 * Get all shortcuts with optional filtering
 */
export async function getAll(req, res, next) {
  try {
    const { search, category, enabled, sort } = req.query;
    const shortcuts = await shortcutService.getAll({ search, category, enabled, sort });
    
    res.json({
      success: true,
      data: shortcuts,
      count: shortcuts.length,
      historyStatus: getHistoryStatus()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/shortcuts/runtime-index
 * Get the current runtime index for frontend
 */
export async function getRuntimeIndex(req, res, next) {
  try {
    const index = exportRuntimeIndexAsObject();
    res.json({
      success: true,
      data: index
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/shortcuts/categories
 * Get unique categories
 */
export async function getCategories(req, res, next) {
  try {
    const categories = await shortcutService.getCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/shortcuts/:id
 * Get a single shortcut by ID
 */
export async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const shortcut = await shortcutService.getById(id);
    
    if (!shortcut) {
      return res.status(404).json({
        success: false,
        message: 'Shortcut not found'
      });
    }
    
    res.json({
      success: true,
      data: shortcut
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/shortcuts
 * Create a new shortcut
 */
export async function create(req, res, next) {
  try {
    const result = await shortcutService.create(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
      warnings: result.warnings,
      historyStatus: getHistoryStatus()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/shortcuts/:id
 * Update an existing shortcut
 */
export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const result = await shortcutService.update(id, req.body);
    
    if (!result.success) {
      const status = result.message === 'Shortcut not found' ? 404 : 400;
      return res.status(status).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      message: result.message,
      data: result.data,
      warnings: result.warnings,
      historyStatus: getHistoryStatus()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/shortcuts/:id
 * Delete a shortcut
 */
export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const result = await shortcutService.remove(id);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      message: result.message,
      data: result.data,
      historyStatus: getHistoryStatus()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/shortcuts/:id/toggle
 * Toggle enabled status
 */
export async function toggleEnabled(req, res, next) {
  try {
    const { id } = req.params;
    const result = await shortcutService.toggleEnabled(id);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      message: result.message,
      data: result.data,
      historyStatus: getHistoryStatus()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/shortcuts/import
 * Import shortcuts from JSON
 */
export async function importShortcuts(req, res, next) {
  try {
    const result = await shortcutService.importShortcuts(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        errors: result.errors
      });
    }
    
    res.json({
      success: true,
      message: result.message,
      data: result.data,
      historyStatus: getHistoryStatus()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/shortcuts/export
 * Export all shortcuts as JSON
 */
export async function exportShortcuts(req, res, next) {
  try {
    const shortcuts = await shortcutService.exportShortcuts();
    
    // Set headers for download if requested
    if (req.query.download === 'true') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=shortcuts.json');
    }
    
    res.json(shortcuts);
  } catch (error) {
    next(error);
  }
}
