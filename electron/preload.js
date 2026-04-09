const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getClips: () => ipcRenderer.invoke('get-clips'),
  deleteClip: (id) => ipcRenderer.invoke('delete-clip', id),
  clearAll: () => ipcRenderer.invoke('clear-all'),
  copyClip: (content) => ipcRenderer.invoke('copy-clip', content),
  searchClips: (query) => ipcRenderer.invoke('search-clips', query),
  getHotkey: () => ipcRenderer.invoke('get-hotkey'),
  setHotkey: (hotkey) => ipcRenderer.invoke('set-hotkey', hotkey),
  onClipsUpdated: (callback) => {
    ipcRenderer.on('clips-updated', callback);
    return () => ipcRenderer.removeListener('clips-updated', callback);
  }
});
