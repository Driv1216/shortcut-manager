/**
 * Shortcut Manager - Express Server Entry Point
 * Sets up middleware, routes, and error handling
 */

import express from 'express';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import shortcutRoutes from './routes/shortcutRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import { connectToDatabase, getDatabaseHealth } from './services/databaseService.js';
import { ensureDataFile } from './services/storageService.js';
import { rebuildRuntimeIndex } from './services/runtimeIndexService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = join(__dirname, '..');
const ENV_PATHS = [join(APP_ROOT, '.env'), join(APP_ROOT, 'shortcut-manager/.env')];

function loadEnvironmentVariables() {
  console.log('Loading environment variables...');

  const envPath = ENV_PATHS.find((candidate) => existsSync(candidate));

  if (!envPath) {
    console.log('No .env file found, using existing process environment');
    return;
  }

  const envContent = readFileSync(envPath, 'utf-8');

  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  });
}

loadEnvironmentVariables();

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
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    database: getDatabaseHealth(),
    environment: process.env.NODE_ENV || 'development'
  });
});

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

    await connectToDatabase();
    await ensureDataFile();
    await rebuildRuntimeIndex();
    console.log('Runtime index initialized');

    app.listen(PORT, () => {
      console.log(`Shortcut Manager running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
