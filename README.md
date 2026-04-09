# Clipboard History Manager

A simple and lightweight clipboard history manager for Windows 11.

![App Preview](https://via.placeholder.com/400x300?text=Clipboard+History+Manager)

## Quick Start (Portable Version)

### Run the App

1. Navigate to `dist/win-unpacked/`
2. Double-click `Clipboard History Manager.exe`
3. The app will start and show in your system tray

**That's it! No installation required.**

### Portable Location

You can copy the entire `win-unpacked` folder anywhere and run the app from any location:
- Desktop
- USB drive
- Any folder

---

## Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Clipboard Monitoring** | Automatically captures text copied to clipboard |
| **History Storage** | Persists clips using local JSON storage |
| **Search** | Filter through past clips quickly |
| **Quick Copy** | Click any clip to re-copy it |
| **Delete Clips** | Remove individual clips or clear all |
| **Max History** | Stores up to 100 clips |
| **Auto-cleanup** | Removes clips older than 7 days |

### System Integration

| Feature | Description |
|---------|-------------|
| **System Tray** | Runs in background with tray icon |
| **Global Hotkey** | Show/hide window from anywhere |
| **Settings** | Configure app preferences |

---

## How to Use

### Main Window

1. **View Clips** - See all your clipboard history in the main window
2. **Search** - Type in the search bar to filter clips
3. **Copy** - Click any clip to copy it back to clipboard
4. **Delete** - Click "Delete" to remove a single clip
5. **Clear All** - Click "Clear All" to remove entire history

### System Tray

- **Left Click** - Show/hide the main window
- **Right Click** - Open context menu:
  - Show - Display main window
  - Clear History - Delete all clips
  - Quit - Exit the app

### Settings

1. Click the **Settings** button in the header
2. **Change Hotkey** - Click the hotkey input and press your desired key combination
3. Click **Save** to apply changes

---

## Hotkeys

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+V` | Show/Hide window (default, customizable) |

---

## Development

### Prerequisites

- Node.js 18+ 
- npm 9+

### Setup

```bash
# Clone the repository
git clone https://github.com/CloudInYourHead/opendoing.git
cd opendoing

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Build

```bash
# Build for Windows
npm run build

# Output: dist/win-unpacked/
```

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Electron | 28 | Desktop app framework |
| React | 18 | UI library |
| Vite | 5 | Build tool |
| electron-store | 8 | Data persistence |
| electron-builder | 24 | Packaging |

---

## Data Storage

Clip data is stored in:
```
%APPDATA%\clipboard-history-manager\config.json
```

Log files are stored in:
```
%APPDATA%\clipboard-history-manager\app.log
```

---

## Troubleshooting

### App doesn't show content
1. Check if the app is running (look for tray icon)
2. Try restarting the app
3. Check logs at `%APPDATA%\clipboard-history-manager\app.log`

### Global hotkey not working
1. Make sure no other app is using `Ctrl+Shift+V`
2. Try changing the hotkey in Settings

### Clipboard not being captured
1. Make sure the app window is visible when copying
2. Check that clipboard monitoring is active

---

## License

MIT License - See LICENSE file for details

---

## Author

me, lmao
