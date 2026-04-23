/**
 * Shortcut Routes
 * Defines REST API endpoints for shortcuts
 */

import { Router } from 'express';
import * as shortcutController from '../controllers/shortcutController.js';

const router = Router();

// GET /api/shortcuts - Get all shortcuts (with optional filtering)
router.get('/', shortcutController.getAll);

// GET /api/shortcuts/runtime-index - Get runtime index for frontend
router.get('/runtime-index', shortcutController.getRuntimeIndex);

// GET /api/shortcuts/categories - Get unique categories
router.get('/categories', shortcutController.getCategories);

// GET /api/shortcuts/export - Export all shortcuts as JSON
router.get('/export', shortcutController.exportShortcuts);

// GET /api/shortcuts/:id - Get single shortcut
router.get('/:id', shortcutController.getById);

// POST /api/shortcuts - Create new shortcut
router.post('/', shortcutController.create);

// POST /api/shortcuts/import - Import shortcuts
router.post('/import', shortcutController.importShortcuts);

// PUT /api/shortcuts/:id - Update shortcut
router.put('/:id', shortcutController.update);

// PATCH /api/shortcuts/:id/toggle - Toggle enabled status
router.patch('/:id/toggle', shortcutController.toggleEnabled);

// DELETE /api/shortcuts/:id - Delete shortcut
router.delete('/:id', shortcutController.remove);

export default router;
