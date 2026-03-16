import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuroraBackground from './components/AuroraBackground.jsx';
import Sidebar from './components/Sidebar.jsx';
import VoicePanel from './components/VoicePanel.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import ToastContainer from './components/Toast.jsx';
import ChangelogPanel from './components/ChangelogPanel.jsx';

const APP_VERSION = '1.1.0';

const PANEL_TITLES = {
  voice: 'Sprechen',
  chat: 'Motivator',
  settings: 'Einstellungen',
  changelog: 'Changelog',
};

function MacControl({ color, onClick, icon }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      style={{
        width: 12, height: 12, borderRadius: '50%', border: 'none',
        background: color, cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 0
      }}
    >
      <div style={{ opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 0.6} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
        {icon}
      </div>
    </motion.button>
  );
}

export default function App() {
  const [panel, setPanel] = useState('voice');
  const [showSplash, setShowSplash] = useState(true);
  const [showChangelogPopup, setShowChangelogPopup] = useState(false);
  const [config, setConfig] = useState({
    groqApiKey: '',
    selectedVoice: 'de-DE-ConradNeural',
    selectedModel: 'llama-3.3-70b-versatile',
    ttsEngine: 'edge',
  });
  const [groqReady, setGroqReady] = useState(false);

  useEffect(() => {
    window.halko?.loadConfig().then(async cfg => {
      if (cfg) {
        setConfig(cfg);
        if (cfg.groqApiKey) {
          const res = await window.halko.initGroq(cfg.groqApiKey);
          if (res?.success) setGroqReady(true);
        }
      }
    });

    // Check for new version to show changelog
    const lastSeen = localStorage.getItem('halko_last_seen_version');
    if (lastSeen !== APP_VERSION) {
      setShowChangelogPopup(true);
    }

    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'SF Pro Display';
        src: url('https://apple-fonts.s3.amazonaws.com/SF-Pro-Display-Regular.otf');
      }
      @font-face {
        font-family: 'SF Pro Display';
        font-weight: 700;
        src: url('https://apple-fonts.s3.amazonaws.com/SF-Pro-Display-Bold.otf');
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.75)} }
      select option { background: #001a35; color: #eeeef8; }
      * { 
        -webkit-user-select: none; 
        user-select: none; 
        font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        box-sizing: border-box;
      }
      textarea, input { -webkit-user-select: text !important; user-select: text !important; }
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(0,122,255,0.15); borderRadius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(0,122,255,0.3); }
    `;
    document.head.appendChild(style);
  }, []);

  const closeChangelog = () => {
    localStorage.setItem('halko_last_seen_version', APP_VERSION);
    setShowChangelogPopup(false);
  };

  const panelVariants = {
    initial: { opacity: 0, scale: 0.98, filter: 'blur(10px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit:    { opacity: 0, scale: 1.02, filter: 'blur(10px)' },
  };

  return (
    <div style={{ 
      width: '100vw', height: '100vh', 
      display: 'flex', flexDirection: 'column', 
      overflow: 'hidden', position: 'relative',
      background: '#000814',
      color: '#fff'
    }}>
      <AuroraBackground />

      <AnimatePresence>
        {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showChangelogPopup && !showSplash && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,10,30,0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#001a35', border: '1px solid rgba(0,122,255,0.3)', borderRadius: 32, padding: 32, width: '100%', maxWidth: 500, maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 24, boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#007aff', letterSpacing: '-0.02em' }}>Was ist neu?</h2>
                <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.3 }}>v{APP_VERSION}</div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
                <ChangelogPanel />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={closeChangelog} style={{ width: '100%', padding: 16, borderRadius: 16, background: '#007aff', color: '#fff', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,122,255,0.2)' }}>
                Verstanden
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div style={{
        height: 48, flexShrink: 0,
        background: 'rgba(0,20,50,0.4)', backdropFilter: 'blur(40px)',
        borderBottom: '1px solid rgba(0,122,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
        WebkitAppRegion: 'drag',
        position: 'relative', zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, WebkitAppRegion: 'no-drag' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <MacControl color="#ff5f57" onClick={() => window.halko?.windowClose()} />
            <MacControl color="#febc2e" onClick={() => window.halko?.windowMinimize()} />
            <MacControl color="#28c840" onClick={() => window.halko?.windowMaximize()} />
          </div>
          <div style={{ width: 1, height: 16, background: 'rgba(0,122,255,0.2)', margin: '0 4px' }} />
        </div>

        <div style={{ flex: 1, textAlign: 'center', pointerEvents: 'none' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,122,255,0.9)', letterSpacing: '-0.01em' }}>
            {PANEL_TITLES[panel]}
          </span>
        </div>

        <div style={{ width: 100, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {panel === 'chat' && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              background: groqReady ? 'rgba(34,212,110,0.1)' : 'rgba(0,122,255,0.1)',
              color: groqReady ? '#22d46e' : '#007aff',
              border: `1px solid ${groqReady ? 'rgba(34,212,110,0.15)' : 'rgba(0,122,255,0.15)'}`,
              textTransform: 'uppercase', letterSpacing: '0.02em'
            }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', ...(groqReady ? { animation: 'pulse 2s infinite' } : {}) }} />
              {groqReady ? 'AI Live' : 'Offline'}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <Sidebar active={panel} onChange={setPanel} />

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'rgba(0,10,30,0.3)' }}>
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative', padding: '20px' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={panel}
                variants={panelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                style={{ position: 'absolute', inset: '20px', display: 'flex', flexDirection: 'column' }}
              >
                {panel === 'voice' && <VoicePanel config={config} />}
                {panel === 'chat' && <ChatPanel config={config} groqReady={groqReady} />}
                {panel === 'changelog' && <ChangelogPanel />}
                {panel === 'settings' && (
                  <SettingsPanel
                    config={config}
                    onSave={setConfig}
                    onGroqReady={(ready, newCfg) => {
                      setGroqReady(ready);
                      if (newCfg) setConfig(newCfg);
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div style={{ 
        position: 'fixed', bottom: 10, left: 0, right: 0, 
        textAlign: 'center', pointerEvents: 'none', zIndex: 100 
      }}>
        <div style={{ fontSize: 9, color: 'rgba(0,122,255,0.3)', fontWeight: 700, letterSpacing: '0.02em' }}>
          made with ❤️ by crck2poor
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
