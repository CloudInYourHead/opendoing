# Clipboard History Manager

A simple clipboard history manager for Windows 11 built with Electron.

## Features

- **Automatic clipboard monitoring** - Captures text copied to clipboard
- **History storage** - Persists clips with SQLite
- **Search** - Filter through past clips quickly
- **Quick copy** - Click to re-copy any past clip
- **Global hotkey** - Press `Ctrl+Shift+V` to show/hide
- **System tray** - Runs in background with tray icon
- **Auto-cleanup** - Removes clips older than 7 days

## Hotkeys

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+V` | Show/Hide window |

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for Windows
npm run build
```

## Tech Stack

- Electron 28
- React 18
- SQLite (better-sqlite3)
- Vite
- clipboardy

## License

MIT
