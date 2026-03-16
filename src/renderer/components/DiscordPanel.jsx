import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function StyledInput({ type = 'text', ...props }) {
  return (
    <input
      type={type}
      {...props}
      style={{
        width: '100%', background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
        padding: '10px 13px', fontSize: 13, color: '#eeeef8',
        fontFamily: 'inherit', outline: 'none', marginBottom: 10,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        ...props.style,
      }}
      onFocus={e => {
        e.target.style.borderColor = 'rgba(160,120,255,0.5)';
        e.target.style.boxShadow = '0 0 0 3px rgba(120,90,255,0.12)';
      }}
      onBlur={e => {
        e.target.style.borderColor = 'rgba(255,255,255,0.08)';
        e.target.style.boxShadow = 'none';
      }}
    />
  );
}

function StyledSelect({ children, ...props }) {
  return (
    <select
      {...props}
      style={{
        width: '100%', background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
        padding: '10px 13px', fontSize: 13, color: '#eeeef8',
        fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
        appearance: 'none', marginBottom: 10,
        transition: 'border-color 0.2s',
        ...props.style,
      }}
      onFocus={e => e.target.style.borderColor = 'rgba(160,120,255,0.4)'}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
    >
      {children}
    </select>
  );
}

function Btn({ children, variant = 'accent', disabled, onClick, style }) {
  const variants = {
    accent: { bg: 'linear-gradient(135deg, #7c6bff, #a08bff)', shadow: 'rgba(120,90,255,0.4)' },
    discord: { bg: 'linear-gradient(135deg, #5865f2, #7289da)', shadow: 'rgba(88,101,242,0.4)' },
    success: { bg: 'linear-gradient(135deg, #22d46e, #1ab558)', shadow: 'rgba(34,212,110,0.35)' },
    danger: { bg: 'transparent', border: '1px solid rgba(255,77,77,0.3)', color: '#ff6666', shadow: 'none' },
    ghost: { bg: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#8888a8', shadow: 'none' },
  };
  const v = variants[variant] || variants.accent;

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.03, y: disabled ? 0 : -1 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={disabled ? undefined : onClick}
      style={{
        background: v.bg, color: v.color || '#fff',
        border: v.border || 'none', borderRadius: 9,
        padding: '9px 16px', fontSize: 13, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 7,
        fontFamily: 'inherit', opacity: disabled ? 0.4 : 1,
        boxShadow: disabled ? 'none' : `0 4px 16px ${v.shadow}`,
        transition: 'opacity 0.2s, box-shadow 0.2s',
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.08em', color: '#33334a', marginBottom: 14,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {children}
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
    </div>
  );
}

export default function DiscordPanel({ config, onConnected, onJoined }) {
  const [token, setToken] = useState(config.discordBotToken || '');
  const [connected, setConnected] = useState(false);
  const [guilds, setGuilds] = useState([]);
  const [guildId, setGuildId] = useState('');
  const [voiceChannels, setVoiceChannels] = useState([]);
  const [textChannels, setTextChannels] = useState([]);
  const [voiceCh, setVoiceCh] = useState('');
  const [textCh, setTextCh] = useState('');
  const [inVoice, setInVoice] = useState(false);
  const [loading, setLoading] = useState(false);

  const connect = async () => {
    if (!token.trim()) return;
    setLoading(true);
    const res = await window.halko?.discordConnect(token.trim());
    setLoading(false);
    if (res?.success) {
      setConnected(true);
      setGuilds(res.guilds || []);
      onConnected?.(true);
    }
  };

  const disconnect = () => {
    setConnected(false);
    setGuilds([]);
    setGuildId('');
    setInVoice(false);
    onConnected?.(false);
  };

  const loadChannels = async (gId) => {
    setGuildId(gId);
    if (!gId) return;
    const [vRes, tRes] = await Promise.all([
      window.halko?.discordGetChannels(gId),
      window.halko?.getTextChannels(gId),
    ]);
    if (vRes?.success) setVoiceChannels(vRes.channels || []);
    if (tRes?.success) setTextChannels(tRes.channels || []);
  };

  const joinVoice = async () => {
    if (!guildId || !voiceCh) return;
    setLoading(true);
    const res = await window.halko?.discordJoinVoice({ guildId, channelId: voiceCh });
    setLoading(false);
    if (res?.success) {
      setInVoice(true);
      const chName = voiceChannels.find(c => c.id === voiceCh)?.name || voiceCh;
      onJoined?.(true, chName, guildId, voiceCh, textCh);
    }
  };

  const leaveVoice = async () => {
    await window.halko?.discordLeaveVoice();
    setInVoice(false);
    onJoined?.(false, '', guildId, voiceCh, textCh);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '22px 22px 30px' }}>
      <SectionLabel>Bot Token</SectionLabel>
      <label style={{ fontSize: 11.5, color: '#66667a', display: 'block', marginBottom: 6 }}>Token</label>
      <StyledInput
        type="password"
        placeholder="Bot Token eingeben..."
        value={token}
        onChange={e => setToken(e.target.value)}
        disabled={connected}
      />
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {!connected ? (
          <Btn variant="discord" onClick={connect} disabled={loading || !token.trim()}>
            {loading && <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />}
            Verbinden
          </Btn>
        ) : (
          <Btn variant="danger" onClick={disconnect}>Trennen</Btn>
        )}
      </div>

      <AnimatePresence>
        {connected && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 22 }} />
            <SectionLabel>Server &amp; Kanäle</SectionLabel>

            <label style={{ fontSize: 11.5, color: '#66667a', display: 'block', marginBottom: 6 }}>Server</label>
            <StyledSelect value={guildId} onChange={e => loadChannels(e.target.value)}>
              <option value="">— Server auswählen —</option>
              {guilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </StyledSelect>

            {guildId && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <label style={{ fontSize: 11.5, color: '#66667a', display: 'block', marginBottom: 6 }}>Voice Channel</label>
                <StyledSelect value={voiceCh} onChange={e => setVoiceCh(e.target.value)}>
                  <option value="">— Voice auswählen —</option>
                  {voiceChannels.map(c => <option key={c.id} value={c.id}>🔊 {c.name}</option>)}
                </StyledSelect>

                <label style={{ fontSize: 11.5, color: '#66667a', display: 'block', marginBottom: 6 }}>Text Channel (optional)</label>
                <StyledSelect value={textCh} onChange={e => setTextCh(e.target.value)}>
                  <option value="">— Text Channel (optional) —</option>
                  {textChannels.map(c => <option key={c.id} value={c.id}># {c.name}</option>)}
                </StyledSelect>

                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {!inVoice ? (
                    <Btn variant="success" onClick={joinVoice} disabled={loading || !voiceCh}>
                      {loading && <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />}
                      Voice beitreten
                    </Btn>
                  ) : (
                    <Btn variant="danger" onClick={leaveVoice}>Verlassen</Btn>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{
        marginTop: 28, padding: '14px 16px', borderRadius: 12,
        background: 'linear-gradient(135deg, rgba(120,90,255,0.06), transparent)',
        border: '1px solid rgba(120,90,255,0.1)', fontSize: 12, color: '#44445a', lineHeight: 2.1,
      }}>
        {['Bot auf discord.com/developers erstellen', 'Token eingeben & verbinden', 'Server + Channel auswählen', 'Voice beitreten — Bot spricht für dich'].map(s => (
          <div key={s}>
            <span style={{ color: '#7c6bff', fontWeight: 700 }}>→ </span>{s}
          </div>
        ))}
      </div>
    </div>
  );
}
