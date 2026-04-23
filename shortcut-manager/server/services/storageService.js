/**
 * Storage Service
 * Handles JSON file persistence with serialized writes and safe parsing.
 */

import { DATA_FILE_PATH } from '../config/constants.js';
import { fileExists, readJsonFile, writeJsonFile } from '../utils/fileHelpers.js';

let writeQueue = Promise.resolve();

function queueWrite(task) {
  const nextTask = writeQueue.then(task, task);
  writeQueue = nextTask.catch(() => {});
  return nextTask;
}

async function readShortcutsFile() {
  const data = await readJsonFile(DATA_FILE_PATH);
  return Array.isArray(data) ? data : [];
}

export async function ensureDataFile() {
  const exists = await fileExists(DATA_FILE_PATH);

  if (!exists) {
    await writeJsonFile(DATA_FILE_PATH, []);
    return;
  }

  try {
    const data = await readJsonFile(DATA_FILE_PATH);

    if (!Array.isArray(data)) {
      console.warn('Data file was not an array, resetting to an empty list.');
      await writeJsonFile(DATA_FILE_PATH, []);
    }
  } catch (error) {
    console.warn('Data file could not be parsed, resetting to an empty list.');
    await writeJsonFile(DATA_FILE_PATH, []);
  }
}

export async function getAllShortcuts() {
  await writeQueue;
  return readShortcutsFile();
}

export async function getShortcutById(id) {
  const shortcuts = await getAllShortcuts();
  return shortcuts.find((shortcut) => shortcut.id === id) || null;
}

export async function saveAllShortcuts(shortcuts) {
  return queueWrite(async () => {
    await writeJsonFile(DATA_FILE_PATH, shortcuts);
    return shortcuts;
  });
}

export async function addShortcut(shortcut) {
  return queueWrite(async () => {
    const shortcuts = await readShortcutsFile();
    shortcuts.push(shortcut);
    await writeJsonFile(DATA_FILE_PATH, shortcuts);
    return shortcut;
  });
}

export async function updateShortcut(id, updates) {
  return queueWrite(async () => {
    const shortcuts = await readShortcutsFile();
    const index = shortcuts.findIndex((shortcut) => shortcut.id === id);

    if (index === -1) {
      return null;
    }

    shortcuts[index] = { ...shortcuts[index], ...updates };
    await writeJsonFile(DATA_FILE_PATH, shortcuts);
    return shortcuts[index];
  });
}

export async function deleteShortcut(id) {
  return queueWrite(async () => {
    const shortcuts = await readShortcutsFile();
    const index = shortcuts.findIndex((shortcut) => shortcut.id === id);

    if (index === -1) {
      return null;
    }

    const [deleted] = shortcuts.splice(index, 1);
    await writeJsonFile(DATA_FILE_PATH, shortcuts);
    return deleted;
  });
}

export async function replaceAllShortcuts(shortcuts) {
  return saveAllShortcuts(shortcuts);
}
