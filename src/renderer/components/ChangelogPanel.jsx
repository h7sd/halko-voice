import { motion } from 'framer-motion';

const CHANGELOG = [
  {
    version: '1.1.0',
    date: '16. März 2026',
    changes: [
      'Keyboard-Presets mit globalen Shortcuts hinzugefügt',
      'Kategorien für Presets implementiert',
      'Apple-Style UI Overhaul (San Francisco Fonts, Glassmorphism)',
      'Automatischer Updater integriert',
      'Splash Screen Redesign',
      'Changelog System hinzugefügt',
      'Deep Blue Theme implementiert',
      'TTS Engine Voice Switching Fix',
      'Self-Monitoring: TTS ist nun in der App hörbar'
    ]
  },
  {
    version: '1.0.0',
    date: 'März 2026',
    changes: [
      'Initialer Release von Halko Voice',
      'Edge TTS Integration',
      'Groq AI Motivator',
      'Discord Voice Integration via VB-Cable'
    ]
  }
];

export default function ChangelogPanel() {
  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {CHANGELOG.map((release, idx) => (
          <div key={release.version} style={{ marginBottom: 32, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: '4px 12px', background: 'rgba(0,122,255,0.2)', borderRadius: 20, border: '1px solid rgba(0,122,255,0.3)', color: '#007aff', fontSize: 13, fontWeight: 700 }}>
                v{release.version}
              </div>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{release.date}</span>
            </div>
            <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {release.changes.map((change, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
                  <span style={{ color: '#007aff' }}>•</span>
                  {change}
                </li>
              ))}
            </ul>
            {idx !== CHANGELOG.length - 1 && (
              <div style={{ position: 'absolute', bottom: -16, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.03)' }} />
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
