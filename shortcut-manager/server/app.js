/**
 * Shortcut Manager - Express Server Entry Point
 * Sets up middleware, routes, and error handling
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import shortcutRoutes from './routes/shortcutRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import { ensureDataFile } from './services/storageService.js';
import { rebuildRuntimeIndex } from './services/runtimeIndexService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from client directory
app.use(express.static(join(__dirname, '../client')));
app.use('/shared', express.static(join(__dirname, '../shared')));

// API Routes
app.use('/api/shortcuts', shortcutRoutes);
app.use('/api/history', historyRoutes);

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../client/index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Initialize data file and start server
async function startServer() {
  try {
    await ensureDataFile();
    await rebuildRuntimeIndex();
    app.listen(PORT, () => {
      console.log(`Shortcut Manager server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
