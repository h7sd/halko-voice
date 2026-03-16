import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

let addToastGlobal = null;

export function toast(message, type = 'info') {
  addToastGlobal?.(message, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastGlobal = (message, type) => {
      const id = Date.now() + Math.random();
      setToasts(t => [...t, { id, message, type }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
    };
    return () => { addToastGlobal = null; };
  }, []);

  const colors = {
    success: { border: '#22d46e', icon: '✓', bg: 'rgba(34,212,110,0.12)', color: '#22d46e' },
    error:   { border: '#ff4d4d', icon: '✕', bg: 'rgba(255,77,77,0.12)',  color: '#ff4d4d' },
    info:    { border: '#7c6bff', icon: 'i', bg: 'rgba(120,90,255,0.12)', color: '#a078ff' },
  };

  return (
    <div style={{
      position: 'fixed', bottom: 18, right: 18,
      display: 'flex', flexDirection: 'column', gap: 8,
      zIndex: 9999, pointerEvents: 'none',
    }}>
      <AnimatePresence>
        {toasts.map(t => {
          const c = colors[t.type] || colors.info;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 24, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 16, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                background: 'rgba(14,12,26,0.95)',
                backdropFilter: 'blur(20px)',
                border: `1px solid rgba(255,255,255,0.08)`,
                borderLeft: `3px solid ${c.border}`,
                borderRadius: 10, padding: '11px 16px',
                fontSize: 12.5, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                pointerEvents: 'all', maxWidth: 320,
              }}
            >
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                background: c.bg, color: c.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, flexShrink: 0,
              }}>{c.icon}</span>
              <span style={{ color: '#c8c8e0' }}>{t.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
