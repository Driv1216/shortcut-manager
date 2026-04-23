/**
 * Shortcut controller with consistent API response shapes.
 */

import * as shortcutService from '../services/shortcutService.js';
import { getHistoryStatus } from '../services/historyService.js';
import { exportRuntimeIndexAsObject } from '../services/runtimeIndexService.js';

function sendFailure(res, status, result) {
  return res.status(status).json({
    success: false,
    message: result.message,
    errors: result.errors || []
  });
}

export async function getAll(req, res, next) {
  try {
    const { search, category, enabled, sort } = req.query;
    const shortcuts = await shortcutService.getAll({ search, category, enabled, sort });

    res.json({
      success: true,
      message: 'Shortcuts fetched successfully',
      data: shortcuts,
      count: shortcuts.length,
      historyStatus: getHistoryStatus()
    });
  } catch (error) {
    next(error);
  }
}

export async function getRuntimeIndex(req, res, next) {
  try {
    const index = exportRuntimeIndexAsObject();

    res.json({
      success: true,
      message: 'Runtime index fetched successfully',
      data: index
    });
  } catch (error) {
    next(error);
  }
}

export async function getCategories(req, res, next) {
  try {
    const categories = await shortcutService.getCategories();

    res.json({
      success: true,
      message: 'Categories fetched successfully',
      data: categories
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const shortcut = await shortcutService.getById(req.params.id);

    if (!shortcut) {
      return sendFailure(res, 404, {
        message: 'Shortcut not found',
        errors: ['Shortcut not found']
      });
    }

    res.json({
      success: true,
      message: 'Shortcut fetched successfully',
      data: shortcut
    });
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const result = await shortcutService.create(req.body);

    if (!result.success) {
      return sendFailure(res, 400, result);
    }

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
      warnings: result.warnings || [],
      historyStatus: getHistoryStatus()
    });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const result = await shortcutService.update(req.params.id, req.body);

    if (!result.success) {
      const status = result.message === 'Shortcut not found' ? 404 : 400;
      return sendFailure(res, status, result);
    }

    res.json({
      success: true,
      message: result.message,
      data: result.data,
      warnings: result.warnings || [],
      historyStatus: getHistoryStatus()
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const result = await shortcutService.remove(req.params.id);

    if (!result.success) {
      return sendFailure(res, 404, result);
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

export async function toggleEnabled(req, res, next) {
  try {
    const result = await shortcutService.toggleEnabled(req.params.id);

    if (!result.success) {
      return sendFailure(res, 404, result);
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

export async function importShortcuts(req, res, next) {
  try {
    const result = await shortcutService.importShortcuts(req.body);

    if (!result.success) {
      return sendFailure(res, 400, result);
    }

    res.json({
      success: true,
      message: result.message,
      data: result.data,
      count: result.data.length,
      warnings: result.warnings || [],
      historyStatus: getHistoryStatus()
    });
  } catch (error) {
    next(error);
  }
}

export async function exportShortcuts(req, res, next) {
  try {
    const shortcuts = await shortcutService.exportShortcuts();

    if (req.query.download === 'true') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=shortcuts.json');
    }

    res.json({
      success: true,
      message: 'Shortcuts exported successfully',
      data: shortcuts,
      count: shortcuts.length
    });
  } catch (error) {
    next(error);
  }
}
