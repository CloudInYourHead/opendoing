const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage, clipboard } = require('electron');
const path = require('path');
const Store = require('electron-store');
const Database = require('./database');

let mainWindow;
let tray;
let db;
let lastClipboard = '';
let pollInterval;
let currentHotkey = 'Control+Shift+V';
let store;

const isDev = !app.isPackaged;

function createWindow() {
  const iconPath = isDev 
    ? path.join(__dirname, '../build/icon.png')
    : path.join(__dirname, '../build/icon.png');

  const icon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    show: false,
    frame: true,
    resizable: true,
    icon: icon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist-react/index.html'));
  }

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const iconPath = isDev 
    ? path.join(__dirname, '../build/icon.png')
    : path.join(__dirname, '../build/icon.png');

  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow.show() },
    { label: 'Clear History', click: () => {
      db.clearAll();
      mainWindow.webContents.send('clips-updated');
    }},
    { type: 'separator' },
    { label: 'Quit', click: () => {
      app.isQuitting = true;
      app.quit();
    }}
  ]);

  tray.setToolTip('Clipboard History Manager');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow.show());
}

function startClipboardPolling() {
  pollInterval = setInterval(() => {
    try {
      const currentClipboard = clipboard.readText();
      
      if (currentClipboard && currentClipboard !== lastClipboard) {
        lastClipboard = currentClipboard;
        const maxLength = 10000;
        const content = currentClipboard.length > maxLength 
          ? currentClipboard.substring(0, maxLength) + '...' 
          : currentClipboard;
        
        db.addClip(content, 'text');
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('clips-updated');
        }
      }
    } catch (err) {
      console.error('Clipboard read error:', err);
    }
  }, 500);
}

function updateGlobalShortcut(newHotkey) {
  globalShortcut.unregisterAll();
  currentHotkey = newHotkey;
  
  try {
    globalShortcut.register(newHotkey, () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
    console.log(`Hotkey registered: ${newHotkey}`);
  } catch (err) {
    console.error('Failed to register hotkey:', err);
    globalShortcut.register('Control+Shift+V', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
  }
}

function cleanupOldClips() {
  db.cleanupOldClips(7);
}

app.whenReady().then(async () => {
  store = new Store();
  
  const savedHotkey = store.get('hotkey', 'Control+Shift+V');
  currentHotkey = savedHotkey;

  db = new Database();
  await db.init();
  createWindow();
  createTray();
  startClipboardPolling();
  updateGlobalShortcut(currentHotkey);

  setInterval(cleanupOldClips, 3600000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  clearInterval(pollInterval);
});

ipcMain.handle('get-clips', async () => {
  return db.getClips();
});

ipcMain.handle('delete-clip', async (event, id) => {
  return db.deleteClip(id);
});

ipcMain.handle('clear-all', async () => {
  return db.clearAll();
});

ipcMain.handle('copy-clip', async (event, content) => {
  lastClipboard = content;
  clipboard.writeText(content);
  return true;
});

ipcMain.handle('search-clips', async (event, query) => {
  return db.searchClips(query);
});

ipcMain.handle('get-hotkey', async () => {
  return store.get('hotkey', 'Control+Shift+V');
});

ipcMain.handle('set-hotkey', async (event, hotkey) => {
  store.set('hotkey', hotkey);
  updateGlobalShortcut(hotkey);
  return true;
});
