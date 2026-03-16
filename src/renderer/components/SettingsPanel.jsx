import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const EDGE_VOICES = [
  { id: 'de-DE-ConradNeural', label: 'Conrad (DE, männlich)' },
  { id: 'de-DE-KatjaNeural', label: 'Katja (DE, weiblich)' },
  { id: 'de-DE-KillianNeural', label: 'Killian (DE, männlich)' },
  { id: 'de-AT-JonasNeural', label: 'Jonas (AT, männlich)' },
  { id: 'de-CH-LeniNeural', label: 'Leni (CH, weiblich)' },
  { id: 'en-US-AriaNeural', label: 'Aria (EN, weiblich)' },
  { id: 'en-US-GuyNeural', label: 'Guy (EN, männlich)' },
];
const GROQ_VOICES = [
  { id: 'daniel', label: 'Daniel (männlich, warm)' },
  { id: 'austin', label: 'Austin (männlich, energisch)' },
  { id: 'troy', label: 'Troy (männlich, klar)' },
  { id: 'autumn', label: 'Autumn (weiblich, warm)' },
  { id: 'diana', label: 'Diana (weiblich, klar)' },
  { id: 'hannah', label: 'Hannah (weiblich, sanft)' },
];

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.08em', color: '#007aff', marginBottom: 14,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {children}
      <div style={{ flex: 1, height: 1, background: 'rgba(0,122,255,0.1)' }} />
    </div>
  );
}

function StyledInput({ type = 'text', ...props }) {
  return (
    <input
      type={type}
      {...props}
      style={{
        width: '100%', background: 'rgba(0,122,255,0.05)',
        border: '1px solid rgba(0,122,255,0.15)', borderRadius: 10,
        padding: '10px 13px', fontSize: 13, color: '#eeeef8',
        fontFamily: 'inherit', outline: 'none', marginBottom: 10,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        ...props.style,
      }}
      onFocus={e => {
        e.target.style.borderColor = 'rgba(0,122,255,0.5)';
        e.target.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.1)';
      }}
      onBlur={e => {
        e.target.style.borderColor = 'rgba(0,122,255,0.15)';
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
        width: '100%', background: 'rgba(0,122,255,0.05)',
        border: '1px solid rgba(0,122,255,0.15)', borderRadius: 10,
        padding: '10px 13px', fontSize: 13, color: '#eeeef8',
        fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
        appearance: 'none', marginBottom: 10,
        transition: 'border-color 0.2s',
        ...props.style,
      }}
      onFocus={e => e.target.style.borderColor = 'rgba(0,122,255,0.4)'}
      onBlur={e => e.target.style.borderColor = 'rgba(0,122,255,0.15)'}
    >
      {children}
    </select>
  );
}

export default function SettingsPanel({ config, onSave, onGroqReady }) {
  const [groqKey, setGroqKey] = useState(config.groqApiKey || '');
  const [model, setModel] = useState(config.selectedModel || 'llama-3.3-70b-versatile');
  const [ttsEngine, setTtsEngine] = useState(config.ttsEngine || 'edge');
  const [voice, setVoice] = useState(config.selectedVoice || 'de-DE-ConradNeural');
  const [saving, setSaving] = useState(false);

  const voices = ttsEngine === 'groq' ? GROQ_VOICES : EDGE_VOICES;

  const saveAndConnect = async () => {
    if (!groqKey.trim()) return;
    setSaving(true);
    const newConfig = { ...config, groqApiKey: groqKey, selectedModel: model, ttsEngine, selectedVoice: voice };
    await window.halko?.saveConfig(newConfig);
    const res = await window.halko?.initGroq(groqKey);
    setSaving(false);
    if (res?.success) {
      onGroqReady?.(true, newConfig);
      onSave?.(newConfig);
    }
  };

  const testTts = async () => {
    const res = await window.halko?.ttsSpeak({ text: 'Hey, ich bin Halkos Stimme!', engine: ttsEngine, voice, apiKey: groqKey });
    if (res?.success) {
      const audio = new Audio('file:///' + res.filePath.replace(/\\/g, '/'));
      await audio.play();
    }
  };

  const testGroq = async () => {
    const res = await window.halko?.chatGroq({ message: 'Sag mir einen kurzen Motivationsspruch!', model });
    if (res?.success) alert(res.reply);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '22px 22px 30px' }}>
      <SectionLabel>Groq API</SectionLabel>

      <label style={{ fontSize: 11.5, color: 'rgba(0,122,255,0.6)', display: 'block', marginBottom: 6 }}>API Key</label>
      <StyledInput
        type="password"
        placeholder="gsk_..."
        value={groqKey}
        onChange={e => setGroqKey(e.target.value)}
      />
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 12, lineHeight: 1.6 }}>
        Kostenlos unter console.groq.com — keine Kreditkarte nötig
      </div>

      <label style={{ fontSize: 11.5, color: 'rgba(0,122,255,0.6)', display: 'block', marginBottom: 6 }}>AI Modell</label>
      <StyledSelect value={model} onChange={e => setModel(e.target.value)}>
        <option value="llama-3.3-70b-versatile">Llama 3.3 70B — Beste Qualität</option>
        <option value="llama-3.1-8b-instant">Llama 3.1 8B — Schnellstes</option>
        <option value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Scout 17B</option>
        <option value="qwen/qwen3-32b">Qwen3 32B</option>
      </StyledSelect>

      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={saveAndConnect}
        disabled={saving || !groqKey.trim()}
        style={{
          background: '#007aff',
          border: 'none', borderRadius: 9,
          padding: '10px 18px', fontSize: 13, fontWeight: 600, color: '#fff',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
          fontFamily: 'inherit',
          opacity: saving || !groqKey.trim() ? 0.4 : 1,
          boxShadow: '0 4px 16px rgba(0,122,255,0.4)',
          marginBottom: 28,
        }}
      >
        {saving && <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />}
        Speichern & verbinden
      </motion.button>

      <div style={{ height: 1, background: 'rgba(0,122,255,0.1)', marginBottom: 22 }} />
      <SectionLabel>Text-to-Speech</SectionLabel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 11.5, color: 'rgba(0,122,255,0.6)', display: 'block', marginBottom: 6 }}>Engine</label>
          <StyledSelect value={ttsEngine} onChange={e => {
            const eng = e.target.value;
            setTtsEngine(eng);
            setVoice(eng === 'groq' ? GROQ_VOICES[0].id : EDGE_VOICES[0].id);
          }}>
            <option value="edge">Edge TTS (kostenlos)</option>
            <option value="groq">Groq PlayAI</option>
          </StyledSelect>
        </div>
        <div>
          <label style={{ fontSize: 11.5, color: 'rgba(0,122,255,0.6)', display: 'block', marginBottom: 6 }}>Stimme</label>
          <StyledSelect value={voice} onChange={e => setVoice(e.target.value)}>
            {voices.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
          </StyledSelect>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(0,122,255,0.1)', marginBottom: 22 }} />
      <SectionLabel>Test</SectionLabel>
      <div style={{ display: 'flex', gap: 10 }}>
        {[{ label: 'TTS testen', fn: testTts }, { label: 'Groq testen', fn: testGroq }].map(({ label, fn }) => (
          <motion.button
            key={label}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={fn}
            style={{
              background: 'transparent', border: '1px solid rgba(0,122,255,0.2)',
              borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 600,
              color: 'rgba(0,122,255,0.6)', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
