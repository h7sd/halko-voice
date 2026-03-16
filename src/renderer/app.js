// === STATE ===
let config = {
  groqApiKey: '',
  discordBotToken: '',
  selectedVoice: 'de-DE-ConradNeural',
  selectedModel: 'llama-3.3-70b-versatile',
  ttsEngine: 'edge',
  guildId: '',
  voiceChannelId: '',
  textChannelId: ''
};
let discordConnected = false;
let inVoiceChannel = false;
let groqReady = false;
let lastSpokenText = '';

const EDGE_VOICES_DE = [
  { id: 'de-DE-ConradNeural', label: 'Conrad (DE, männlich)' },
  { id: 'de-DE-KatjaNeural', label: 'Katja (DE, weiblich)' },
  { id: 'de-DE-KillianNeural', label: 'Killian (DE, männlich)' },
  { id: 'de-AT-JonasNeural', label: 'Jonas (AT, männlich)' },
  { id: 'de-CH-LeniNeural', label: 'Leni (CH, weiblich)' },
  { id: 'en-US-AriaNeural', label: 'Aria (EN, weiblich)' },
  { id: 'en-US-GuyNeural', label: 'Guy (EN, männlich)' },
  { id: 'en-GB-RyanNeural', label: 'Ryan (GB, männlich)' }
];
const GROQ_VOICES = [
  { id: 'daniel', label: 'Daniel (männlich, warm)' },
  { id: 'austin', label: 'Austin (männlich, energisch)' },
  { id: 'troy', label: 'Troy (männlich, klar)' },
  { id: 'autumn', label: 'Autumn (weiblich, warm)' },
  { id: 'diana', label: 'Diana (weiblich, klar)' },
  { id: 'hannah', label: 'Hannah (weiblich, sanft)' }
];

// === INIT ===
window.addEventListener('DOMContentLoaded', async () => {
  config = await window.halko.loadConfig() || config;
  applyConfigToUI();
  populateVoiceSelects();
  updateStatusBadges();
  if (config.groqApiKey) {
    await initGroqSilent();
  }
});

function applyConfigToUI() {
  document.getElementById('groq-key-input').value = config.groqApiKey || '';
  document.getElementById('model-select').value = config.selectedModel || 'llama-3.3-70b-versatile';
  document.getElementById('settings-tts-engine').value = config.ttsEngine || 'edge';
  document.getElementById('voice-tts-engine').value = config.ttsEngine || 'edge';
  if (config.discordBotToken) {
    document.getElementById('discord-token-input').value = config.discordBotToken;
  }
  onTtsEngineChange();
}

function populateVoiceSelects(engine) {
  const eng = engine || config.ttsEngine || 'edge';
  const voices = eng === 'groq' ? GROQ_VOICES : EDGE_VOICES_DE;
  const selectors = ['voice-voice-select', 'settings-voice-select'];
  selectors.forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = voices.map(v => `<option value="${v.id}">${v.label}</option>`).join('');
    sel.value = config.selectedVoice || voices[0].id;
  });
}

function onTtsEngineChange() {
  const eng = document.getElementById('settings-tts-engine').value;
  document.getElementById('voice-tts-engine').value = eng;
  config.ttsEngine = eng;
  populateVoiceSelects(eng);
  const hint = document.getElementById('tts-engine-hint');
  if (eng === 'groq') {
    hint.textContent = 'Groq Orpheus TTS: Expressive englische Stimmen. Benötigt API Key + Terms unter console.groq.com/playground?model=canopylabs%2Forpheus-v1-english';
    config.selectedVoice = 'daniel';
  } else {
    hint.textContent = 'Edge TTS nutzt Microsoft Azure Neural Voices — kostenlos, hohe Qualität';
    config.selectedVoice = 'de-DE-ConradNeural';
  }
  populateVoiceSelects(eng);
  saveConfig();
}

function saveTtsPrefs() {
  config.ttsEngine = document.getElementById('voice-tts-engine').value;
  config.selectedVoice = document.getElementById('voice-voice-select').value;
  document.getElementById('settings-tts-engine').value = config.ttsEngine;
  document.getElementById('settings-voice-select').value = config.selectedVoice;
  saveConfig();
}

async function saveConfig() {
  await window.halko.saveConfig(config);
}

