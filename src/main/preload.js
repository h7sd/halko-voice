const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('halko', {
  loadConfig: () => ipcRenderer.invoke('load-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  initGroq: (apiKey) => ipcRenderer.invoke('init-groq', apiKey),
  chatGroq: (params) => ipcRenderer.invoke('chat-groq', params),
  ttsSpeak: (params) => ipcRenderer.invoke('tts-speak', params),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  registerShortcut: (params) => ipcRenderer.invoke('register-shortcut', params),
  unregisterShortcut: (id) => ipcRenderer.invoke('unregister-shortcut', id),
  unregisterAllShortcuts: () => ipcRenderer.invoke('unregister-all-shortcuts'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
  onUpdateAvailable: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('update-available', listener);
    return () => ipcRenderer.removeListener('update-available', listener);
  },
  onUpdateDownloaded: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('update-downloaded', listener);
    return () => ipcRenderer.removeListener('update-downloaded', listener);
  },
  onPresetTriggered: (callback) => {
    const listener = (_, id) => callback(id);
    ipcRenderer.on('preset-triggered', listener);
    return () => ipcRenderer.removeListener('preset-triggered', listener);
  }
});
