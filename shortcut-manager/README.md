# Shortcut Manager

Shortcut Manager is a full-stack JavaScript app for recording, validating, managing, and executing custom keyboard shortcuts. It is designed as a polished configuration dashboard with live shortcut capture, runtime execution, undo and redo history, and JSON-based persistence.

## Why This Project

This project demonstrates how a small product can combine clean frontend interaction design with reliable backend data handling. It focuses on:

- structured shortcut capture and normalization
- conflict prevention through duplicate detection
- fast runtime lookup for triggered shortcuts
- reversible state changes with undo and redo
- clean separation between UI, client state, API calls, and server services

## Feature Highlights

- Create, edit, enable, disable, and delete shortcuts
- Record shortcuts by pressing real key combinations
- Normalize modifier order into a consistent canonical format
- Warn when a shortcut is likely to be browser-reserved
- Prevent duplicate mappings before save
- Search, filter, and sort the shortcut library
- Trigger saved shortcuts at runtime inside the app
- Track writes through stack-based undo and redo
- Import and export shortcuts as JSON
- Persist data locally in `server/data/shortcuts.json`
- Support light and dark theme modes

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript with ES modules
- Backend: Node.js and Express
- Persistence: JSON file storage
- Data structures used:
  - `Map` for runtime shortcut lookup
  - `Set` for duplicate detection
  - `Array` as stack for undo and redo history

## DSA Used In The Project

### 1. Hash Map / Map

The runtime shortcut index is stored in a `Map`, keyed by normalized shortcut string.

Why it matters:
- provides near O(1) lookup when a key combination is pressed
- keeps runtime execution fast as the library grows
- avoids scanning the full shortcut list on every keydown event

### 2. Set

Duplicate detection uses `Set` membership checks on normalized key combinations.

Why it matters:
- catches conflicts quickly
- keeps validation simple and efficient
- ensures a shortcut combination cannot be assigned twice

### 3. Stack

Undo and redo history are maintained using arrays as stacks.

Why it matters:
- supports reversible operations in the correct order
- makes create, update, toggle, delete, and import actions recoverable
- gives the project a strong academic explanation point for history management

### 4. Normalization Algorithm

Every shortcut is normalized into a canonical order before validation, storage, and runtime execution.

Why it matters:
- `Ctrl+Shift+K` and `Shift+Ctrl+K` are treated as the same shortcut
- import, validation, persistence, and runtime all use the same representation
- lookup and duplicate checks stay reliable across the whole app

## How To Run

### Prerequisites

- Node.js 18 or newer

### Install

```bash
cd shortcut-manager
npm install
```

### Start The App

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Development Mode

```bash
npm run dev
```

This uses Node's watch mode to restart the server when files change.

## Core User Flows

### Create a shortcut

1. Enter an action name
2. Focus the capture field
3. Press a key combination
4. Add optional category and description
5. Save the shortcut

### Edit a shortcut

1. Click `Edit` in the shortcut list
2. Update the fields in edit mode
3. Save changes or cancel the edit

### Import shortcuts

1. Open the import modal
2. Paste a JSON array or choose a `.json` file
3. Confirm import
4. Review validation errors or warnings if present

### Execute a shortcut

1. Save an enabled shortcut
2. Press the combination anywhere outside normal text input
3. Review the result in the runtime activity feed

## Project Structure

```text
shortcut-manager/
├── client/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       ├── api.js
│       ├── ui.js
│       ├── state.js
│       ├── shortcutCapture.js
│       ├── shortcutNormalizer.js
│       ├── shortcutRuntime.js
│       ├── actionExecutor.js
│       ├── validation.js
│       ├── filterSort.js
│       ├── importExport.js
│       └── undoRedo.js
├── server/
│   ├── app.js
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── utils/
│   ├── config/
│   └── data/
└── shared/
    └── shortcutSpec.js
```

## Folder Responsibilities

- `client/index.html`: main application structure
- `client/css/style.css`: design system, layout, states, and responsiveness
- `client/js/ui.js`: DOM rendering, activity feed, toasts, summaries, modal state
- `client/js/app.js`: application wiring and event flow
- `client/js/state.js`: client-side source of truth for shortcuts, filters, and history status
- `client/js/shortcutCapture.js`: keyboard capture interaction
- `client/js/shortcutRuntime.js`: runtime key listening and execution
- `client/js/validation.js`: form and import validation
- `server/services/shortcutService.js`: backend CRUD orchestration
- `server/services/runtimeIndexService.js`: `Map`-based runtime index
- `server/services/historyService.js`: stack-based undo and redo
- `shared/shortcutSpec.js`: shared normalization rules used across the stack

## API Summary

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/shortcuts` | List shortcuts with optional filtering |
| `GET` | `/api/shortcuts/:id` | Fetch one shortcut |
| `POST` | `/api/shortcuts` | Create a shortcut |
| `PUT` | `/api/shortcuts/:id` | Update a shortcut |
| `DELETE` | `/api/shortcuts/:id` | Delete a shortcut |
| `PATCH` | `/api/shortcuts/:id/toggle` | Toggle enabled state |
| `POST` | `/api/shortcuts/import` | Import shortcut data |
| `GET` | `/api/shortcuts/export` | Export all shortcuts |
| `POST` | `/api/history/undo` | Undo the latest write |
| `POST` | `/api/history/redo` | Redo the latest reverted write |

## Demo Notes

Built-in action labels with demo behavior include:

- Save File
- Toggle Theme
- Open Search
- Open Help
- Open Settings
- Clear Output
- New Note
- Refresh Data
- Show Notification
- Copy / Paste / Cut
- Undo / Redo
- Select All
- Find
- Print
- Zoom In / Zoom Out / Reset Zoom

If an action name does not have a built-in handler, the app still reports that the shortcut fired in the runtime feed.

## Key Engineering Concepts

- Shared normalization rules prevent mismatch between frontend capture, validation, storage, and runtime execution.
- JSON persistence keeps the project lightweight and easy to inspect during demo or viva.
- History snapshots and operation stacks make state transitions explainable and reversible.
- UI rendering is modularized so visual updates stay separate from API logic and state transitions.

## Future Scope

- category management with custom category creation
- global system-level shortcuts outside the browser
- user authentication and multi-user shortcut profiles
- analytics for most-used shortcuts
- cloud persistence or database-backed storage
- test suite coverage for key flows and API contracts

## License

MIT