// === PANEL NAV ===
function switchPanel(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  btn.classList.add('active');
}

// === STATUS ===
function updateStatusBadges() {
  const globalEl = document.getElementById('global-status');

  const voiceBadge = document.getElementById('voice-conn-badge');
  if (inVoiceChannel) {
    voiceBadge.className = 'badge live';
    voiceBadge.innerHTML = '<span class="badge-dot"></span>In Voice';
  } else if (discordConnected) {
    voiceBadge.className = 'badge ready';
    voiceBadge.innerHTML = '<span class="badge-dot"></span>Bot bereit';
  } else {
    voiceBadge.className = 'badge off';
    voiceBadge.innerHTML = '<span class="badge-dot"></span>Kein Voice';
  }

  const aiBadge = document.getElementById('ai-status-badge');
  if (groqReady) {
    aiBadge.className = 'badge live';
    aiBadge.innerHTML = '<span class="badge-dot"></span>Verbunden';
    document.getElementById('chat-send-btn').disabled = false;
  } else {
    aiBadge.className = 'badge off';
    aiBadge.innerHTML = '<span class="badge-dot"></span>Nicht verbunden';
    document.getElementById('chat-send-btn').disabled = true;
  }

  const discBadge = document.getElementById('discord-badge');
  if (inVoiceChannel) {
    discBadge.className = 'badge live';
    discBadge.innerHTML = '<span class="badge-dot"></span>In Voice';
  } else if (discordConnected) {
    discBadge.className = 'badge ready';
    discBadge.innerHTML = '<span class="badge-dot"></span>Bot online';
  } else {
    discBadge.className = 'badge off';
    discBadge.innerHTML = '<span class="badge-dot"></span>Offline';
  }

  document.getElementById('voice-discord-play-btn').disabled = !inVoiceChannel;

  const bar = document.getElementById('voice-status-bar');
  bar.style.display = inVoiceChannel ? 'flex' : 'none';

  if (inVoiceChannel) {
    globalEl.innerHTML = '<span class="badge live" style="font-size:10px"><span class="badge-dot"></span>Live</span>';
  } else if (discordConnected || groqReady) {
    globalEl.innerHTML = '<span class="badge ready" style="font-size:10px"><span class="badge-dot"></span>Bereit</span>';
  } else {
    globalEl.innerHTML = '';
  }
}

// === GROQ ===
async function saveAndInitGroq() {
  const key = document.getElementById('groq-key-input').value.trim();
  const model = document.getElementById('model-select').value;
  if (!key) { toast('Bitte Groq API Key eingeben', 'error'); return; }
  config.groqApiKey = key;
  config.selectedModel = model;
  await saveConfig();
  const res = await window.halko.initGroq(key);
  if (res.success) {
    groqReady = true;
    updateStatusBadges();
    toast('Groq verbunden! Motivator bereit.', 'success');
    showWelcomeMessage();
  } else {
    toast('Fehler: ' + res.error, 'error');
  }
}

async function initGroqSilent() {
  const res = await window.halko.initGroq(config.groqApiKey);
  if (res.success) {
    groqReady = true;
    updateStatusBadges();
    showWelcomeMessage();
  }
}

function showWelcomeMessage() {
  const msgs = document.getElementById('chat-messages');
  if (msgs.querySelector('.welcome-msg')) return;
  msgs.innerHTML = '';
  appendChatMessage('ai', 'Hey Halko! Schön dass du da bist. Ich bin dein persönlicher Motivator — immer an deiner Seite. Wie geht\'s dir heute? Was beschäftigt dich gerade? Du kannst mir alles sagen!');
}

// === CHAT ===
function chatInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChat();
  }
}

async function sendChat() {
  if (!groqReady) { toast('Erst Groq API Key in Einstellungen eingeben', 'error'); return; }
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  autoResize(input);

  appendChatMessage('user', text);
  const typing = showTyping();

  const res = await window.halko.chatGroq({ message: text, model: config.selectedModel });
  removeTyping(typing);

  if (res.success) {
    appendChatMessage('ai', res.reply);
    // Optional: auto-TTS the reply
    // await speakText(res.reply);
  } else {
    appendChatMessage('ai', 'Oops, da ist was schiefgelaufen: ' + res.error);
  }
}

