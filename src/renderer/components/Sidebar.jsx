import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'voice', label: 'Sprechen', icon: MicIcon },
  { id: 'chat',  label: 'Motivator', icon: StarIcon },
  { id: 'changelog', label: 'Changelog', icon: ListIcon },
  { id: 'settings', label: 'Settings', icon: GearIcon },
];

function MicIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" x2="12" y1="19" y2="22"/>
    </svg>
  );
}

function StarIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function ListIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  );
}

function GearIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

export default function Sidebar({ active, onChange }) {
  const [hovered, setHovered] = useState(null);

  return (
    <nav style={{
      width: 68,
      background: 'rgba(0,10,30,0.4)',
      backdropFilter: 'blur(40px)',
      borderRight: '1px solid rgba(0,122,255,0.1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 20,
      paddingBottom: 20,
      gap: 12,
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
    }}>
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const isHovered = hovered === tab.id;
        const Icon = tab.icon;

        return (
          <div key={tab.id} style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <motion.button
              onClick={() => onChange(tab.id)}
              onMouseEnter={() => setHovered(tab.id)}
              onMouseLeave={() => setHovered(null)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                background: isActive
                  ? 'rgba(0,122,255,0.15)'
                  : 'transparent',
                color: isActive ? '#007aff' : 'rgba(255,255,255,0.3)',
                boxShadow: isActive ? '0 4px 15px rgba(0,122,255,0.2), inset 0 0 0 1px rgba(0,122,255,0.1)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  style={{
                    position: 'absolute',
                    left: -12,
                    width: 4,
                    height: 20,
                    background: '#007aff',
                    borderRadius: '0 4px 4px 0',
                    boxShadow: '0 0 15px rgba(0,122,255,0.5)',
                  }}
                />
              )}
            </motion.button>

            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, x: -10, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -5, filter: 'blur(5px)' }}
                  style={{
                    position: 'absolute',
                    left: 60,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,10,30,0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0,122,255,0.2)',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    zIndex: 1000,
                    pointerEvents: 'none',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  }}
                >
                  {tab.label}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}
