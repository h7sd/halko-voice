import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EDGE_VOICES = [
  { id: 'de-DE-ConradNeural', label: 'Conrad (DE)' },
  { id: 'de-DE-KatjaNeural', label: 'Katja (DE)' },
  { id: 'de-DE-KillianNeural', label: 'Killian (DE)' },
  { id: 'de-AT-JonasNeural', label: 'Jonas (AT)' },
  { id: 'de-CH-LeniNeural', label: 'Leni (CH)' },
  { id: 'en-US-AriaNeural', label: 'Aria (EN)' },
  { id: 'en-US-GuyNeural', label: 'Guy (EN)' },
];
const GROQ_VOICES = [
  { id: 'daniel', label: 'Daniel' },
  { id: 'austin', label: 'Austin' },
  { id: 'troy', label: 'Troy' },
  { id: 'autumn', label: 'Autumn' },
  { id: 'diana', label: 'Diana' },
  { id: 'hannah', label: 'Hannah' },
];

const QUICK_PHRASES = [
  'Haha, genau!', 'Kurze Pause', 'Widerspruch!',
  'BRB', 'Was sagtet ihr?', 'GG!',
];

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 7-7 7 7"/>
      <path d="M12 19V5"/>
    </svg>
  );
}

export default function VoicePanel({ config, onSpeakStatus }) {
  const [text, setText] = useState('');
  const [engine, setEngine] = useState(config.ttsEngine || 'edge');
  const [voice, setVoice] = useState(config.selectedVoice || 'de-DE-ConradNeural');
  const [history, setHistory] = useState([]);
  const [sending, setSending] = useState(false);
  const [categories, setCategories] = useState(config.categories || [{ id: 'default', name: 'Allgemein', presets: [] }]);
  const [activeCategoryId, setActiveCategoryId] = useState(config.activeCategoryId || 'default');
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newPresetKey, setNewPresetKey] = useState('');
  const [newPresetText, setNewPresetText] = useState('');

  const activeCategory = categories.find(c => c.id === activeCategoryId) || categories[0];
  const presets = activeCategory.presets;

  const [audioInputs, setAudioInputs] = useState([]);
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [micDevice, setMicDevice] = useState(() => localStorage.getItem('halko_mic') || 'default');
  const [monitorDevice, setMonitorDevice] = useState(() => localStorage.getItem('halko_monitor') || 'default');
  const [vbCableId, setVbCableId] = useState(null);

  const [passthrough, setPassthrough] = useState(false);

  const textareaRef = useRef(null);
  const historyRef = useRef(null);
  const audioCtxRef = useRef(null);
  const micStreamRef = useRef(null);
  const micSourceRef = useRef(null);
  const destRef = useRef(null);
  const passthroughAudioRef = useRef(null);

  // FIX: Switch voice when engine changes
  useEffect(() => {
    if (engine === 'groq') {
      if (!GROQ_VOICES.find(v => v.id === voice)) setVoice(GROQ_VOICES[0].id);
    } else {
      if (!EDGE_VOICES.find(v => v.id === voice)) setVoice(EDGE_VOICES[0].id);
    }
  }, [engine]);

  useEffect(() => {
    async function loadDevices() {
      try { await navigator.mediaDevices.getUserMedia({ audio: true }); } catch {}
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        const inputs = all.filter(d => d.kind === 'audioinput');
        const outputs = all.filter(d => d.kind === 'audiooutput');
        setAudioInputs(inputs);
        setAudioOutputs(outputs);

        const vb = outputs.find(d =>
          d.label.toLowerCase().includes('cable input') ||
          d.label.toLowerCase().includes('vb-audio')
        );
        if (vb) setVbCableId(vb.deviceId);

        const savedMic = localStorage.getItem('halko_mic');
        if (!savedMic || !inputs.find(d => d.deviceId === savedMic)) {
          const def = inputs.find(d => d.deviceId === 'default') || inputs[0];
          if (def) { setMicDevice(def.deviceId); localStorage.setItem('halko_mic', def.deviceId); }
        }
        const savedMonitor = localStorage.getItem('halko_monitor');
        if (outputs.find(d => d.deviceId === savedMonitor)) {
          setMonitorDevice(savedMonitor);
        } else {
          const nonVb = outputs.find(d => !d.label.toLowerCase().includes('cable') && !d.label.toLowerCase().includes('vb-audio')) || outputs[0];
          if (nonVb) { setMonitorDevice(nonVb.deviceId); localStorage.setItem('halko_monitor', nonVb.deviceId); }
        }

        // Auto-start passthrough if VB-Cable is found
        if (vb) {
          startPassthrough(savedMic || 'default', vb.deviceId);
        }
      } catch {}
    }
    loadDevices();
  }, []);

  const stopPassthrough = useCallback(() => {
    if (passthroughAudioRef.current) {
      passthroughAudioRef.current.pause();
      passthroughAudioRef.current.srcObject = null;
      passthroughAudioRef.current = null;
    }
    if (micSourceRef.current) { try { micSourceRef.current.disconnect(); } catch {} micSourceRef.current = null; }
    if (destRef.current) { destRef.current = null; }
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null; }
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
    setPassthrough(false);
  }, []);

  const startPassthrough = useCallback(async (micId, vbId) => {
    stopPassthrough();
    if (!vbId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: micId && micId !== 'default' ? { exact: micId } : undefined, echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      micStreamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      micSourceRef.current = source;
      const dest = ctx.createMediaStreamDestination();
      destRef.current = dest;
      source.connect(dest);
      const audio = new Audio();
      audio.srcObject = dest.stream;
      if (audio.setSinkId) await audio.setSinkId(vbId);
      await audio.play();
      passthroughAudioRef.current = audio;
      setPassthrough(true);
    } catch (err) {
      console.error('Passthrough failed:', err);
      stopPassthrough();
    }
  }, [stopPassthrough]);

  useEffect(() => { return () => stopPassthrough(); }, [stopPassthrough]);

  const addHistory = useCallback((txt) => {
    const time = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    setHistory(h => [...h, { txt, time, id: Date.now() }].slice(-50));
    setTimeout(() => { if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight; }, 50);
  }, []);

  const playOnDevice = useCallback((filePath, deviceId) => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const p = filePath.replace(/\\/g, '/');
      const src = p.startsWith('/') ? 'file://' + p : 'file:///' + p;
      audio.src = src;
      const doPlay = () => {
        audio.onended = resolve;
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      };
      if (deviceId && deviceId !== 'default' && audio.setSinkId) {
        audio.setSinkId(deviceId).then(doPlay).catch(doPlay);
      } else {
        doPlay();
      }
    });
  }, []);

  const speak = useCallback(async (txt) => {
    if (!txt) return;
    addHistory(txt);
    onSpeakStatus?.(true);
    try {
      const res = await window.halko?.ttsSpeak({ text: txt, engine, voice, apiKey: config.groqApiKey });
      if (res?.success) {
        const plays = [playOnDevice(res.filePath, monitorDevice)];
        if (vbCableId && vbCableId !== monitorDevice) plays.push(playOnDevice(res.filePath, vbCableId));
        await Promise.all(plays);
      } else {
        addHistory('Fehler: ' + (res?.error || 'Unbekannt'));
      }
    } catch (err) {
      addHistory('Fehler: ' + err.message);
    } finally {
      onSpeakStatus?.(false);
    }
  }, [addHistory, engine, voice, config.groqApiKey, playOnDevice, monitorDevice, vbCableId, onSpeakStatus]);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    onSpeakStatus?.(true);
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await speak(t);
    setSending(false);
    onSpeakStatus?.(false);
  };

  useEffect(() => {
    window.halko?.unregisterAllShortcuts();
    presets.forEach(p => { window.halko?.registerShortcut({ id: p.id, key: p.key }); });
  }, [activeCategoryId, presets]);

  useEffect(() => {
    const unsubscribe = window.halko?.onPresetTriggered((id) => {
      const preset = presets.find(p => p.id === id);
      if (preset) speak(preset.text);
    });
    return () => unsubscribe?.();
  }, [presets, speak]);

  const addPreset = async () => {
    if (!newPresetKey || !newPresetText) return;
    const newPreset = { id: Date.now().toString(), key: newPresetKey, text: newPresetText };
    const updated = categories.map(cat => cat.id === activeCategoryId ? { ...cat, presets: [...cat.presets, newPreset] } : cat);
    setCategories(updated);
    window.halko?.saveConfig({ ...config, categories: updated });
    setNewPresetKey(''); setNewPresetText(''); setIsPresetModalOpen(false);
  };

  const removePreset = (id) => {
    const updated = categories.map(cat => cat.id === activeCategoryId ? { ...cat, presets: cat.presets.filter(p => p.id !== id) } : cat);
    setCategories(updated);
    window.halko?.saveConfig({ ...config, categories: updated });
    window.halko?.unregisterShortcut(id);
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCat = { id: Date.now().toString(), name: newCategoryName.trim(), presets: [] };
    const updated = [...categories, newCat];
    setCategories(updated);
    setActiveCategoryId(newCat.id);
    window.halko?.saveConfig({ ...config, categories: updated, activeCategoryId: newCat.id });
    setNewCategoryName(''); setIsCategoryModalOpen(false);
  };

  const removeCategory = (id) => {
    if (categories.length <= 1) return;
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    const nextId = activeCategoryId === id ? updated[0].id : activeCategoryId;
    setActiveCategoryId(nextId);
    window.halko?.saveConfig({ ...config, categories: updated, activeCategoryId: nextId });
  };

  const voices = engine === 'groq' ? GROQ_VOICES : EDGE_VOICES;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
      
      {/* Top Controls Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <GlassCard style={{ padding: 12 }}>
          <Label>Audio Ausgang</Label>
          <StyledSelect value={monitorDevice} onChange={e => { setMonitorDevice(e.target.value); localStorage.setItem('halko_monitor', e.target.value); }}>
            {audioOutputs.filter(d => d.deviceId !== 'default').map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Gerät'}</option>)}
          </StyledSelect>
        </GlassCard>

        <GlassCard style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label style={{ color: passthrough ? '#22d46e' : 'inherit' }}>Discord Voice</Label>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => passthrough ? stopPassthrough() : startPassthrough(micDevice, vbCableId)}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 800,
                background: passthrough ? 'rgba(34,212,110,0.1)' : 'rgba(0,122,255,0.1)',
                border: `1px solid ${passthrough ? 'rgba(34,212,110,0.2)' : 'rgba(0,122,255,0.2)'}`,
                color: passthrough ? '#22d46e' : '#007aff', cursor: 'pointer', textTransform: 'uppercase'
              }}
            >
              {passthrough ? 'Stoppen' : 'Starten'}
            </motion.button>
          </div>
          {vbCableId ? (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: passthrough ? '#22d46e' : 'rgba(255,255,255,0.1)' }} />
              Ready for Discord
            </div>
          ) : (
            <div style={{ fontSize: 11, color: '#ffa826' }}>VB-Cable fehlt</div>
          )}
        </GlassCard>
      </div>

      {/* Preset Section */}
      <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {categories.map(cat => (
              <TabButton 
                key={cat.id} 
                active={activeCategoryId === cat.id} 
                onClick={() => setActiveCategoryId(cat.id)}
                onRemove={categories.length > 1 ? () => removeCategory(cat.id) : null}
              >
                {cat.name}
              </TabButton>
            ))}
            <IconButton onClick={() => setIsCategoryModalOpen(true)}>+</IconButton>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setIsPresetModalOpen(true)}
            style={{ padding: '6px 14px', borderRadius: 8, background: '#007aff', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
          >
            + Preset
          </motion.button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {presets.map(p => (
            <div key={p.id} style={{ position: 'relative' }}>
              <PresetButton onClick={() => speak(p.text)}>
                <span style={{ opacity: 0.4, marginRight: 6 }}>{p.key}</span> {p.text}
              </PresetButton>
              <button onClick={() => removePreset(p.id)} style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', fontSize: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
          ))}
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
          {QUICK_PHRASES.map(p => (
            <PresetButton key={p} style={{ opacity: 0.6 }} onClick={() => speak(p)}>{p}</PresetButton>
          ))}
        </div>
      </GlassCard>

      {/* History & Input Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        <GlassCard style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div ref={historyRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {history.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
                Verlauf ist leer...
              </div>
            ) : (
              history.map(item => (
                <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ opacity: 0.3, fontSize: 10, marginRight: 8 }}>{item.time}</span>
                  {item.txt}
                </motion.div>
              ))
            )}
          </div>
          
          <div style={{ padding: '12px 16px', background: 'rgba(0,122,255,0.03)', display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                ref={textareaRef} value={text}
                onChange={e => { setText(e.target.value); const el = e.target; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 100) + 'px'; }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Tippen um zu sprechen..."
                style={{ width: '100%', minHeight: 40, background: 'transparent', border: 'none', color: '#fff', fontSize: 14, outline: 'none', resize: 'none', lineHeight: 1.5 }}
              />
              <div style={{ display: 'flex', gap: 12 }}>
                <select value={engine} onChange={e => setEngine(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'rgba(0,122,255,0.6)', fontSize: 10, fontWeight: 700, outline: 'none', cursor: 'pointer' }}>
                  <option value="edge">EDGE TTS</option>
                  <option value="groq">GROQ AI</option>
                </select>
                <select value={voice} onChange={e => setVoice(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'rgba(0,122,255,0.6)', fontSize: 10, fontWeight: 700, outline: 'none', cursor: 'pointer', flex: 1 }}>
                  {voices.map(v => <option key={v.id} value={v.id}>{v.label.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={send} disabled={sending || !text.trim()}
              style={{ width: 44, height: 44, borderRadius: 14, background: '#007aff', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              {sending ? <span className="loader" /> : <SendIcon />}
            </motion.button>
          </div>
        </GlassCard>
      </div>

      <AnimatePresence>
        {isPresetModalOpen && (
          <Modal title="Neues Preset" onClose={() => setIsPresetModalOpen(false)}>
            <Input label="Taste" value={newPresetKey} onChange={setNewPresetKey} placeholder="z.B. F1" />
            <Input label="Text" value={newPresetText} onChange={setNewPresetText} placeholder="Was soll gesagt werden?" area />
            <PrimaryButton onClick={addPreset}>Speichern</PrimaryButton>
          </Modal>
        )}
        {isCategoryModalOpen && (
          <Modal title="Neue Kategorie" onClose={() => setIsCategoryModalOpen(false)}>
            <Input label="Name" value={newCategoryName} onChange={setNewCategoryName} placeholder="z.B. Gaming" />
            <PrimaryButton onClick={addCategory}>Erstellen</PrimaryButton>
          </Modal>
        )}
      </AnimatePresence>

      <style>{`
        .loader { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* Internal Components for UI Overhaul */
function GlassCard({ children, style }) {
  return (
    <div style={{
      background: 'rgba(0,40,120,0.15)',
      backdropFilter: 'blur(30px)',
      border: '1px solid rgba(0,122,255,0.15)',
      borderRadius: 16,
      ...style
    }}>{children}</div>
  );
}

function Label({ children, style }) {
  return <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(0,122,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, ...style }}>{children}</div>;
}

function StyledSelect({ children, ...props }) {
  return (
    <select {...props} style={{ width: '100%', background: 'rgba(0,122,255,0.05)', border: '1px solid rgba(0,122,255,0.2)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
      {children}
    </select>
  );
}

function TabButton({ active, children, onClick, onRemove }) {
  return (
    <div style={{ position: 'relative' }}>
      <motion.button
        onClick={onClick}
        style={{
          padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700,
          background: active ? 'rgba(0,122,255,0.2)' : 'transparent',
          border: active ? '1px solid rgba(0,122,255,0.3)' : '1px solid transparent',
          color: active ? '#007aff' : 'rgba(255,255,255,0.3)', cursor: 'pointer'
        }}
      >
        {children}
      </motion.button>
      {onRemove && <button onClick={onRemove} style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: '50%', background: '#ff4d4d', color: '#fff', border: 'none', fontSize: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>}
    </div>
  );
}

function IconButton({ children, onClick }) {
  return <button onClick={onClick} style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,122,255,0.1)', border: 'none', color: 'rgba(0,122,255,0.5)', cursor: 'pointer', fontSize: 16 }}>{children}</button>;
}

function PresetButton({ children, onClick, style }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, background: 'rgba(0,122,255,0.1)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        padding: '6px 12px', borderRadius: 8, background: 'rgba(0,122,255,0.05)',
        border: '1px solid rgba(0,122,255,0.1)', color: '#fff', fontSize: 11,
        fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', ...style
      }}
    >
      {children}
    </motion.button>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,10,30,0.8)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#001a35', border: '1px solid rgba(0,122,255,0.3)', borderRadius: 24, padding: 24, width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#007aff' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, area }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Label>{label}</Label>
      {area ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ background: 'rgba(0,122,255,0.05)', border: '1px solid rgba(0,122,255,0.2)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 13, minHeight: 80, outline: 'none', resize: 'none' }} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ background: 'rgba(0,122,255,0.05)', border: '1px solid rgba(0,122,255,0.2)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 13, outline: 'none' }} />
      )}
    </div>
  );
}

function PrimaryButton({ children, onClick }) {
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClick} style={{ width: '100%', padding: 14, borderRadius: 14, background: '#007aff', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
      {children}
    </motion.button>
  );
}
