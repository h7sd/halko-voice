const { app, BrowserWindow, ipcMain, shell, globalShortcut } = require('electron');
const { autoUpdater } = require('electron-updater');

const path = require('path');
const fs = require('fs');

const isDev = process.argv.includes('--dev');

let mainWindow;
let groqClient = null;
let chatHistory = [];
let registeredShortcuts = new Map();

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

const HARDCODED = {
  groqApiKey: '',
};

function loadConfig() {
  let saved = {};
  try {
    if (fs.existsSync(CONFIG_PATH)) saved = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {}
  
  // Migration logic if old presets exist but no categories
  if (saved.presets && !saved.categories) {
    saved.categories = [{ id: 'default', name: 'Allgemein', presets: saved.presets }];
    saved.activeCategoryId = 'default';
    delete saved.presets;
  }

  return {
    selectedVoice: 'de-DE-ConradNeural',
    selectedModel: 'llama-3.3-70b-versatile',
    ttsEngine: 'edge',
    categories: [{ id: 'default', name: 'Allgemein', presets: [] }],
    activeCategoryId: 'default',
    ...saved,
    groqApiKey: HARDCODED.groqApiKey,
  };
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// === TTS ===
const GROQ_VALID_VOICES = ['autumn', 'diana', 'hannah', 'austin', 'daniel', 'troy'];

async function ttsGroq(text, voice, apiKey) {
  const Groq = require('groq-sdk');
  const client = apiKey ? new Groq.default({ apiKey }) : groqClient;
  if (!client) return { success: false, error: 'Kein API Key' };
  const safeVoice = GROQ_VALID_VOICES.includes(voice) ? voice : 'daniel';
  const chunks = [];
  for (let i = 0; i < text.length; i += 200) {
    const chunk = text.slice(i, i + 200);
    const response = await client.audio.speech.create({
      model: 'canopylabs/orpheus-v1-english',
      voice: safeVoice,
      input: chunk,
      response_format: 'wav'
    });
    chunks.push(Buffer.from(await response.arrayBuffer()));
  }
  const buffer = Buffer.concat(chunks);
  const tmpPath = path.join(app.getPath('temp'), `halko_tts_${Date.now()}.wav`);
  fs.writeFileSync(tmpPath, buffer);
  return { success: true, filePath: tmpPath };
}

async function ttsEdge(text, voice) {
  const { Communicate } = require('edge-tts-universal');
  const tmpPath = path.join(app.getPath('temp'), `halko_tts_${Date.now()}.mp3`);
  const comm = new Communicate(text, { voice: voice || 'de-DE-ConradNeural' });
  const chunks = [];
  for await (const chunk of comm.stream()) {
    if (chunk.type === 'audio' && chunk.data) chunks.push(chunk.data);
  }
  if (chunks.length === 0) throw new Error('Kein Audio von Edge TTS');
  fs.writeFileSync(tmpPath, Buffer.concat(chunks));
  return { success: true, filePath: tmpPath };
}

// === Window ===
function createWindow() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;
  
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0f0f13',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') return callback(true);
    callback(false);
  });
  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'media') return true;
    return false;
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist-renderer/index.html'));
  }
}

let updateCheckTimeout;
let hasUpdateResponse = false;

console.log('[Main] AutoUpdater konfiguriert mit:');
console.log('[Main] - App ID:', 'com.halko.voice');
console.log('[Main] - GitHub Owner: h7sd');
console.log('[Main] - GitHub Repo: halko-voice');
console.log('[Main] - Feed URL: https://github.com/h7sd/halko-voice/releases/latest/download/latest.yml');

// Auto-updater events setup (EINMAL beim laden)
autoUpdater.on('checking-for-update', () => {
  console.log('[Updater] Suche nach Updates...');
  hasUpdateResponse = false;
  if (mainWindow) mainWindow.webContents.send('checking-for-update');
  
  // Timeout: Nach 3 Sekunden wenn keine Response, "up to date" anzeigen
  updateCheckTimeout = setTimeout(() => {
    if (!hasUpdateResponse) {
      console.log('[Updater] Timeout - keine Response');
      if (mainWindow) mainWindow.webContents.send('update-not-available');
    }
  }, 3000);
});

autoUpdater.on('update-available', (info) => {
  clearTimeout(updateCheckTimeout);
  hasUpdateResponse = true;
  console.log('[Updater] Update verfügbar:', info.version);
  if (mainWindow) mainWindow.webContents.send('update-available');
});

autoUpdater.on('update-not-available', () => {
  clearTimeout(updateCheckTimeout);
  hasUpdateResponse = true;
  console.log('[Updater] Keine neuen Updates.');
  if (mainWindow) mainWindow.webContents.send('update-not-available');
});

autoUpdater.on('error', (err) => {
  clearTimeout(updateCheckTimeout);
  hasUpdateResponse = true;
  console.error('[Updater] Fehler DETAIL:', err);
  console.error('[Updater] Error Message:', err.message);
  console.error('[Updater] Error Stack:', err.stack);
  if (mainWindow) mainWindow.webContents.send('update-error', err.message);
});

