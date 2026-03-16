import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import halkoImg from '../assets/halko.png';

function BotIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}

export default function ChatPanel({ config, groqReady, onSpeakStatus }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesRef = useRef(null);
  const textareaRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (groqReady && !initialized.current) {
      initialized.current = true;
      setMessages([{
        id: Date.now(), role: 'ai',
        text: 'Hey Halko! Schön dass du da bist. Ich bin dein persönlicher Motivator — immer an deiner Seite. Wie geht\'s dir heute?',
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      }]);
    }
  }, [groqReady]);

  const scrollDown = () => {
    setTimeout(() => {
      if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }, 50);
  };

  const send = async () => {
    const t = text.trim();
    if (!t || !groqReady || typing) return;
    const time = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    setMessages(m => [...m, { id: Date.now(), role: 'user', text: t, time }]);
    setText('');
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
    setTyping(true);
    onSpeakStatus?.(true);
    scrollDown();

    const res = await window.halko?.chatGroq({ message: t, model: config.selectedModel });
    setTyping(false);
    onSpeakStatus?.(false);

    const replyTime = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    if (res?.success) {
      setMessages(m => [
        ...m,
        { id: Date.now() + 1, role: 'ai', text: res.reply, time: replyTime },
        { id: Date.now() + 2, role: 'ai', image: halkoImg, time: replyTime },
      ]);
    } else {
      setMessages(m => [...m, { id: Date.now() + 1, role: 'ai', text: 'Fehler: ' + res?.error, time: replyTime }]);
    }
    scrollDown();
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div ref={messagesRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
        {messages.length === 0 && !typing ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 14,
            }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 56, height: 56,
                background: 'linear-gradient(135deg, rgba(120,90,255,0.2), rgba(160,100,255,0.1))',
                borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(160,120,255,0.25)',
                color: '#a078ff',
              }}
            >
              <BotIcon />
            </motion.div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#eeeef8' }}>Dein KI-Begleiter</div>
            <div style={{ fontSize: 12, color: '#44445a', textAlign: 'center', maxWidth: 220, lineHeight: 1.7 }}>
              Groq API Key in den Einstellungen eingeben um zu starten
            </div>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 4,
                    maxWidth: '78%',
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {msg.role === 'ai' && (
                    <span style={{
                      fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                      padding: '2px 7px', borderRadius: 4, alignSelf: 'flex-start',
                      background: 'rgba(120,90,255,0.12)', color: '#a078ff',
                      border: '1px solid rgba(120,90,255,0.2)',
                    }}>AI</span>
                  )}
                  {msg.image ? (
                    <img
                      src={msg.image}
                      alt="halko"
                      style={{
                        width: 220, borderRadius: 12,
                        border: '1px solid rgba(120,90,255,0.2)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '10px 14px', fontSize: 13, lineHeight: 1.65,
                      ...(msg.role === 'ai' ? {
                        background: 'rgba(255,255,255,0.04)',
                        borderLeft: '2px solid #7c6bff',
                        borderRadius: '0 10px 10px 10px',
                        color: '#eeeef8',
                      } : {
                        background: 'linear-gradient(135deg, rgba(120,90,255,0.18), rgba(120,90,255,0.08))',
                        border: '1px solid rgba(120,90,255,0.2)',
                        borderRadius: '10px 0 10px 10px',
                        color: '#eeeef8',
                      }),
                    }}>
                      {msg.text}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: '#33334a', padding: '0 4px' }}>{msg.time}</div>
                </motion.div>
              ))}
            </AnimatePresence>

            {typing && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ alignSelf: 'flex-start' }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  borderLeft: '2px solid #7c6bff',
                  borderRadius: '0 10px 10px 10px',
                }}>
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
                      style={{ width: 5, height: 5, borderRadius: '50%', background: '#7c6bff' }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div style={{
        background: 'rgba(8,6,18,0.8)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => { setText(e.target.value); autoResize(); }}
            onKeyDown={onKey}
            placeholder={groqReady ? 'Schreib etwas... (Enter zum Senden)' : 'Erst API Key in Einstellungen eingeben...'}
            disabled={!groqReady}
            style={{
              flex: 1, minHeight: 42, maxHeight: 120,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: '10px 13px',
              fontSize: 13, color: '#eeeef8', fontFamily: 'inherit', resize: 'none',
              outline: 'none', lineHeight: 1.5,
              opacity: groqReady ? 1 : 0.5,
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
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            onClick={send}
            disabled={!groqReady || !text.trim() || typing}
            style={{
              width: 42, height: 42, flexShrink: 0,
              background: 'linear-gradient(135deg, #7c6bff, #a08bff)',
              border: 'none', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
              opacity: !groqReady || !text.trim() || typing ? 0.4 : 1,
              boxShadow: '0 4px 18px rgba(120,90,255,0.45)',
              transition: 'opacity 0.2s',
            }}
          >
            <SendIcon />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
