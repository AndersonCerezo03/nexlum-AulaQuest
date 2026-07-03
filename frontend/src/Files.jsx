import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const API = import.meta.env.VITE_API_URL || 'https://nexlum-aulaquest.onrender.com';

// ─── AulaQuest Files — Detective Cases (B1, multijugador) ───
// Componente aislado (patrón Arena/City). UI en inglés con apoyo en español.
// La voz narradora usa el MISMO sistema de Mr. Alex (backend /api/tts/speak).

let _audio = null;
function speakAlex(text, token) {
  try { if (_audio) { _audio.pause(); _audio = null; } window.speechSynthesis.cancel(); } catch (e) {}
  if (!text) return;
  const fallback = () => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US'; u.rate = 0.92;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  };
  if (!token) return fallback();
  fetch(API + '/api/tts/speak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ text }),
  }).then(r => { if (!r.ok) throw new Error(); return r.blob(); })
    .then(b => { _audio = new Audio(URL.createObjectURL(b)); _audio.play().catch(fallback); })
    .catch(fallback);
}
function stopVoz() { try { if (_audio) { _audio.pause(); _audio = null; } window.speechSynthesis.cancel(); } catch (e) {} }

function Sub({ children, style }) {
  return <div style={{ color: '#64748b', fontSize: '.72rem', marginTop: 2, ...style }}>{children}</div>;
}

// Retrato SVG procedural del sospechoso
function Retrato({ r, color, size }) {
  const s = size || 72;
  const skin = (r && r.skin) || '#e8b58a';
  const hair = (r && r.hair) || '#1f2937';
  const style = (r && r.hairStyle) || 'short';
  const acc = (r && r.acc) || 'none';
  return (
    <svg width={s} height={s} viewBox="0 0 80 80" style={{ borderRadius: '50%', background: color + '22', border: '2px solid ' + color, flexShrink: 0 }}>
      {style === 'long' && <ellipse cx="40" cy="46" rx="24" ry="26" fill={hair} />}
      <circle cx="40" cy="38" r="18" fill={skin} />
      {style === 'short' && <path d="M22 36 Q24 18 40 18 Q56 18 58 36 Q52 24 40 24 Q28 24 22 36 Z" fill={hair} />}
      {style === 'slick' && <path d="M22 34 Q22 16 40 17 Q58 16 58 34 L54 30 Q48 22 40 22 Q32 22 26 30 Z" fill={hair} />}
      {style === 'bun' && (<><circle cx="40" cy="16" r="7" fill={hair} /><path d="M23 35 Q25 20 40 20 Q55 20 57 35 Q50 25 40 25 Q30 25 23 35 Z" fill={hair} /></>)}
      {style === 'long' && <path d="M22 36 Q23 18 40 18 Q57 18 58 36 Q52 24 40 24 Q28 24 22 36 Z" fill={hair} />}
      <circle cx="33" cy="38" r="2.4" fill="#0f172a" />
      <circle cx="47" cy="38" r="2.4" fill="#0f172a" />
      <path d="M34 47 Q40 51 46 47" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
      {acc === 'glasses' && (<><circle cx="33" cy="38" r="6" fill="none" stroke="#0f172a" strokeWidth="1.6" /><circle cx="47" cy="38" r="6" fill="none" stroke="#0f172a" strokeWidth="1.6" /><line x1="39" y1="38" x2="41" y2="38" stroke="#0f172a" strokeWidth="1.6" /></>)}
      {acc === 'cap' && <path d="M22 30 Q24 14 40 14 Q56 14 58 30 L58 26 Q56 12 40 12 Q24 12 22 26 Z M20 30 L62 30 L62 33 L20 33 Z" fill="#1e3a8a" />}
      {acc === 'scarf' && <path d="M26 55 Q40 62 54 55 L54 64 Q40 70 26 64 Z" fill="#7c2d12" />}
    </svg>
  );
}

