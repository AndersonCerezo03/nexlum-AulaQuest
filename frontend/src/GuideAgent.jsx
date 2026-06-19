import { useState, useEffect, useRef } from 'react';
import { createElement as e } from 'react';

const API = 'https://nexlum-aulaquest.onrender.com';
const authH = (t) => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + t });

const QUICK_ACTIONS = [
  '¿Cómo funciona el aula?',
  '¿Cuál es mi progreso?',
  '¿Cómo desbloqueo el quiz?',
  '¿Qué idiomas puedo aprender?',
];

const LANG_OPTIONS = [
  { code: 'en', name: 'Inglés', flag: '🇬🇧', available: true },
  { code: 'fr', name: 'Francés', flag: '🇫🇷', available: false },
  { code: 'de', name: 'Alemán', flag: '🇩🇪', available: false },
  { code: 'pt', name: 'Portugués', flag: '🇧🇷', available: false },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', available: false },
];

export default function GuideAgent() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! Soy Aria, tu guía en AulaQuest. Puedo ayudarte con dudas sobre la app, tu progreso o el idioma que quieres aprender. ¿En qué te ayudo?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('en');
  const [showLangs, setShowLangs] = useState(false);
  const [hover, setHover] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const sync = () => setToken(localStorage.getItem('token') || '');
    sync();
    window.addEventListener('storage', sync);
    const iv = setInterval(sync, 2000);
    return () => { window.removeEventListener('storage', sync); clearInterval(iv); };
  }, []);

  useEffect(() => {
    if (!token || !open) return;
    fetch(API + '/api/guide/languages', { headers: authH(token) })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.current) setLang(d.current); })
      .catch(() => {});
  }, [token, open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  if (!token) return null;

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    const userMsg = { role: 'user', content: msg };
    const hist = messages.filter(m => m.role === 'user' || m.role === 'assistant');
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const r = await fetch(API + '/api/guide/chat', {
        method: 'POST',
        headers: authH(token),
        body: JSON.stringify({ message: msg, history: hist }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || 'Error');
      setMessages(prev => [...prev, { role: 'assistant', content: d.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'No pude conectar con el asistente. ' + (err.message || 'Intenta de nuevo.') }]);
    }
    setLoading(false);
  };

  const changeLang = async (code) => {
    setShowLangs(false);
    try {
      const r = await fetch(API + '/api/guide/language', {
        method: 'PUT',
        headers: authH(token),
        body: JSON.stringify({ language: code }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || 'Error');
      setLang(code);
      const opt = LANG_OPTIONS.find(l => l.code === code);
      const note = d.available
        ? `Listo, tu idioma de aprendizaje ahora es ${opt?.name || code}.`
        : `${opt?.name || code} está en camino. Por ahora puedes seguir practicando inglés mientras lo preparamos.`;
      setMessages(prev => [...prev, { role: 'assistant', content: note }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'No pude cambiar el idioma: ' + (err.message || 'error') }]);
    }
  };

  const currentLang = LANG_OPTIONS.find(l => l.code === lang) || LANG_OPTIONS[0];

  const panelStyle = {
    position: 'fixed',
    bottom: 96,
    right: 24,
    width: 360,
    maxWidth: 'calc(100vw - 32px)',
    height: 520,
    maxHeight: 'calc(100vh - 120px)',
    borderRadius: 20,
    background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
    border: '1px solid rgba(99,102,241,.35)',
    boxShadow: '0 20px 60px rgba(0,0,0,.55), 0 0 40px rgba(99,102,241,.15)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 99998,
    fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    overflow: 'hidden',
  };

  const btnStyle = {
    position: 'fixed',
    bottom: 96,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: hover ? '0 6px 24px rgba(99,102,241,.55)' : '0 4px 14px rgba(0,0,0,.35)',
    transform: hover ? 'scale(1.08)' : 'scale(1)',
    transition: 'transform .2s ease, box-shadow .2s ease',
    zIndex: 99998,
    cursor: 'pointer',
    border: 'none',
    fontSize: 28,
  };

  if (!open) {
    return e('button', {
      type: 'button',
      'aria-label': 'Guía Aria',
      onClick: () => setOpen(true),
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      style: btnStyle,
    }, '✨');
  }

  return e('div', { style: panelStyle },
    // Header
    e('div', {
      style: {
        padding: '14px 16px',
        borderBottom: '1px solid rgba(99,102,241,.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(99,102,241,.08)',
      },
    },
      e('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
        e('div', { style: { width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 } }, '✨'),
        e('div', null,
          e('div', { style: { fontWeight: 800, color: '#f1f5f9', fontSize: '.95rem' } }, 'Aria · Guía IA'),
          e('div', { style: { fontSize: '.68rem', color: '#94a3b8' } }, 'Dudas, progreso e idiomas'),
        ),
      ),
      e('div', { style: { display: 'flex', gap: 6 } },
        e('button', {
          type: 'button',
          onClick: () => setShowLangs(v => !v),
          title: 'Cambiar idioma',
          style: { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(99,102,241,.25)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: '.75rem', color: '#c4b5fd' },
        }, currentLang.flag + ' ' + currentLang.name),
        e('button', {
          type: 'button',
          onClick: () => setOpen(false),
          style: { background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18, padding: 4 },
        }, '×'),
      ),
    ),

    // Language picker
    showLangs && e('div', {
      style: {
        padding: '8px 12px',
        borderBottom: '1px solid rgba(99,102,241,.15)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        background: 'rgba(15,23,42,.8)',
      },
    },
      ...LANG_OPTIONS.map(opt =>
        e('button', {
          key: opt.code,
          type: 'button',
          onClick: () => changeLang(opt.code),
          style: {
            padding: '5px 10px',
            borderRadius: 20,
            border: `1px solid ${lang === opt.code ? '#6366f1' : 'rgba(255,255,255,.1)'}`,
            background: lang === opt.code ? 'rgba(99,102,241,.2)' : 'transparent',
            color: opt.available ? '#e2e8f0' : '#64748b',
            fontSize: '.72rem',
            cursor: 'pointer',
          },
        }, opt.flag + ' ' + opt.name + (opt.available ? '' : ' · pronto'))
      ),
    ),

    // Messages
    e('div', {
      style: { flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 },
    },
      ...messages.map((m, i) =>
        e('div', {
          key: i,
          style: {
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '88%',
            padding: '10px 14px',
            borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            background: m.role === 'user' ? 'linear-gradient(135deg,#6366f1,#7c3aed)' : 'rgba(255,255,255,.06)',
            color: m.role === 'user' ? '#fff' : '#cbd5e1',
            fontSize: '.82rem',
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
          },
        }, m.content)
      ),
      loading && e('div', { style: { alignSelf: 'flex-start', color: '#64748b', fontSize: '.78rem', padding: '4px 8px' } }, 'Aria está escribiendo...'),
      e('div', { ref: endRef }),
    ),

    // Quick actions
    messages.length <= 2 && e('div', {
      style: { padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 },
    },
      ...QUICK_ACTIONS.map(q =>
        e('button', {
          key: q,
          type: 'button',
          onClick: () => send(q),
          disabled: loading,
          style: {
            padding: '5px 10px',
            borderRadius: 20,
            border: '1px solid rgba(99,102,241,.25)',
            background: 'rgba(99,102,241,.08)',
            color: '#a5b4fc',
            fontSize: '.68rem',
            cursor: loading ? 'not-allowed' : 'pointer',
          },
        }, q)
      ),
    ),

    // Input
    e('div', {
      style: { padding: '10px 12px', borderTop: '1px solid rgba(99,102,241,.15)', display: 'flex', gap: 8 },
    },
      e('input', {
        ref: inputRef,
        value: input,
        onChange: ev => setInput(ev.target.value),
        onKeyDown: ev => { if (ev.key === 'Enter') send(); },
        placeholder: 'Escribe tu duda...',
        disabled: loading,
        style: {
          flex: 1,
          padding: '10px 14px',
          borderRadius: 12,
          border: '1px solid rgba(99,102,241,.2)',
          background: 'rgba(15,23,42,.8)',
          color: '#e2e8f0',
          fontSize: '.82rem',
          outline: 'none',
        },
      }),
      e('button', {
        type: 'button',
        onClick: () => send(),
        disabled: loading || !input.trim(),
        style: {
          padding: '10px 16px',
          borderRadius: 12,
          border: 'none',
          background: loading || !input.trim() ? 'rgba(99,102,241,.3)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '.82rem',
          cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
        },
      }, '→'),
    ),
  );
}