autoUpdater.on('download-progress', (progress) => {
  console.log(`[Updater] Download: ${progress.percent}%`);
  if (mainWindow) mainWindow.webContents.send('update-progress', progress.percent);
});

autoUpdater.on('update-downloaded', (info) => {
  clearTimeout(updateCheckTimeout);
  console.log('[Updater] Update fertig heruntergeladen:', info.version);
  if (mainWindow) mainWindow.webContents.send('update-downloaded');
  setTimeout(() => autoUpdater.quitAndInstall(), 500);
});

app.whenReady().then(async () => {
  createWindow();

  // Verzögerte Update-Prüfung (nach 3 Sekunden)
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 3000);
  
  // Jede Stunde nach Updates suchen
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 60 * 60 * 1000);

  const cfg = loadConfig();
  if (cfg.groqApiKey) {
    try {
      const Groq = require('groq-sdk');
      groqClient = new Groq.default({ apiKey: cfg.groqApiKey });
      chatHistory = [{ role: 'system', content: `Du bist Halko's persönlicher Motivationsbegleiter. Halko hat eine Kieferoperation hinter sich und kann gerade nicht sprechen. Du bist seine Stimme und sein Freund. Sei motivierend, aufmunternd, warmherzig und humorvoll. Halte deine Antworten kurz (max 2-3 Sätze), da sie vorgelesen werden. Antworte immer auf Deutsch.` }];
    } catch {}
  }

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// === IPC ===
ipcMain.handle('load-config', () => loadConfig());
ipcMain.handle('save-config', (_, config) => { saveConfig(config); return true; });
ipcMain.handle('window-minimize', () => mainWindow.minimize());
ipcMain.handle('window-maximize', () => { if (mainWindow.isMaximized()) mainWindow.unmaximize(); else mainWindow.maximize(); });
ipcMain.handle('window-close', () => app.quit());
ipcMain.handle('check-for-updates', () => {
  console.log('[IPC] check-for-updates aufgerufen');
  autoUpdater.checkForUpdatesAndNotify();
  return true;
});
ipcMain.handle('quit-and-install', () => {
  console.log('[IPC] quit-and-install aufgerufen');
  autoUpdater.quitAndInstall();
});

ipcMain.handle('init-groq', async (_, apiKey) => {
  try {
    const Groq = require('groq-sdk');
    groqClient = new Groq.default({ apiKey });
    chatHistory = [{
      role: 'system',
      content: `Du bist Halko's persönlicher Motivationsbegleiter. Halko hat eine Kieferoperation hinter sich und kann gerade nicht sprechen. Du bist seine Stimme und sein Freund. Sei motivierend, aufmunternd, warmherzig und humorvoll. Halte deine Antworten kurz (max 2-3 Sätze), da sie vorgelesen werden. Antworte immer auf Deutsch.`
    }];
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('chat-groq', async (_, { message, model }) => {
  try {
    if (!groqClient) return { success: false, error: 'Groq nicht initialisiert' };
    chatHistory.push({ role: 'user', content: message });
    const res = await groqClient.chat.completions.create({
      messages: chatHistory,
      model: model || 'llama-3.3-70b-versatile',
      max_tokens: 300,
      temperature: 0.8
    });
    const reply = res.choices[0].message.content;
    chatHistory.push({ role: 'assistant', content: reply });
    if (chatHistory.length > 20) chatHistory = [chatHistory[0], ...chatHistory.slice(-18)];
    return { success: true, reply };
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('tts-speak', async (_, { text, engine, voice, apiKey }) => {
  try {
    if (engine === 'groq') {
      try {
        return await ttsGroq(text, voice, apiKey);
      } catch (groqErr) {
        console.log('[TTS] Groq fehlgeschlagen, fallback zu Edge TTS:', groqErr.message);
        return await ttsEdge(text, 'de-DE-ConradNeural');
      }
    }
    return await ttsEdge(text, voice);
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('open-external', (_, url) => {
  shell.openExternal(url);
});

ipcMain.handle('register-shortcut', (_, { id, key }) => {
  if (registeredShortcuts.has(id)) {
    globalShortcut.unregister(registeredShortcuts.get(id));
  }
  try {
    const success = globalShortcut.register(key, () => {
      if (mainWindow) mainWindow.webContents.send('preset-triggered', id);
    });
    if (success) {
      registeredShortcuts.set(id, key);
      return { success: true };
    }
    return { success: false, error: 'Konnte Shortcut nicht registrieren' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('unregister-shortcut', (_, id) => {
  if (registeredShortcuts.has(id)) {
    globalShortcut.unregister(registeredShortcuts.get(id));
    registeredShortcuts.delete(id);
    return true;
  }
  return false;
});

ipcMain.handle('unregister-all-shortcuts', () => {
  globalShortcut.unregisterAll();
  registeredShortcuts.clear();
  return true;
});