export default function FilesGame({ token, onBack }) {
  const sockRef = useRef(null);
  const [conn, setConn]   = useState('...');
  const [ui, setUi]       = useState('menu');   // menu | lobby | (fase del server) | reveal
  const [err, setErr]     = useState('');
  const [code, setCode]   = useState('');
  const [joinCode, setJoin] = useState('');
  const [players, setPlayers] = useState([]);
  const [myId, setMyId]   = useState('');
  const [caso, setCaso]   = useState(null);
  const [endsAt, setEndsAt] = useState(0);
  const [rest, setRest]   = useState(0);
  const [briefStep, setBriefStep] = useState(0);      // pantallas internas del briefing
  const [tab, setTab]     = useState('suspects');     // suspects | map | timeline | board
  const [sospSel, setSospSel] = useState(null);
  const [pasoIdx, setPasoIdx] = useState({});         // sId -> paso actual
  const [fallos, setFallos] = useState({});           // sId:step -> intentos fallidos
  const [wrong, setWrong] = useState(null);
  const [charla, setCharla] = useState(null);         // respuesta del sospechoso en pantalla
  const [board, setBoard] = useState([]);             // evidencias del escuadrón
  const [rsSel, setRsSel] = useState(null);           // evidencia abierta para archivar
  const [rsWrong, setRsWrong] = useState(null);
  const [verSosp, setVerSosp] = useState('');
  const [verTeo, setVerTeo]   = useState(-1);
  const [reveal, setReveal] = useState(null);
  const [toast, setToast]   = useState(null);

  useEffect(() => {
    const s = io(API + '/files', { auth: { token } });
    sockRef.current = s;
    s.on('connect', () => { setConn('ok'); setMyId(s.id); });
    s.on('connect_error', () => { setConn('fail'); setErr('No connection. Try again in a few seconds. / Sin conexión, intenta en unos segundos.'); });
    s.on('files:players', (ps) => setPlayers(ps));
    s.on('files:error', (m) => setErr(m));
    s.on('files:phase', (d) => {
      setPlayers(d.players || []);
      setEndsAt(d.endsAt || 0);
      if (d.caso) setCaso(d.caso);
      setUi(d.fase);
      if (d.fase === 'briefing') setBriefStep(0);
      if (d.fase === 'investigation') { setTab('suspects'); setSospSel(null); setCharla(null); setWrong(null); }
      if (d.fase === 'deliberation') { setTab('board'); setRsSel(null); setRsWrong(null); }
    });
    s.on('files:evidence', (ev) => {
      setBoard(prev => prev.some(e => e.key === ev.key) ? prev : [...prev, ev]);
      setToast({ icon: '📌', text: ev.por + ' pinned: "' + ev.texto + '"' });
      setTimeout(() => setToast(null), 3500);
    });
    s.on('files:evidence-update', (u) => setBoard(prev => prev.map(e => e.key === u.key ? { ...e, archivada: u.archivada } : e)));
    s.on('files:verdict', (v) => { setVerSosp(v.sospechoso || ''); setVerTeo(v.teoria !== undefined ? v.teoria : -1); });
    s.on('files:reveal', (d) => { setReveal(d); setUi('reveal'); stopVoz(); });
    return () => { try { s.emit('files:leave'); s.disconnect(); } catch (e) {} stopVoz(); };
  }, [token]);

  useEffect(() => {
    if (!endsAt) return;
    const t = setInterval(() => setRest(Math.max(0, Math.round((endsAt - Date.now()) / 1000))), 300);
    return () => clearInterval(t);
  }, [endsAt]);

  const crear = (solo) => {
    setErr('');
    sockRef.current.emit(solo ? 'files:solo' : 'files:create', (r) => {
      if (r.ok) { setCode(r.code); setPlayers(r.players); setBoard([]); setReveal(null); setUi('lobby'); }
      else setErr(r.error || 'Error');
    });
  };
  const unirse = () => {
    setErr('');
    if (!/^\d{4}$/.test(joinCode.trim())) { setErr('The code has 4 digits. / El código es de 4 dígitos.'); return; }
    sockRef.current.emit('files:join', { code: joinCode.trim() }, (r) => {
      if (r.ok) { setCode(r.code); setPlayers(r.players); setBoard([]); setReveal(null); setUi('lobby'); }
      else setErr(r.error || 'Error');
    });
  };

  const yo = players.find(p => p.id === myId);
  const soyHost = yo && yo.isHost;
  const miSquad = yo ? yo.squad : '';
  const squadMates = players.filter(p => p.squad === miSquad);

  const S = {
    page: { minHeight: '100vh', background: '#0a0e1a', color: '#e2e8f0', fontFamily: "'Poppins',sans-serif", paddingBottom: '2rem' },
    wrap: { maxWidth: 560, margin: '0 auto', padding: '0 14px' },
    card: { background: 'rgba(15,23,42,.7)', border: '1px solid rgba(6,182,212,.2)', borderRadius: 16, padding: '1.1rem', boxShadow: '0 10px 30px rgba(0,0,0,.45)' },
    btn:  { border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer', fontFamily: "'Poppins',sans-serif" },
    cyan: { background: 'linear-gradient(135deg,#06b6d4,#0891b2)', color: '#fff' },
    ghost:{ background: 'rgba(15,23,42,.8)', color: '#94a3b8', border: '1px solid rgba(6,182,212,.25)' },
  };

  const mmss = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  const FASE_LABEL = { briefing: '📂 Briefing', investigation: '🔎 Investigation', deliberation: '🧩 Deliberation', verdict: '⚖️ Verdict' };

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', marginBottom: 10 }}>
      <button onClick={() => { stopVoz(); onBack(); }} style={{ ...S.btn, ...S.ghost, padding: '7px 14px', fontSize: '.76rem' }}>← Exit</button>
      <div style={{ fontWeight: 800, fontSize: '1rem' }}>🕵️ <span style={{ color: '#06b6d4' }}>AulaQuest</span> Files</div>
      <span style={{ fontSize: '.62rem', color: conn === 'ok' ? '#10b981' : conn === 'fail' ? '#ef4444' : '#f59e0b' }}>● {conn === 'ok' ? 'online' : conn === 'fail' ? 'offline' : '...'}</span>
    </div>
  );

  const errBox = err && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.35)', borderRadius: 10, padding: '9px 14px', margin: '8px 0', color: '#f87171', fontSize: '.78rem' }}>{err}</div>;
  const toastBox = toast && (
    <div style={{ position: 'fixed', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 90, maxWidth: '92vw', background: 'rgba(15,23,42,.95)', border: '1px solid rgba(6,182,212,.5)', borderRadius: 12, padding: '9px 16px', fontSize: '.76rem', boxShadow: '0 8px 30px rgba(0,0,0,.5)' }}>
      {toast.icon} {toast.text}
    </div>
  );

  // Barra de fase con timer y botón del anfitrión
  const faseBar = FASE_LABEL[ui] && (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <span style={{ fontSize: '.78rem', fontWeight: 800, color: '#06b6d4', whiteSpace: 'nowrap' }}>{FASE_LABEL[ui]}</span>
      <div style={{ flex: 1, height: 8, background: 'rgba(148,163,184,.12)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: (endsAt ? Math.max(0, Math.min(100, (rest / ((endsAt - (endsAt - rest * 1000)) ? ({ briefing: 180, investigation: 600, deliberation: 300, verdict: 120 }[ui] || 1) : 1)) * 100)) : 0) + '%', background: rest < 30 ? 'linear-gradient(90deg,#ef4444,#f97316)' : 'linear-gradient(90deg,#06b6d4,#6366f1)', borderRadius: 20, transition: 'width .3s linear' }} />
      </div>
      <span style={{ fontWeight: 800, fontSize: '.9rem', color: rest < 30 ? '#ef4444' : '#06b6d4', minWidth: 44, textAlign: 'right' }}>{mmss(rest)}</span>
      {soyHost && <button onClick={() => sockRef.current.emit('files:next')} style={{ ...S.btn, ...S.ghost, padding: '6px 10px', fontSize: '.66rem' }}>Next ⏭</button>}
    </div>
  );

  // ═══ MENU ═══
  if (ui === 'menu') return (
    <div style={S.page}><div style={S.wrap}>
      {header}{errBox}
      <div style={{ textAlign: 'center', margin: '1rem 0 1.4rem' }}>
        <div style={{ fontSize: '3rem' }}>🗂️</div>
        <h2 style={{ margin: '8px 0 2px', fontSize: '1.3rem' }}>Detective Cases</h2>
        <Sub>Resuelve casos en equipo interrogando sospechosos en inglés B1</Sub>
      </div>
      <div style={{ ...S.card, marginBottom: 12, textAlign: 'center' }}>
        <div style={{ fontWeight: 700 }}>🎪 Create an event</div>
        <Sub style={{ marginBottom: 10 }}>Crea un evento (1-50 jugadores) y comparte el código</Sub>
        <button onClick={() => crear(false)} disabled={conn !== 'ok'} style={{ ...S.btn, ...S.cyan, width: '100%', opacity: conn === 'ok' ? 1 : .5 }}>Create event</button>
      </div>
      <div style={{ ...S.card, marginBottom: 12, textAlign: 'center' }}>
        <div style={{ fontWeight: 700 }}>🎟️ Join with a code</div>
        <Sub style={{ marginBottom: 8 }}>Únete con el código del evento</Sub>
        <input value={joinCode} onChange={e => setJoin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0000" inputMode="numeric"
          style={{ width: 120, textAlign: 'center', fontSize: '1.4rem', letterSpacing: '.4em', background: '#0a0e1a', border: '1px solid rgba(6,182,212,.35)', borderRadius: 12, color: '#06b6d4', padding: '9px 0 9px .4em', fontWeight: 800, outline: 'none', marginBottom: 10 }} />
        <button onClick={unirse} disabled={conn !== 'ok'} style={{ ...S.btn, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', width: '100%', opacity: conn === 'ok' ? 1 : .5 }}>Join event</button>
      </div>
      <div style={{ ...S.card, textAlign: 'center' }}>
        <div style={{ fontWeight: 700 }}>🕵️ Play solo</div>
        <Sub style={{ marginBottom: 10 }}>Juega con detectives NPC que cubren los otros roles</Sub>
        <button onClick={() => crear(true)} disabled={conn !== 'ok'} style={{ ...S.btn, ...S.ghost, width: '100%', opacity: conn === 'ok' ? 1 : .5 }}>Start solo case</button>
      </div>
    </div></div>
  );

  // ═══ LOBBY ═══
  if (ui === 'lobby') return (
    <div style={S.page}><div style={S.wrap}>
      {header}{errBox}
      <div style={{ ...S.card, textAlign: 'center', marginBottom: 12 }}>
        <div style={{ color: '#64748b', fontSize: '.72rem' }}>EVENT CODE <span style={{ color: '#334155' }}>/ código del evento</span></div>
        <div style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '.35em', color: '#06b6d4', paddingLeft: '.35em' }}>{code}</div>
        <Sub>1-50 players · squads of 4-5 are formed automatically</Sub>
      </div>
      <div style={{ ...S.card, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: '.85rem', marginBottom: 10 }}>Detectives ({players.length})</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {players.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(10,14,26,.6)', borderRadius: 50, padding: '5px 12px 5px 6px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(6,182,212,.15)', border: '1px solid #06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', fontWeight: 800, color: '#06b6d4' }}>{(p.name || '?').slice(0, 2).toUpperCase()}</div>
              <span style={{ fontSize: '.74rem', fontWeight: 600 }}>{p.name}{p.isHost && ' 👑'}</span>
            </div>
          ))}
        </div>
      </div>
      {soyHost
        ? <button onClick={() => sockRef.current.emit('files:start')} style={{ ...S.btn, ...S.cyan, width: '100%', fontSize: '1rem' }}>🚨 Start the case</button>
        : <div style={{ textAlign: 'center', color: '#64748b', fontSize: '.8rem' }}>Waiting for the host… <Sub>Esperando al anfitrión…</Sub></div>}
    </div></div>
  );

  if (!caso && ui !== 'reveal') return (
    <div style={S.page}><div style={S.wrap}>{header}<div style={{ textAlign: 'center', color: '#64748b', marginTop: '3rem' }}>Opening the case file…</div></div></div>
  );

  // ═══ BRIEFING: título → tutorial → cinemática → escuadra y rol ═══
  if (ui === 'briefing') {
    const pasos = 1 + 1 + caso.cinematica.length + 1; // título, tutorial, escenas, squad
    const esc = briefStep - 2; // índice de escena
    return (
      <div style={S.page}><div style={S.wrap}>
        {toastBox}{header}{faseBar}
        {briefStep === 0 && (
          <div style={{ ...S.card, textAlign: 'center', padding: '2rem 1.2rem' }}>
            <div style={{ fontSize: '3.4rem' }}>🖼️</div>
            <h2 style={{ margin: '10px 0 4px', fontSize: '1.35rem', color: '#06b6d4' }}>{caso.titulo}</h2>
            <Sub>{caso.tituloEs}</Sub>
          </div>
        )}
        {briefStep === 1 && (
          <div style={{ ...S.card }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>How to play <Sub>Cómo se juega</Sub></div>
            {caso.tutorial.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: '1.4rem' }}>{t.icono}</span>
                <div><div style={{ fontSize: '.84rem', fontWeight: 600 }}>{t.en}</div><Sub>{t.es}</Sub></div>
              </div>
            ))}
          </div>
        )}
        {esc >= 0 && esc < caso.cinematica.length && (
          <div style={{ ...S.card, textAlign: 'center', padding: '1.8rem 1.2rem' }}>
            <div style={{ fontSize: '3rem' }}>{caso.cinematica[esc].icono}</div>
            <div style={{ fontSize: '.95rem', fontWeight: 600, margin: '12px 0 4px', lineHeight: 1.5 }}>{caso.cinematica[esc].texto}</div>
            <Sub>{caso.cinematica[esc].textoEs}</Sub>
            <button onClick={() => speakAlex(caso.cinematica[esc].texto, token)} style={{ ...S.btn, ...S.ghost, marginTop: 12, padding: '8px 16px', fontSize: '.74rem' }}>🔊 Mr. Alex narrates</button>
          </div>
        )}
        {briefStep === pasos - 1 && yo && (
          <div style={{ ...S.card, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem' }}>🎖️</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: 6 }}>{(players.find(p => p.id === myId) || {}).rol || 'Detective'}</div>
            <Sub>Tu rol en la escuadra</Sub>
            <div style={{ margin: '14px 0 6px', fontWeight: 700, color: '#06b6d4' }}>👥 Your squad <Sub>Tu escuadra</Sub></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {squadMates.map(p => (
                <div key={p.id} style={{ background: 'rgba(10,14,26,.6)', borderRadius: 10, padding: '8px 12px' }}>
                  <div style={{ fontSize: '.76rem', fontWeight: 700 }}>{p.name}{p.npc ? ' 🤖' : ''}{p.id === myId ? ' (you)' : ''}</div>
                  <div style={{ fontSize: '.62rem', color: '#06b6d4' }}>{p.rol}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {briefStep > 0 && <button onClick={() => { stopVoz(); setBriefStep(briefStep - 1); }} style={{ ...S.btn, ...S.ghost, flex: 1 }}>← Back</button>}
          {briefStep < pasos - 1 && <button onClick={() => { stopVoz(); setBriefStep(briefStep + 1); }} style={{ ...S.btn, ...S.cyan, flex: 2 }}>Continue →</button>}
          {briefStep === pasos - 1 && <div style={{ flex: 2, textAlign: 'center', color: '#64748b', fontSize: '.74rem', alignSelf: 'center' }}>The investigation starts when the timer ends {soyHost ? '(or press Next ⏭)' : ''}</div>}
        </div>
      </div></div>
    );
  }

  // ═══ INVESTIGATION + DELIBERATION (comparten tabs) ═══
  if (ui === 'investigation' || ui === 'deliberation') {
    const tabs = ui === 'investigation'
      ? [['suspects', '🕵️ Suspects'], ['map', '🗺️ Map'], ['timeline', '🕐 Timeline'], ['board', '📌 Board']]
      : [['board', '📌 Evidence Board'], ['suspects', '🕵️ Suspects'], ['timeline', '🕐 Timeline']];
    return (
      <div style={S.page}><div style={S.wrap}>
        {toastBox}{header}{faseBar}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto' }}>
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => { setTab(k); setSospSel(null); setCharla(null); setWrong(null); }}
              style={{ ...S.btn, padding: '8px 12px', fontSize: '.72rem', whiteSpace: 'nowrap', background: tab === k ? 'rgba(6,182,212,.18)' : 'rgba(15,23,42,.8)', color: tab === k ? '#06b6d4' : '#64748b', border: '1px solid ' + (tab === k ? 'rgba(6,182,212,.5)' : 'rgba(51,65,85,.4)') }}>{l}</button>
          ))}
        </div>

        {/* SUSPECTS */}
        {tab === 'suspects' && !sospSel && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {caso.sospechosos.map(sp => {
              const done = (pasoIdx[sp.id] || 0) >= sp.interrogatorio.length;
              return (
                <div key={sp.id} onClick={() => { if (ui === 'investigation') { setSospSel(sp.id); setCharla(null); setWrong(null); } }}
                  style={{ ...S.card, padding: '14px 10px', textAlign: 'center', cursor: ui === 'investigation' ? 'pointer' : 'default', border: '1px solid ' + sp.color + '55' }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}><Retrato r={sp.retrato} color={sp.color} size={64} /></div>
                  <div style={{ fontWeight: 700, fontSize: '.82rem', marginTop: 6 }}>{sp.nombre} {done && '✓'}</div>
                  <div style={{ fontSize: '.64rem', color: sp.color }}>{sp.cargo}</div>
                  <Sub>{sp.cargoEs}</Sub>
                  {ui === 'investigation' && <div style={{ fontSize: '.62rem', color: done ? '#10b981' : '#64748b', marginTop: 5, fontWeight: 700 }}>{done ? 'Interrogated' : (pasoIdx[sp.id] || 0) + '/' + sp.interrogatorio.length + ' questions'}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* INTERROGATORIO */}
        {tab === 'suspects' && sospSel && (() => {
          const sp = caso.sospechosos.find(x => x.id === sospSel);
          const idx = pasoIdx[sp.id] || 0;
          const paso = sp.interrogatorio[idx];
          return (
            <div>
              <div style={{ ...S.card, marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Retrato r={sp.retrato} color={sp.color} size={58} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>{sp.nombre} <span style={{ color: sp.color, fontSize: '.68rem', fontWeight: 600 }}>· {sp.cargo}</span></div>
                    <div style={{ fontSize: '.74rem', color: '#94a3b8', fontStyle: 'italic', marginTop: 3 }}>“{sp.coartada}” <button onClick={() => speakAlex(sp.coartada, token)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🔊</button></div>
                    <Sub>{sp.coartadaEs}</Sub>
                  </div>
                  <button onClick={() => setSospSel(null)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1rem', cursor: 'pointer' }}>✕</button>
                </div>
              </div>
              {charla && (
                <div style={{ ...S.card, marginBottom: 12, border: '1px solid ' + sp.color + '66' }}>
                  <div style={{ fontSize: '.66rem', fontWeight: 800, color: sp.color, marginBottom: 4 }}>{sp.nombre.toUpperCase()} ANSWERS <button onClick={() => speakAlex(charla.respuesta, token)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🔊</button></div>
                  <div style={{ fontSize: '.85rem' }}>“{charla.respuesta}”</div>
                  <Sub>{charla.respuestaEs}</Sub>
                  <div style={{ marginTop: 8, background: 'rgba(6,182,212,.1)', border: '1px solid rgba(6,182,212,.35)', borderRadius: 10, padding: '8px 12px' }}>
                    <div style={{ fontSize: '.64rem', fontWeight: 800, color: '#06b6d4' }}>📌 CLUE PINNED TO YOUR SQUAD BOARD</div>
                    <div style={{ fontSize: '.78rem', fontWeight: 600, marginTop: 2 }}>{charla.clue.en}</div>
                    <Sub>{charla.clue.es}</Sub>
                  </div>
                  <button onClick={() => setCharla(null)} style={{ ...S.btn, ...S.cyan, width: '100%', marginTop: 10, padding: '9px' }}>{idx >= sp.interrogatorio.length ? 'Done ✓' : 'Next question →'}</button>
                </div>
              )}
              {!charla && paso && (
                <div style={{ ...S.card }}>
                  <div style={{ fontSize: '.7rem', color: '#64748b', fontWeight: 700, marginBottom: 8 }}>Question {idx + 1}/{sp.interrogatorio.length} — choose the CORRECT question <Sub>Elige la pregunta bien formulada</Sub></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {paso.opts.map((o, i) => (
                      <button key={i} onClick={() => {
                        const fk = sp.id + ':' + idx;
                        if (i === paso.ans) {
                          const firstTry = !fallos[fk];
                          sockRef.current.emit('files:clue', { sId: sp.id, step: idx, firstTry }, () => {});
                          setCharla({ respuesta: paso.respuesta, respuestaEs: paso.respuestaEs, clue: paso.clue });
                          setPasoIdx(prev => ({ ...prev, [sp.id]: idx + 1 }));
                          setWrong(null);
                          speakAlex(paso.respuesta, token);
                        } else {
                          setFallos(prev => ({ ...prev, [fk]: (prev[fk] || 0) + 1 }));
                          setWrong(paso.feedback);
                        }
                      }} style={{ ...S.btn, textAlign: 'left', background: 'rgba(15,23,42,.85)', color: '#e2e8f0', border: '1px solid rgba(6,182,212,.28)', fontSize: '.8rem', fontWeight: 600 }}>{o}</button>
                    ))}
                  </div>
                  {wrong && (
                    <div style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.4)', borderRadius: 12, padding: '10px 14px', marginTop: 10 }}>
                      <div style={{ fontSize: '.7rem', fontWeight: 800, color: '#fbbf24' }}>💡 GRAMMAR TIP — try again!</div>
                      <div style={{ fontSize: '.78rem', fontWeight: 600, marginTop: 2 }}>{wrong.en}</div>
                      <Sub>{wrong.es}</Sub>
                    </div>
                  )}
                </div>
              )}
              {!charla && !paso && <div style={{ ...S.card, textAlign: 'center', color: '#10b981', fontWeight: 700 }}>✓ Interrogation complete <Sub>Interrogatorio completo — revisa el tablero</Sub></div>}
            </div>
          );
        })()}

        {/* MAP */}
        {tab === 'map' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {caso.mapa.map((m, i) => (
              <div key={i} style={{ ...S.card, padding: '10px 14px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem' }}>{m.icono}</span>
                <div><div style={{ fontWeight: 700, fontSize: '.82rem' }}>{m.lugar} <span style={{ color: '#475569', fontWeight: 400, fontSize: '.68rem' }}>/ {m.lugarEs}</span></div>
                  <div style={{ fontSize: '.72rem', color: '#94a3b8' }}>{m.nota}</div><Sub>{m.notaEs}</Sub></div>
              </div>
            ))}
          </div>
        )}

        {/* TIMELINE */}
        {tab === 'timeline' && (
          <div style={S.card}>
            {caso.timeline.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ minWidth: 66, fontWeight: 800, color: '#06b6d4', fontSize: '.78rem' }}>{t.hora}</div>
                <div style={{ flex: 1, borderLeft: '2px solid rgba(6,182,212,.3)', paddingLeft: 12 }}>
                  <div style={{ fontSize: '.8rem', fontWeight: 600 }}>{t.evento}</div><Sub>{t.eventoEs}</Sub>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EVIDENCE BOARD */}
        {tab === 'board' && (
          <div>
            <div style={{ fontSize: '.7rem', color: '#06b6d4', fontWeight: 800, marginBottom: 8 }}>📌 SQUAD EVIDENCE BOARD ({board.length}) <Sub>Tablero compartido — se actualiza en vivo</Sub></div>
            {board.length === 0 && <div style={{ ...S.card, textAlign: 'center', color: '#64748b', fontSize: '.78rem' }}>No clues yet. Interrogate the suspects! <Sub>Aún no hay pistas. ¡Interroga a los sospechosos!</Sub></div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {board.map(ev => (
                <div key={ev.key} style={{ ...S.card, padding: '10px 14px', border: '1px solid ' + (ev.archivada ? 'rgba(16,185,129,.4)' : ev.color + '55') }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontSize: '.64rem', fontWeight: 800, color: ev.color }}>{ev.sospechoso.toUpperCase()} · by {ev.por}</div>
                    {ev.archivada ? <span style={{ fontSize: '.64rem', color: '#10b981', fontWeight: 800 }}>FILED ✓</span> : ui === 'deliberation' && ev.rs && <button onClick={() => { setRsSel(ev); setRsWrong(null); }} style={{ ...S.btn, padding: '4px 10px', fontSize: '.62rem', background: 'rgba(245,158,11,.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,.4)' }}>File it 🗂️</button>}
                  </div>
                  <div style={{ fontSize: '.8rem', fontWeight: 600, marginTop: 3 }}>{ev.texto}</div>
                  <Sub>{ev.textoEs}</Sub>
                </div>
              ))}
            </div>
            {ui === 'deliberation' && rsSel && (
              <div style={{ ...S.card, marginTop: 12, border: '1px solid rgba(245,158,11,.5)' }}>
                <div style={{ fontSize: '.7rem', fontWeight: 800, color: '#fbbf24', marginBottom: 6 }}>🗂️ FILE THE EVIDENCE — report what the suspect said <Sub>Archiva la evidencia con el estilo indirecto correcto</Sub></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {rsSel.rsOpts.map((o, i) => (
                    <button key={i} onClick={() => {
                      sockRef.current.emit('files:rs', { key: rsSel.key, opt: i }, (r) => {
                        if (r.ok) { setRsSel(null); setRsWrong(null); }
                        else setRsWrong(r.feedback || { en: 'Try again!', es: '¡Intenta de nuevo!' });
                      });
                    }} style={{ ...S.btn, textAlign: 'left', background: 'rgba(15,23,42,.85)', color: '#e2e8f0', border: '1px solid rgba(245,158,11,.3)', fontSize: '.78rem', fontWeight: 600 }}>{o}</button>
                  ))}
                </div>
                {rsWrong && (
                  <div style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.4)', borderRadius: 10, padding: '9px 12px', marginTop: 8 }}>
                    <div style={{ fontSize: '.76rem', fontWeight: 600 }}>{rsWrong.en}</div><Sub>{rsWrong.es}</Sub>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div></div>
    );
  }

  // ═══ VERDICT ═══
  if (ui === 'verdict') return (
    <div style={S.page}><div style={S.wrap}>
      {toastBox}{header}{faseBar}
      <div style={{ fontSize: '.72rem', color: '#64748b', marginBottom: 8, textAlign: 'center' }}>Vote with your squad — selection is shared live <Sub>Vota con tu escuadra: la selección se comparte en vivo</Sub></div>
      <div style={{ fontWeight: 800, fontSize: '.82rem', margin: '6px 0' }}>1. Who is guilty? <span style={{ color: '#475569', fontWeight: 400, fontSize: '.7rem' }}>/ ¿Quién es culpable?</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {caso.sospechosos.map(sp => (
          <div key={sp.id} onClick={() => sockRef.current.emit('files:verdict', { sospechoso: sp.id })}
            style={{ textAlign: 'center', cursor: 'pointer', background: verSosp === sp.id ? 'rgba(239,68,68,.14)' : 'rgba(15,23,42,.7)', border: '2px solid ' + (verSosp === sp.id ? '#ef4444' : 'rgba(51,65,85,.4)'), borderRadius: 12, padding: '10px 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}><Retrato r={sp.retrato} color={sp.color} size={44} /></div>
            <div style={{ fontSize: '.62rem', fontWeight: 700, marginTop: 4 }}>{sp.nombre.split(' ')[0]}</div>
            {verSosp === sp.id && <div style={{ fontSize: '.6rem', color: '#ef4444', fontWeight: 800 }}>GUILTY?</div>}
          </div>
        ))}
      </div>
      <div style={{ fontWeight: 800, fontSize: '.82rem', margin: '6px 0' }}>2. Prove it <span style={{ color: '#475569', fontWeight: 400, fontSize: '.7rem' }}>/ Demuéstralo con must / can’t have been</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {caso.teorias.map((t, i) => (
          <button key={i} onClick={() => sockRef.current.emit('files:verdict', { teoria: i })}
            style={{ ...S.btn, textAlign: 'left', fontSize: '.78rem', fontWeight: 600, background: verTeo === i ? 'rgba(6,182,212,.16)' : 'rgba(15,23,42,.8)', color: '#e2e8f0', border: '2px solid ' + (verTeo === i ? '#06b6d4' : 'rgba(51,65,85,.4)') }}>
            {t.texto}
            <Sub>{t.textoEs}</Sub>
          </button>
        ))}
      </div>
    </div></div>
  );

  // ═══ REVEAL ═══
  if (ui === 'reveal' && reveal) {
    const sospCulp = caso && caso.sospechosos.find(s => s.id === reveal.culpable);
    return (
      <div style={S.page}><div style={S.wrap}>
        {header}
        <div style={{ ...S.card, textAlign: 'center', marginBottom: 12, border: '1px solid rgba(239,68,68,.5)' }}>
          <div style={{ fontSize: '.7rem', fontWeight: 800, color: '#ef4444', letterSpacing: '.1em' }}>CASE CLOSED — THE CULPRIT WAS</div>
          {sospCulp && <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0 6px' }}><Retrato r={sospCulp.retrato} color="#ef4444" size={84} /></div>}
          <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{reveal.culpableNombre} 🔒</div>
          {reveal.contradiccion && (
            <div style={{ marginTop: 10, textAlign: 'left', background: 'rgba(10,14,26,.6)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: '.68rem', fontWeight: 800, color: '#f59e0b', marginBottom: 4 }}>⚡ THE CONTRADICTION <button onClick={() => speakAlex(reveal.contradiccion.en, token)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🔊</button></div>
              <div style={{ fontSize: '.8rem' }}>{reveal.contradiccion.en}</div>
              <Sub>{reveal.contradiccion.es}</Sub>
            </div>
          )}
        </div>
        {reveal.mvp && (
          <div style={{ ...S.card, textAlign: 'center', marginBottom: 12, border: '1px solid rgba(245,158,11,.5)' }}>
            <div style={{ fontSize: '1.4rem' }}>🏅</div>
            <div style={{ fontWeight: 800 }}>MVP: {reveal.mvp.name} <span style={{ color: '#f59e0b' }}>· {reveal.mvp.puntos} pts</span></div>
            <Sub>{reveal.mvp.rol}</Sub>
          </div>
        )}
        <div style={{ ...S.card, marginBottom: 14 }}>
          <div style={{ fontSize: '.7rem', fontWeight: 800, color: '#06b6d4', marginBottom: 8 }}>🏆 SQUAD PODIUM</div>
          {reveal.podium.map((sq, i) => (
            <div key={sq.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, background: 'rgba(10,14,26,.6)', borderRadius: 10, padding: '9px 12px' }}>
              <span style={{ fontSize: '1rem' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '.8rem' }}>{sq.nombre}</div>
                <div style={{ fontSize: '.64rem', color: '#64748b' }}>{sq.acerto ? '✅ caught the culprit' : '❌ wrong suspect'}{sq.teoriaOk ? ' · ✅ right theory' : ''} · {sq.evidencias} clues</div>
              </div>
              <span style={{ fontWeight: 800, color: '#06b6d4' }}>{sq.puntos}</span>
            </div>
          ))}
        </div>
        <button onClick={() => { stopVoz(); onBack(); }} style={{ ...S.btn, ...S.cyan, width: '100%' }}>Back to the classroom</button>
      </div></div>
    );
  }

  return (
    <div style={S.page}><div style={S.wrap}>{header}{errBox}<div style={{ textAlign: 'center', color: '#64748b', marginTop: '3rem' }}>Loading…</div></div></div>
  );
}
