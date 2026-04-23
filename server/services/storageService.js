import { DATA_FILE_PATH } from '../config/constants.js';
import { Shortcut } from '../models/Shortcut.js';
import { fileExists, readJsonFile } from '../utils/fileHelpers.js';
import { connectToDatabase } from './databaseService.js';

function normalizeShortcut(doc) {
  if (!doc) return null;

  const shortcut = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };

  if (!shortcut.id && shortcut._id) {
    shortcut.id = String(shortcut._id);
  }

  delete shortcut._id;

  if (shortcut.createdAt instanceof Date) {
    shortcut.createdAt = shortcut.createdAt.toISOString();
  }

  if (shortcut.updatedAt instanceof Date) {
    shortcut.updatedAt = shortcut.updatedAt.toISOString();
  }

  return shortcut;
}

async function readSeedFile() {
  const exists = await fileExists(DATA_FILE_PATH);
  if (!exists) return [];

  try {
    const data = await readJsonFile(DATA_FILE_PATH);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Seed file could not be parsed, continuing without seed data.');
    return [];
  }
}

export async function ensureDataFile() {
  await connectToDatabase();
  await Shortcut.syncIndexes();

  const existingCount = await Shortcut.estimatedDocumentCount();
  if (existingCount > 0) {
    console.log(`Mongo storage initialized (${existingCount} shortcut(s) loaded)`);
    return;
  }

  const seedData = await readSeedFile();
  if (seedData.length === 0) {
    console.log('Mongo storage initialized (empty collection, no JSON seed found)');
    return;
  }

  const normalizedSeedData = seedData.map((shortcut) => ({
    ...shortcut,
    createdAt: new Date(shortcut.createdAt),
    updatedAt: new Date(shortcut.updatedAt)
  }));

  await Shortcut.insertMany(normalizedSeedData, { ordered: true });
  console.log(`Mongo storage initialized (${normalizedSeedData.length} shortcut(s) seeded from JSON)`);
}

export async function getAllShortcuts() {
  await connectToDatabase();
  const shortcuts = await Shortcut.find({}).lean();
  return shortcuts.map(normalizeShortcut);
}

export async function getShortcutById(id) {
  await connectToDatabase();
  const shortcut = await Shortcut.findOne({ id }).lean();
  return normalizeShortcut(shortcut);
}

export async function saveAllShortcuts(shortcuts) {
  await connectToDatabase();
  await Shortcut.deleteMany({});

  if (shortcuts.length > 0) {
    await Shortcut.insertMany(
      shortcuts.map((shortcut) => ({
        ...shortcut,
        createdAt: new Date(shortcut.createdAt),
        updatedAt: new Date(shortcut.updatedAt)
      })),
      { ordered: true }
    );
  }

  return shortcuts;
}

export async function addShortcut(shortcut) {
  await connectToDatabase();
  const created = await Shortcut.create({
    ...shortcut,
    createdAt: new Date(shortcut.createdAt),
    updatedAt: new Date(shortcut.updatedAt)
  });
  return normalizeShortcut(created);
}

export async function updateShortcut(id, updates) {
  await connectToDatabase();
  const payload = {
    ...updates
  };

  if (payload.createdAt) {
    payload.createdAt = new Date(payload.createdAt);
  }

  if (payload.updatedAt) {
    payload.updatedAt = new Date(payload.updatedAt);
  }

  const updated = await Shortcut.findOneAndUpdate({ id }, payload, {
    new: true,
    runValidators: false
  });

  return normalizeShortcut(updated);
}

export async function deleteShortcut(id) {
  await connectToDatabase();
  const deleted = await Shortcut.findOneAndDelete({ id });
  return normalizeShortcut(deleted);
}

export async function replaceAllShortcuts(shortcuts) {
  return saveAllShortcuts(shortcuts);
}
