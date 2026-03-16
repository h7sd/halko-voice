const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, VoiceConnectionStatus, StreamType } = require('@discordjs/voice');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

let ffmpegBin = 'ffmpeg';
try {
  ffmpegBin = require('ffmpeg-static');
  process.env.PATH = path.dirname(ffmpegBin) + path.delimiter + (process.env.PATH || '');
} catch {}

let discordClient = null;
let voiceConnection = null;
let audioPlayer = null;

function send(type, data, id) {
  const msg = { type, ...data };
  if (id !== undefined) msg._id = id;
  process.stdout.write(JSON.stringify(msg) + '\n');
}

async function handleCommand(cmd) {
  const id = cmd._id;
  try {
    if (cmd.type === 'connect') {
      if (discordClient) { try { discordClient.destroy(); } catch {} discordClient = null; }
      discordClient = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages]
      });
      await new Promise((resolve, reject) => {
        discordClient.once('ready', resolve);
        discordClient.once('error', reject);
        discordClient.login(cmd.token).catch(reject);
        setTimeout(() => reject(new Error('Login Timeout nach 20s — Token ungültig oder kein Internet')), 20000);
      });
      const guilds = [...discordClient.guilds.cache.values()].map(g => ({ id: g.id, name: g.name }));
      send('connected', { botName: discordClient.user.username, guilds }, id);
    }

    else if (cmd.type === 'getVoiceChannels') {
      const guild = discordClient.guilds.cache.get(cmd.guildId);
      const channels = [...guild.channels.cache.values()].filter(c => c.type === 2).map(c => ({ id: c.id, name: c.name }));
      send('voiceChannels', { channels }, id);
    }

    else if (cmd.type === 'getTextChannels') {
      const guild = discordClient.guilds.cache.get(cmd.guildId);
      const channels = [...guild.channels.cache.values()].filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
      send('textChannels', { channels }, id);
    }

    else if (cmd.type === 'joinVoice') {
      const guild = discordClient.guilds.cache.get(cmd.guildId);
      const channel = guild.channels.cache.get(cmd.channelId);
      if (!channel) { send('error', { message: 'Channel nicht gefunden' }, id); return; }

      if (voiceConnection) { try { voiceConnection.destroy(); } catch {} voiceConnection = null; audioPlayer = null; await new Promise(r => setTimeout(r, 300)); }

      voiceConnection = joinVoiceChannel({
        channelId: cmd.channelId,
        guildId: cmd.guildId,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false
      });

      voiceConnection.on('debug', (msg) => {
        process.stderr.write('[VoiceDebug] ' + msg + '\n');
      });

      await new Promise((resolve, reject) => {
        const t = setTimeout(() => {
          const status = voiceConnection ? voiceConnection.state.status : 'gone';
          reject(new Error(`Voice Timeout (Status: ${status})`));
        }, 20000);
        voiceConnection.on('stateChange', (_, s) => {
          process.stderr.write(`[Voice] -> ${s.status}\n`);
          if (s.status === VoiceConnectionStatus.Ready) { clearTimeout(t); resolve(); }
          else if (s.status === VoiceConnectionStatus.Destroyed) { clearTimeout(t); reject(new Error('Verbindung abgebrochen')); }
        });
        voiceConnection.on('error', (e) => { process.stderr.write('[VoiceErr] ' + e.message + '\n'); });
      });

      audioPlayer = createAudioPlayer();
      voiceConnection.subscribe(audioPlayer);
      send('joinedVoice', {}, id);
    }

    else if (cmd.type === 'leaveVoice') {
      if (voiceConnection) { try { voiceConnection.destroy(); } catch {} voiceConnection = null; audioPlayer = null; }
      send('leftVoice', {}, id);
    }

    else if (cmd.type === 'playFile') {
      if (!voiceConnection || !audioPlayer) { send('error', { message: 'Nicht in Voice Channel' }, id); return; }

      const vcStatus = voiceConnection.state.status;
      process.stderr.write('[Play] VoiceStatus: ' + vcStatus + '\n');

      if (vcStatus !== VoiceConnectionStatus.Ready) {
        send('error', { message: 'Voice nicht bereit (Status: ' + vcStatus + ')' }, id);
        return;
      }

      if (!fs.existsSync(cmd.filePath)) {
        send('error', { message: 'Audio-Datei nicht gefunden: ' + cmd.filePath }, id);
        return;
      }

      process.stderr.write('[Play] Datei: ' + cmd.filePath + '\n');

      audioPlayer.removeAllListeners('stateChange');
      audioPlayer.removeAllListeners('error');

      let responded = false;
      const respondOnce = (ok, errMsg) => {
        if (responded) return;
        responded = true;
        if (ok) send('playing', {}, id);
        else send('error', { message: errMsg }, id);
      };

      audioPlayer.on('error', (e) => {
        process.stderr.write('[PlayerErr] ' + e.message + '\n');
        respondOnce(false, 'Player Fehler: ' + e.message);
      });

      const ffmpegProc = spawn(ffmpegBin, [
        '-i', cmd.filePath,
        '-analyzeduration', '0',
        '-loglevel', 'error',
        '-f', 's16le',
        '-ar', '48000',
        '-ac', '2',
        'pipe:1'
      ]);

      ffmpegProc.stderr.on('data', (d) => {
        process.stderr.write('[ffmpeg] ' + d.toString());
      });

      ffmpegProc.on('error', (e) => {
        process.stderr.write('[ffmpegErr] ' + e.message + '\n');
        respondOnce(false, 'ffmpeg Fehler: ' + e.message);
      });

      const resource = createAudioResource(ffmpegProc.stdout, { inputType: StreamType.Raw });
      audioPlayer.play(resource);
      process.stderr.write('[Play] play() gestartet\n');
      respondOnce(true);
    }

    else if (cmd.type === 'sendText') {
      const guild = discordClient.guilds.cache.get(cmd.guildId);
      const channel = guild.channels.cache.get(cmd.channelId);
      await channel.send(cmd.text);
      send('textSent', {}, id);
    }

    else if (cmd.type === 'destroy') {
      if (voiceConnection) { try { voiceConnection.destroy(); } catch {} }
      if (discordClient) { try { discordClient.destroy(); } catch {} }
      process.exit(0);
    }

  } catch (err) {
    process.stderr.write('[WorkerErr] ' + err.message + '\n');
    send('error', { message: err.message }, id);
  }
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop();
  for (const line of lines) {
    if (line.trim()) {
      try { handleCommand(JSON.parse(line)); } catch (e) { process.stderr.write('[ParseErr] ' + e.message + '\n'); }
    }
  }
});

process.on('uncaughtException', (err) => {
  process.stderr.write('[UNCAUGHT] ' + err.message + '\n');
});