function appendChatMessage(role, text) {
  const container = document.getElementById('chat-messages');
  const empty = container.querySelector('.chat-empty');
  if (empty) empty.remove();
  const div = document.createElement('div');
  div.className = `msg ${role === 'ai' ? 'ai' : 'user'}`;
  const time = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  if (role === 'ai') {
    div.innerHTML = `
      <span class="msg-label">AI</span>
      <div class="msg-bubble">${escapeHtml(text)}</div>
      <div class="msg-time">${time}</div>
    `;
  } else {
    div.innerHTML = `
      <div class="msg-bubble">${escapeHtml(text)}</div>
      <div class="msg-time">${time}</div>
    `;
  }
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'typing-wrap';
  div.innerHTML = `
    <div class="typing-bubble">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function removeTyping(el) {
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

// === VOICE ===
function voiceInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendVoice();
  }
}

function insertQuickPhrase(phrase) {
  const input = document.getElementById('voice-input');
  input.value = phrase;
  input.focus();
  autoResize(input);
}

async function sendVoice() {
  const input = document.getElementById('voice-input');
  const text = input.value.trim();
  if (!text) return;
  lastSpokenText = text;
  input.value = '';
  autoResize(input);

  const btn = document.getElementById('voice-send-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  addVoiceHistory(text, false);

  const engine = document.getElementById('voice-tts-engine').value;
  const voice = document.getElementById('voice-voice-select').value;

  const res = await window.halko.ttsSpeak({
    text,
    engine,
    voice,
    apiKey: config.groqApiKey
  });

  btn.disabled = false;
  btn.innerHTML = '&#9658;';

  if (res.success) {
    await window.halko.playAudio(res.filePath);
    addVoiceHistory(`[Audio] ${text}`, true);
  } else {
    toast('TTS Fehler: ' + res.error, 'error');
  }
}

async function sendToDiscordVoice() {
  const input = document.getElementById('voice-input');
  const text = input.value.trim() || lastSpokenText;
  if (!text) { toast('Nichts zum Senden', 'error'); return; }
  if (!inVoiceChannel) { toast('Erst Discord Voice beitreten', 'error'); return; }

  const btn = document.getElementById('voice-discord-play-btn');
  btn.disabled = true;
  btn.textContent = '...';

  const engine = document.getElementById('voice-tts-engine').value;
  const voice = document.getElementById('voice-voice-select').value;

  const res = await window.halko.discordPlayTts({
    text,
    engine,
    voice,
    apiKey: config.groqApiKey
  });

  btn.disabled = false;
  btn.innerHTML = '&#128172; Discord';

  if (res.success) {
    if (input.value.trim()) {
      lastSpokenText = input.value.trim();
      input.value = '';
      autoResize(input);
    }
    addVoiceHistory(`[Discord] ${text}`, true);
    toast('Im Voice Channel gesprochen!', 'success');
  } else {
    toast('Discord Fehler: ' + res.error, 'error');
  }
}

function addVoiceHistory(text, sent) {
  const container = document.getElementById('voice-history');
  const empty = container.querySelector('.voice-empty');
  if (empty) empty.remove();
  const div = document.createElement('div');
  div.className = 'history-item';
  const time = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  div.innerHTML = `
    <span class="h-tag ${sent ? 'discord' : 'local'}">${sent ? 'Discord' : 'Lokal'}</span>
    <span class="h-text">${escapeHtml(text.replace(/^\[(Discord|Audio)\] /, ''))}</span>
    <span class="h-time">${time}</span>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// === DISCORD ===
async function connectDiscord() {
  const token = document.getElementById('discord-token-input').value.trim();
  if (!token) { toast('Bitte Bot Token eingeben', 'error'); return; }

  const spinner = document.getElementById('discord-connect-spinner');
  spinner.innerHTML = '<span class="spinner"></span>&nbsp;';

  config.discordBotToken = token;
  await saveConfig();

  const res = await window.halko.discordConnect(token);
  spinner.innerHTML = '';

  if (res.success) {
    discordConnected = true;
    updateStatusBadges();
    toast(`Bot "${res.botName}" verbunden!`, 'success');
    document.getElementById('discord-guild-section').style.display = 'block';
    document.getElementById('discord-disconnect-btn').style.display = '';

    const guildSel = document.getElementById('guild-select');
    guildSel.innerHTML = '<option value="">— Server auswählen —</option>' +
      res.guilds.map(g => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join('');
  } else {
    toast('Verbindung fehlgeschlagen: ' + res.error, 'error');
  }
}

async function disconnectDiscord() {
  discordConnected = false;
  inVoiceChannel = false;
  updateStatusBadges();
  document.getElementById('discord-guild-section').style.display = 'none';
  document.getElementById('discord-disconnect-btn').style.display = 'none';
  toast('Discord getrennt', 'info');
}

async function loadChannels() {
  const guildId = document.getElementById('guild-select').value;
  if (!guildId) return;
  config.guildId = guildId;

  const voiceRes = await window.halko.discordGetChannels(guildId);
  const textRes = await window.halko.getTextChannels(guildId);

  if (voiceRes.success) {
    const sel = document.getElementById('voice-channel-select');
    sel.innerHTML = '<option value="">— Voice Channel auswählen —</option>' +
      voiceRes.channels.map(c => `<option value="${c.id}">&#128266; ${escapeHtml(c.name)}</option>`).join('');
    if (config.voiceChannelId) sel.value = config.voiceChannelId;
  }

  if (textRes.success) {
    const sel = document.getElementById('text-channel-select');
    sel.innerHTML = '<option value="">— Text Channel (optional) —</option>' +
      textRes.channels.map(c => `<option value="${c.id}"># ${escapeHtml(c.name)}</option>`).join('');
    if (config.textChannelId) sel.value = config.textChannelId;
  }
}

async function joinVoice() {
  const guildId = document.getElementById('guild-select').value;
  const channelId = document.getElementById('voice-channel-select').value;
  if (!guildId || !channelId) { toast('Server und Voice Channel auswählen', 'error'); return; }

  config.guildId = guildId;
  config.voiceChannelId = channelId;
  config.textChannelId = document.getElementById('text-channel-select').value;
  await saveConfig();

  const res = await window.halko.discordJoinVoice({ guildId, channelId });
  if (res.success) {
    inVoiceChannel = true;
    const name = document.getElementById('voice-channel-select').selectedOptions[0].text;
    document.getElementById('voice-channel-name').textContent = name;
    document.getElementById('join-voice-btn').style.display = 'none';
    document.getElementById('leave-voice-btn').style.display = '';
    updateStatusBadges();
    toast('Voice Channel beigetreten!', 'success');
  } else {
    toast('Fehler: ' + res.error, 'error');
  }
}

async function leaveVoice() {
  const res = await window.halko.discordLeaveVoice();
  inVoiceChannel = false;
  document.getElementById('join-voice-btn').style.display = '';
  document.getElementById('leave-voice-btn').style.display = 'none';
  updateStatusBadges();
  if (res.success) toast('Voice Channel verlassen', 'info');
}

// === SETTINGS ===
async function testTts() {
  const engine = document.getElementById('settings-tts-engine').value;
  const voice = document.getElementById('settings-voice-select').value;
  const text = engine === 'groq'
    ? 'Hey, ich bin Halkos Stimme! Alles wird gut!'
    : 'Hey, ich bin Halkos Stimme! Alles wird gut!';
  const res = await window.halko.ttsSpeak({ text, engine, voice, apiKey: config.groqApiKey });
  if (res.success) {
    await window.halko.playAudio(res.filePath);
    toast('TTS Test erfolgreich!', 'success');
  } else {
    toast('Fehler: ' + res.error, 'error');
  }
}

async function testGroq() {
  if (!groqReady) { toast('Zuerst API Key speichern', 'error'); return; }
  const res = await window.halko.chatGroq({ message: 'Sage mir einen kurzen Motivationsspruch auf Deutsch!', model: config.selectedModel });
  if (res.success) {
    toast('Groq: ' + res.reply.substring(0, 80) + '...', 'success');
  } else {
    toast('Fehler: ' + res.error, 'error');
  }
}

// === UTILITIES ===
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '<br>');
}

function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icon = type === 'success' ? '&#10003;' : type === 'error' ? '&#10007;' : 'i';
  el.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}
