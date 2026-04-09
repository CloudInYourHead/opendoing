const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
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
  console.log('=== createWindow called ===');
  
  const appPath = app.getAppPath();
  const userDataPath = app.getPath('userData');
  const iconPath = path.join(appPath, 'build', 'icon.png');
  const preloadPath = path.join(appPath, 'electron', 'preload.js');
  const htmlPath = isDev 
    ? 'http://localhost:3000' 
    : path.join(appPath, 'dist-react', 'index.html');

  console.log('--- PATH DEBUG ---');
  console.log('isDev:', isDev);
  console.log('appPath:', appPath);
  console.log('userDataPath:', userDataPath);
  console.log('iconPath:', iconPath);
  console.log('preloadPath:', preloadPath);
  console.log('htmlPath:', htmlPath);

  console.log('--- FILE CHECKS ---');
  console.log('iconPath exists:', fs.existsSync(iconPath));
  console.log('preloadPath exists:', fs.existsSync(preloadPath));
  console.log('htmlPath exists:', fs.existsSync(htmlPath));

  // List directory contents
  try {
    console.log('--- appPath contents ---');
    const appFiles = fs.readdirSync(appPath);
    console.log('appPath files:', appFiles.slice(0, 30));
    
    if (!isDev) {
      const distReactPath = path.join(appPath, 'dist-react');
      console.log('distReactPath:', distReactPath);
      if (fs.existsSync(distReactPath)) {
        const distFiles = fs.readdirSync(distReactPath);
        console.log('dist-react files:', distFiles);
      } else {
        console.log('dist-react folder does NOT exist!');
      }
    }
  } catch (err) {
    console.log('Directory read error:', err.message);
  }

  let icon;
  try {
    if (fs.existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath);
      console.log('Icon loaded successfully');
    } else {
      icon = nativeImage.createEmpty();
      console.log('Icon not found, using empty');
    }
  } catch (err) {
    icon = nativeImage.createEmpty();
    console.log('Icon load error:', err.message);
  }

  console.log('Creating BrowserWindow...');
  mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    show: false,
    frame: true,
    resizable: true,
    icon: icon,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('!!! WINDOW CRASHED !!!');
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('!!! RENDER PROCESS GONE !!!:', details);
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDesc) => {
    console.error('!!! FAILED TO LOAD !!!:', errorCode, errorDesc);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('=== Window finished loading successfully ===');
  });

  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log('Renderer:', message);
  });

  if (isDev) {
    console.log('Loading dev URL:', htmlPath);
    mainWindow.loadURL(htmlPath);
  } else {
    console.log('Loading production file:', htmlPath);
    mainWindow.loadFile(htmlPath);
  }
  console.log('=== createWindow complete ===');

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const appPath = app.getAppPath();
  const iconPath = path.join(appPath, 'build', 'icon.png');

  let icon;
  try {
    if (fs.existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath);
    } else {
      icon = nativeImage.createEmpty();
    }
  } catch (err) {
    icon = nativeImage.createEmpty();
  }

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
  console.log('App ready, initializing...');
  console.log('isDev:', isDev);
  console.log('App path:', app.getAppPath());
  
  store = new Store();
  
  const savedHotkey = store.get('hotkey', 'Control+Shift+V');
  currentHotkey = savedHotkey;

  db = new Database();
  await db.init();
  console.log('Database initialized');
  
  createWindow();
  console.log('Window created');
  createTray();
  startClipboardPolling();
  updateGlobalShortcut(currentHotkey);
  console.log('App initialization complete');

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
