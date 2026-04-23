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

// Serve static files from the bundled client directory
const clientDir = join(__dirname, '../shortcut-manager/client');
app.use(express.static(clientDir));
const sharedDir = join(__dirname, '../shortcut-manager/shared');
app.use('/shared', express.static(sharedDir));

// API Routes
app.use('/api/shortcuts', shortcutRoutes);
app.use('/api/history', historyRoutes);

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(join(clientDir, 'index.html'));
});

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Serve index.html for all other routes (SPA fallback)
app.use((req, res) => {
  res.sendFile(join(clientDir, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Initialize data and start server
async function startServer() {
  try {
    console.log('Initializing Shortcut Manager...');
    
    await ensureDataFile();
    console.log('Data file ready');
    
    await rebuildRuntimeIndex();
    console.log('Runtime index initialized');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Shortcut Manager running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
