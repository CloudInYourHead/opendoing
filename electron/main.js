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

function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}`;
  console.log(logLine);
  
  try {
    const logPath = path.join(app.getPath('userData'), 'app.log');
    fs.appendFileSync(logPath, logLine + '\n');
  } catch (err) {
    // Ignore logging errors
  }
}

function createWindow() {
  log('=== createWindow called ===');
  
  // Use __dirname which works reliably in packaged apps
  const thisDir = __dirname;
  log('__dirname: ' + thisDir);
  
  // For packaged apps with extraResources:
  // electron/ is at: resources/app/electron/
  // build/ is at: resources/app/build/
  // dist-react/ is at: resources/dist-react/ (via extraResources)
  
  let iconPath, preloadPath, htmlPath;
  
  if (isDev) {
    iconPath = path.join(__dirname, '../build/icon.png');
    preloadPath = path.join(__dirname, 'preload.js');
    htmlPath = 'http://localhost:3000';
  } else {
    // In production with extraResources, dist-react is in process.resourcesPath
    const resourcesPath = process.resourcesPath;
    log('resourcesPath: ' + resourcesPath);
    
    iconPath = path.join(__dirname, '../build/icon.png');
    preloadPath = path.join(__dirname, 'preload.js');
    htmlPath = path.join(resourcesPath, 'dist-react', 'index.html');
  }

  log('--- PATH DEBUG ---');
  log('isDev: ' + isDev);
  log('iconPath: ' + iconPath);
  log('preloadPath: ' + preloadPath);
  log('htmlPath: ' + htmlPath);

  // Check files
  log('iconPath exists: ' + fs.existsSync(iconPath));
  log('preloadPath exists: ' + fs.existsSync(preloadPath));
  log('htmlPath exists: ' + fs.existsSync(htmlPath));

  // List directory structure
  try {
    const parentDir = path.dirname(__dirname);
    log('parentDir: ' + parentDir);
    const parentFiles = fs.readdirSync(parentDir);
    log('parentDir files: ' + JSON.stringify(parentFiles));
    
    // Check resources path for extraResources
    if (!isDev) {
      const resourcesPath = process.resourcesPath;
      log('resourcesPath: ' + resourcesPath);
      if (fs.existsSync(resourcesPath)) {
        const resourcesFiles = fs.readdirSync(resourcesPath);
        log('resourcesPath files: ' + JSON.stringify(resourcesFiles));
        
        const distReactPath = path.join(resourcesPath, 'dist-react');
        if (fs.existsSync(distReactPath)) {
          const distReactFiles = fs.readdirSync(distReactPath);
          log('dist-react files: ' + JSON.stringify(distReactFiles));
        }
      }
    }
  } catch (err) {
    log('Directory error: ' + err.message);
  }

  let icon;
  try {
    if (fs.existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath);
      log('Icon loaded successfully');
    } else {
      icon = nativeImage.createEmpty();
      log('Icon not found, using empty');
    }
  } catch (err) {
    icon = nativeImage.createEmpty();
    log('Icon load error: ' + err.message);
  }

  log('Creating BrowserWindow...');
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
    log('!!! WINDOW CRASHED !!!');
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    log('!!! RENDER PROCESS GONE !!!: ' + JSON.stringify(details));
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDesc) => {
    log('!!! FAILED TO LOAD !!!: ' + errorCode + ' ' + errorDesc);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    log('=== Window finished loading successfully ===');
  });

  mainWindow.webContents.on('console-message', (event, level, message) => {
    log('Renderer: ' + message);
  });

  if (isDev) {
    log('Loading dev URL: ' + htmlPath);
    mainWindow.loadURL(htmlPath);
  } else {
    log('Loading production file: ' + htmlPath);
    mainWindow.loadFile(htmlPath);
  }
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log('Window shown');
  });
  
  log('=== createWindow complete ===');
}

function createTray() {
  let iconPath;
  
  if (isDev) {
    iconPath = path.join(__dirname, '../build/icon.png');
  } else {
    iconPath = path.join(__dirname, '../build/icon.png');
  }

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
      log('Clipboard read error: ' + err.message);
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
    log('Hotkey registered: ' + newHotkey);
  } catch (err) {
    log('Failed to register hotkey: ' + err.message);
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
  log('App ready, initializing...');
  log('isDev: ' + isDev);
  log('User data path: ' + app.getPath('userData'));
  
  store = new Store();
  
  const savedHotkey = store.get('hotkey', 'Control+Shift+V');
  currentHotkey = savedHotkey;

  db = new Database();
  await db.init();
  log('Database initialized');
  
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
