/**
 * History Routes
 * Endpoints for undo/redo operations
 */

import { Router } from 'express';
import * as historyService from '../services/historyService.js';

const router = Router();

/**
 * POST /api/history/undo
 * Undo the last operation
 */
router.post('/undo', async (req, res, next) => {
  try {
    const result = await historyService.undo();
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      message: result.message,
      historyStatus: historyService.getHistoryStatus()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/history/redo
 * Redo the last undone operation
 */
router.post('/redo', async (req, res, next) => {
  try {
    const result = await historyService.redo();
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      message: result.message,
      historyStatus: historyService.getHistoryStatus()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/history/status
 * Get current history status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: historyService.getHistoryStatus()
  });
});

export default router;
