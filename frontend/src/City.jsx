import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const API = import.meta.env.VITE_API_URL || 'https://nexlum-aulaquest.onrender.com';

// ─── AulaQuest City — juego cooperativo A2 (componente aislado) ───
// UI en inglés simple con subtítulo de apoyo en español (gris pequeño).
// TTS: Web Speech API del navegador (en-US, rate 0.92) — no gasta API de pago.

function speak(text) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.92;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

function Sub({ children }) {
  return <div style={{ color: '#64748b', fontSize: '.72rem', marginTop: 2 }}>{children}</div>;
}

function Avatar({ name, size }) {
  const s = size || 30;
  const ini = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#84cc16'];
  const color = colors[(name || '').length % colors.length];
  return (
    <div style={{ width: s, height: s, borderRadius: '50%', background: color + '22', border: '2px solid ' + color, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontWeight: 800, fontSize: s * 0.34, flexShrink: 0 }}>{ini}</div>
  );
}

export default function CityGame({ token, onBack }) {
  const sockRef = useRef(null);
  const [fase, setFase]   = useState('loading'); // loading | team | map | mission
  const [err, setErr]     = useState('');
  const [state, setState] = useState(null);      // { districts, missions, team, progress, userId }
  const [distSel, setDistSel] = useState(null);  // distrito seleccionado en el mapa
  const [showDicc, setShowDicc] = useState(false);
  const [feed, setFeed]   = useState([]);
  const [toast, setToast] = useState(null);
  const [sosIn, setSosIn] = useState(null);      // SOS recibido de un compañero
  const [hintIn, setHintIn] = useState(null);    // pista recibida
  const [teamNombre, setTeamNombre] = useState('');
  const [joinCode, setJoinCode]     = useState('');

  // ── Misión activa ──
  const [mision, setMision] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [wrong, setWrong]     = useState(null);  // feedback bilingüe al fallar
  const [buildSel, setBuildSel] = useState([]);  // palabras elegidas en build
  const [xpGanado, setXpGanado] = useState(0);
  const [teachWord, setTeachWord] = useState('');
  const [finData, setFinData]   = useState(null);

  const authH = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };

  const cargar = async () => {
    try {
      const r = await fetch(API + '/api/city/state', { headers: authH });
      if (!r.ok) throw new Error('No se pudo cargar City');
      const d = await r.json();
      setState(d);
      setFeed((d.team && d.team.feed) ? d.team.feed.slice(-15) : []);
      setFase(d.team ? 'map' : 'team');
    } catch (e) { setErr(e.message); setFase('team'); }
  };

  useEffect(() => {
    cargar();
    const s = io(API + '/city', { auth: { token } });
    sockRef.current = s;
    s.on('city:card',   (c) => {
      setState(prev => prev && prev.team ? { ...prev, team: { ...prev.team, diccionario: [...prev.team.diccionario, c] } } : prev);
      setToast({ icon: '🃏', text: c.aportadaPor + ' unlocked "' + c.en + '"' });
      setTimeout(() => setToast(null), 3500);
    });
    s.on('city:feed',   (f) => setFeed(f));
    s.on('city:points', (p) => setState(prev => prev && prev.team ? { ...prev, team: { ...prev.team, puntos: p.puntos } } : prev));
    s.on('city:unlock', (u) => {
      setState(prev => prev && prev.team ? { ...prev, team: { ...prev.team, distritosCompletados: u.completados } } : prev);
      setToast({ icon: '🎉', text: 'District completed by the team!' });
      setTimeout(() => setToast(null), 4000);
    });
    s.on('city:sos',  (d) => { setSosIn(d); setTimeout(() => setSosIn(null), 15000); });
    s.on('city:hint', (d) => { setHintIn(d); setTimeout(() => setHintIn(null), 12000); });
    return () => { try { s.disconnect(); } catch (e) {} window.speechSynthesis && window.speechSynthesis.cancel(); };
  }, [token]);

  // ── Acciones de equipo ──
  const crearEquipo = async () => {
    setErr('');
    const r = await fetch(API + '/api/city/team', { method: 'POST', headers: authH, body: JSON.stringify({ nombre: teamNombre }) });
    const d = await r.json();
    if (!r.ok) { setErr(d.msg || 'Error'); return; }
    sockRef.current.emit('city:room');
    cargar();
  };
  const unirseEquipo = async () => {
    setErr('');
    const r = await fetch(API + '/api/city/team/join', { method: 'POST', headers: authH, body: JSON.stringify({ code: joinCode }) });
    const d = await r.json();
    if (!r.ok) { setErr(d.msg || 'Error'); return; }
    sockRef.current.emit('city:room');
    cargar();
  };

  // ── Motor de misiones ──
  const empezarMision = (m) => {
    // Palabra de OTRO compañero para el paso "teach" (Profesor por un día)
    const dicc = (state.team && state.team.diccionario) || [];
    const ajenas = dicc.filter(c => String(c.userId) !== String(state.userId));
    const pick = ajenas.length ? ajenas[Math.floor(Math.random() * ajenas.length)].en
               : (dicc.length ? dicc[Math.floor(Math.random() * dicc.length)].en : 'delicious');
    setTeachWord(pick);
    setMision(m); setStepIdx(0); setWrong(null); setBuildSel([]); setXpGanado(0); setFinData(null);
    setFase('mission');
  };

  const pasoOk = (paso) => {
    // Notificar al servidor: XP + carta al diccionario en tiempo real
    sockRef.current.emit('city:step', { misionId: mision._id, stepIndex: stepIdx }, (r) => {
      if (r && r.ok) setXpGanado(x => x + r.xp);
    });
    setWrong(null); setBuildSel([]);
    if (stepIdx + 1 < mision.pasos.length) setStepIdx(stepIdx + 1);
    else {
      sockRef.current.emit('city:mission-done', { misionId: mision._id }, (r) => {
        setFinData(r && r.ok ? r : {});
        cargarProgresoLocal(mision);
      });
    }
  };

  const cargarProgresoLocal = (m) => {
    setState(prev => {
      if (!prev) return prev;
      const yaP = prev.progress.misionesCompletadas.some(x => String(x.misionId) === String(m._id));
      const prog = yaP ? prev.progress : { ...prev.progress, misionesCompletadas: [...prev.progress.misionesCompletadas, { distrito: m.distrito, misionId: m._id }] };
      let team = prev.team;
      if (team && !team.misionesCompletadas.some(x => String(x.misionId) === String(m._id))) {
        team = { ...team, misionesCompletadas: [...team.misionesCompletadas, { distrito: m.distrito, misionId: m._id, porName: 'you' }] };
      }
      return { ...prev, progress: prog, team };
    });
  };

  const responder = (paso, i) => {
    if (i === paso.answer) pasoOk(paso);
    else setWrong(paso.feedback);
  };
  const checkBuild = (paso) => {
    const intento = buildSel.join(' ').replace(/[.,?!]/g, '').toLowerCase();
    const correcto = String(paso.answer).replace(/[.,?!]/g, '').toLowerCase();
    if (intento === correcto) pasoOk(paso);
    else { setWrong(paso.feedback); setBuildSel([]); }
  };

  const rep = (t) => String(t || '').replaceAll('{word}', teachWord);

  // ── Estilos base (tema oscuro cyan de AulaQuest, mobile-first) ──
  const S = {
    page: { minHeight: '100vh', background: '#0a0e1a', color: '#e2e8f0', fontFamily: "'Poppins',sans-serif", paddingBottom: '2rem' },
    wrap: { maxWidth: 560, margin: '0 auto', padding: '0 14px' },
    card: { background: 'rgba(15,23,42,.7)', border: '1px solid rgba(6,182,212,.2)', borderRadius: 16, padding: '1.1rem', boxShadow: '0 10px 30px rgba(0,0,0,.45)' },
    btn:  { border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer', fontFamily: "'Poppins',sans-serif" },
    cyan: { background: 'linear-gradient(135deg,#06b6d4,#0891b2)', color: '#fff' },
    ghost:{ background: 'rgba(15,23,42,.8)', color: '#94a3b8', border: '1px solid rgba(6,182,212,.25)' },
  };

  const header = (titulo, backFn) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', marginBottom: 10 }}>
      <button onClick={backFn || onBack} style={{ ...S.btn, ...S.ghost, padding: '7px 14px', fontSize: '.76rem' }}>← Back</button>
      <div style={{ fontWeight: 800, fontSize: '1.02rem' }}>🏙️ <span style={{ color: '#06b6d4' }}>AulaQuest</span> City</div>
      <div style={{ width: 60, textAlign: 'right', fontSize: '.7rem', color: '#64748b' }}>{titulo || ''}</div>
    </div>
  );

  const toastBox = toast && (
    <div style={{ position: 'fixed', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 90, background: 'rgba(15,23,42,.95)', border: '1px solid rgba(6,182,212,.5)', borderRadius: 12, padding: '9px 18px', fontSize: '.8rem', boxShadow: '0 8px 30px rgba(0,0,0,.5)' }}>
      {toast.icon} {toast.text}
    </div>
  );

  const sosBanner = sosIn && (
    <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 91, width: 'min(520px,94vw)', background: 'rgba(30,15,15,.97)', border: '1px solid rgba(239,68,68,.5)', borderRadius: 14, padding: '12px 16px' }}>
      <div style={{ fontSize: '.82rem', fontWeight: 700, color: '#f87171' }}>🆘 {sosIn.name} needs help!</div>
      <Sub>{sosIn.name} necesita ayuda {sosIn.mision ? 'en "' + sosIn.mision + '"' : ''} — mándale una pista (+20 pts de equipo)</Sub>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input id="hintInput" placeholder="Write a hint... / Escribe una pista..." style={{ flex: 1, background: '#0a0e1a', border: '1px solid rgba(6,182,212,.3)', borderRadius: 9, color: '#e2e8f0', padding: '8px 12px', fontSize: '.78rem', outline: 'none' }} />
        <button onClick={() => { const v = document.getElementById('hintInput').value.trim(); if (v) { sockRef.current.emit('city:hint', { pista: v }); setSosIn(null); } }} style={{ ...S.btn, ...S.cyan, padding: '8px 14px', fontSize: '.76rem' }}>Send</button>
      </div>
    </div>
  );

  const hintBanner = hintIn && (
    <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 92, width: 'min(520px,94vw)', background: 'rgba(8,30,25,.97)', border: '1px solid rgba(16,185,129,.5)', borderRadius: 14, padding: '12px 16px' }}>
      <div style={{ fontSize: '.82rem', fontWeight: 700, color: '#34d399' }}>💡 Hint from {hintIn.from}</div>
      <div style={{ fontSize: '.85rem', marginTop: 4 }}>{hintIn.pista}</div>
    </div>
  );

  // ═══ LOADING ═══
  if (fase === 'loading') return (
    <div style={S.page}><div style={S.wrap}>{header()}<div style={{ textAlign: 'center', color: '#64748b', marginTop: '3rem' }}>Loading the city… <Sub>Cargando la ciudad…</Sub></div></div></div>
  );

  // ═══ SIN EQUIPO: crear o unirse ═══
  if (fase === 'team') return (
    <div style={S.page}><div style={S.wrap}>
      {header()}
      {err && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.35)', borderRadius: 10, padding: '9px 14px', margin: '8px 0', color: '#f87171', fontSize: '.78rem' }}>{err}</div>}
      <div style={{ textAlign: 'center', margin: '1.2rem 0 1.6rem' }}>
        <div style={{ fontSize: '3rem' }}>🏙️</div>
        <h2 style={{ margin: '8px 0 4px', fontSize: '1.25rem' }}>Explore the city with your team</h2>
        <Sub>Explora la ciudad con tu equipo — el equipo dura semanas, aprenden juntos</Sub>
      </div>
      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 2 }}>Create a team</div>
        <Sub>Crea un equipo y comparte el código (2-8 jugadores)</Sub>
        <input value={teamNombre} onChange={e => setTeamNombre(e.target.value)} placeholder="Team name / Nombre del equipo"
          style={{ width: '100%', boxSizing: 'border-box', margin: '10px 0', background: '#0a0e1a', border: '1px solid rgba(6,182,212,.3)', borderRadius: 10, color: '#e2e8f0', padding: '11px 14px', fontSize: '.85rem', outline: 'none' }} />
        <button onClick={crearEquipo} style={{ ...S.btn, ...S.cyan, width: '100%' }}>Create team</button>
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 2 }}>Join with a code</div>
        <Sub>Únete con el código que te compartió tu equipo</Sub>
        <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))} placeholder="ABC123"
          style={{ width: '100%', boxSizing: 'border-box', margin: '10px 0', background: '#0a0e1a', border: '1px solid rgba(139,92,246,.35)', borderRadius: 10, color: '#c4b5fd', padding: '11px 14px', fontSize: '1rem', letterSpacing: '.3em', textAlign: 'center', fontWeight: 800, outline: 'none' }} />
        <button onClick={unirseEquipo} style={{ ...S.btn, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', width: '100%' }}>Join team</button>
      </div>
    </div></div>
  );

  if (!state) return null;
  const { districts, missions, team, progress } = state;
  const completadosEquipo = (team && team.distritosCompletados) || [];
  const misionesEquipo = (team && team.misionesCompletadas) || [];
  const dicc = (team && team.diccionario) || [];

  // ═══ MAPA DE LA CIUDAD ═══
  if (fase === 'map') {
    const metaHoy = progress.fechaHoy === new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10) ? progress.misionesHoy : 0;
    return (
      <div style={S.page}><div style={S.wrap}>
        {toastBox}{sosBanner}{hintBanner}
        {header()}
        {/* Barra personal: XP, racha, meta diaria */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[['⭐', progress.xp + ' XP', 'tu experiencia'], ['🔥', progress.racha + ' day streak', 'racha diaria'], ['🎯', metaHoy + '/3 today', 'meta de hoy']].map(([i, t, s]) => (
            <div key={t} style={{ flex: 1, background: 'rgba(15,23,42,.7)', border: '1px solid rgba(6,182,212,.18)', borderRadius: 12, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: '.82rem', fontWeight: 800 }}>{i} {t}</div>
              <div style={{ fontSize: '.6rem', color: '#475569' }}>{s}</div>
            </div>
          ))}
        </div>

        {/* Panel del equipo */}
        <div style={{ ...S.card, marginBottom: 14, padding: '.9rem 1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '.92rem' }}>👥 {team.nombre} <span style={{ color: '#f59e0b', fontSize: '.78rem' }}>· {team.puntos} team pts</span></div>
              <Sub>Código de invitación: <b style={{ color: '#06b6d4', letterSpacing: '.15em' }}>{team.code}</b> · {team.miembros.length}/8 jugadores</Sub>
            </div>
            <div style={{ display: 'flex' }}>
              {team.miembros.slice(0, 6).map((m, i) => <div key={i} style={{ marginLeft: i ? -8 : 0 }}><Avatar name={m.name} /></div>)}
            </div>
            <button onClick={() => setShowDicc(true)} style={{ ...S.btn, ...S.ghost, padding: '8px 12px', fontSize: '.72rem' }}>🃏 Dictionary ({dicc.length})</button>
          </div>
        </div>

        {/* Distritos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {districts.map(d => {
            const bloqueado = completadosEquipo.length < d.requiereCompletados;
            const misionesDist = missions.filter(m => m.distrito === d.id);
            const hechasEquipo = new Set(misionesEquipo.filter(m => m.distrito === d.id).map(m => String(m.misionId))).size;
            const completo = completadosEquipo.includes(d.id);
            return (
              <div key={d.id} onClick={() => { if (!bloqueado) { setDistSel(distSel === d.id ? null : d.id); } }}
                style={{ background: completo ? 'rgba(16,185,129,.08)' : 'rgba(15,23,42,.7)', border: '1px solid ' + (completo ? 'rgba(16,185,129,.4)' : distSel === d.id ? d.color : 'rgba(6,182,212,.18)'), borderRadius: 14, padding: '12px 12px', cursor: bloqueado ? 'not-allowed' : 'pointer', opacity: bloqueado ? 0.5 : 1, textAlign: 'center', transition: 'transform .15s', position: 'relative' }}>
                {completo && <span style={{ position: 'absolute', top: 8, right: 10, color: '#34d399', fontWeight: 800, fontSize: '.8rem' }}>✓</span>}
                {bloqueado && <span style={{ position: 'absolute', top: 8, right: 10, fontSize: '.8rem' }}>🔒</span>}
                <div style={{ fontSize: '1.9rem' }}>{d.icono}</div>
                <div style={{ fontWeight: 700, fontSize: '.85rem' }}>{d.nombre}</div>
                <Sub>{d.nombreEs} · {d.temaEs}</Sub>
                <div style={{ fontSize: '.64rem', color: bloqueado ? '#475569' : d.color, fontWeight: 700, marginTop: 4 }}>
                  {bloqueado ? 'Team: complete ' + d.requiereCompletados + ' districts' : hechasEquipo + '/' + misionesDist.length + ' missions'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Misiones del distrito seleccionado */}
        {distSel && (() => {
          const d = districts.find(x => x.id === distSel);
          const ms = missions.filter(m => m.distrito === distSel);
          return (
            <div style={{ ...S.card, marginBottom: 14, border: '1px solid ' + d.color + '55' }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>{d.icono} {d.nombre} — missions</div>
              {ms.map(m => {
                const hechaYo = progress.misionesCompletadas.some(x => String(x.misionId) === String(m._id));
                const hechaEq = misionesEquipo.find(x => String(x.misionId) === String(m._id));
                return (
                  <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(10,14,26,.6)', borderRadius: 10, padding: '9px 12px', marginBottom: 7 }}>
                    <span style={{ fontSize: '1.2rem' }}>{m.npcIcon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '.8rem', fontWeight: 700 }}>{m.titulo} {hechaYo && <span style={{ color: '#34d399' }}>✓</span>}</div>
                      <Sub>{m.tituloEs} · {m.pasos.length} steps{hechaEq && !hechaYo ? ' · done by ' + hechaEq.porName : ''}</Sub>
                    </div>
                    <button onClick={() => empezarMision(m)} style={{ ...S.btn, ...(hechaYo ? S.ghost : S.cyan), padding: '8px 14px', fontSize: '.72rem' }}>{hechaYo ? 'Replay' : 'Play ▶'}</button>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Feed en vivo */}
        <div style={{ ...S.card, padding: '1rem' }}>
          <div style={{ fontSize: '.7rem', color: '#06b6d4', fontWeight: 800, letterSpacing: '.06em', marginBottom: 8 }}>📡 TEAM FEED <span style={{ color: '#475569', fontWeight: 400 }}>· actividad en vivo</span></div>
          {feed.length === 0 && <Sub>No activity yet — play a mission! / Aún no hay actividad</Sub>}
          {[...feed].reverse().map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '.8rem' }}>{f.tipo === 'card' ? '🃏' : f.tipo === 'mission' ? '✅' : f.tipo === 'sos' ? '🆘' : f.tipo === 'unlock' ? '🎉' : '👋'}</span>
              <span style={{ fontSize: '.74rem', color: '#94a3b8' }}><b style={{ color: '#e2e8f0' }}>{f.name}</b> {f.texto}</span>
            </div>
          ))}
        </div>

        {/* Modal diccionario compartido */}
        {showDicc && (
          <div onClick={() => setShowDicc(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,.8)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
            <div onClick={e => e.stopPropagation()} style={{ ...S.card, width: 'min(520px,100%)', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontWeight: 800 }}>🃏 Team Dictionary <Sub>Diccionario compartido del equipo</Sub></div>
                <button onClick={() => setShowDicc(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1rem', cursor: 'pointer' }}>✕</button>
              </div>
              {dicc.length === 0 && <Sub>Complete mission steps to unlock cards / Completa pasos de misiones para desbloquear cartas</Sub>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {dicc.map((c, i) => (
                  <div key={i} style={{ background: 'rgba(10,14,26,.7)', border: '1px solid rgba(6,182,212,.25)', borderRadius: 10, padding: '9px 11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: '.78rem' }}>{c.en}</div>
                      <button onClick={() => speak(c.en)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.85rem' }}>🔊</button>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '.7rem' }}>{c.es}</div>
                    <div style={{ color: '#475569', fontSize: '.6rem', marginTop: 3 }}>by {c.aportadaPor}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div></div>
    );
  }

  // ═══ MISIÓN (motor de ejercicios) ═══
  if (fase === 'mission' && mision) {
    const paso = mision.pasos[stepIdx];
    const pct = Math.round((stepIdx / mision.pasos.length) * 100);

    // Pantalla final de la misión
    if (finData) return (
      <div style={S.page}><div style={S.wrap}>
        {toastBox}{sosBanner}{hintBanner}
        {header('', () => { setFase('map'); setMision(null); })}
        <div style={{ ...S.card, textAlign: 'center', marginTop: '1.5rem' }}>
          <div style={{ fontSize: '2.6rem' }}>🏆</div>
          <h2 style={{ margin: '6px 0 2px', fontSize: '1.2rem' }}>Mission complete!</h2>
          <Sub>¡Misión completada!</Sub>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#06b6d4', margin: '12px 0 4px' }}>+{xpGanado} XP</div>
          {finData.misionesHoy !== undefined && (
            <div style={{ margin: '10px 0' }}>
              <div style={{ fontSize: '.82rem', fontWeight: 700 }}>🎯 Daily goal: {Math.min(finData.misionesHoy, 3)}/3</div>
              {finData.metaCumplida && <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '.9rem', marginTop: 6 }}>🔥 Streak: {finData.racha} days! <Sub>¡Cumpliste tu meta de hoy!</Sub></div>}
            </div>
          )}
          <button onClick={() => { setFase('map'); setMision(null); }} style={{ ...S.btn, ...S.cyan, width: '100%', marginTop: 10 }}>Back to the city</button>
        </div>
      </div></div>
    );

    return (
      <div style={S.page}><div style={S.wrap}>
        {toastBox}{sosBanner}{hintBanner}
        {header('', () => { setFase('map'); setMision(null); window.speechSynthesis && window.speechSynthesis.cancel(); })}

        {/* Progreso de la misión */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: '.7rem', color: '#64748b', fontWeight: 700, whiteSpace: 'nowrap' }}>{mision.titulo} · {stepIdx + 1}/{mision.pasos.length}</span>
          <div style={{ flex: 1, height: 8, background: 'rgba(148,163,184,.12)', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg,#06b6d4,#6366f1)', borderRadius: 20, transition: 'width .4s' }} />
          </div>
          <span style={{ fontSize: '.72rem', color: '#f59e0b', fontWeight: 800 }}>+{xpGanado}</span>
        </div>

        {/* NPC + diálogo */}
        <div style={{ ...S.card, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ fontSize: '2.2rem' }}>{mision.npcIcon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '.62rem', color: '#06b6d4', fontWeight: 800, letterSpacing: '.06em' }}>{mision.npc.toUpperCase()}{paso.type === 'teach' && ' · 👨‍🏫 TEACHER TIME (+25 XP)'}</div>
              <div style={{ fontSize: '.95rem', fontWeight: 600, marginTop: 3 }}>
                {rep(paso.say)}
                {paso.type !== 'listen' && <button onClick={() => speak(rep(paso.say))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.95rem', marginLeft: 6 }}>🔊</button>}
              </div>
              <Sub>{rep(paso.sayEs)}</Sub>
            </div>
          </div>
        </div>

        {/* listen: botón grande de audio */}
        {paso.type === 'listen' && (
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <button onClick={() => speak(paso.say)} style={{ ...S.btn, ...S.cyan, fontSize: '1.05rem', padding: '14px 30px' }}>🔊 Listen</button>
            <Sub>Toca para escuchar (puedes repetir)</Sub>
          </div>
        )}

        {/* choice / listen / teach: opciones */}
        {(paso.type === 'choice' || paso.type === 'listen' || paso.type === 'teach') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 12 }}>
            {paso.opts.map((o, i) => (
              <button key={i} onClick={() => responder(paso, i)}
                style={{ ...S.btn, textAlign: 'left', background: 'rgba(15,23,42,.8)', color: '#e2e8f0', border: '1px solid rgba(6,182,212,.28)', fontSize: '.85rem', fontWeight: 600 }}>
                {rep(o)}
              </button>
            ))}
          </div>
        )}

        {/* build: armar la frase tocando palabras */}
        {paso.type === 'build' && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ minHeight: 52, background: 'rgba(10,14,26,.8)', border: '1px dashed rgba(6,182,212,.4)', borderRadius: 12, padding: '10px 12px', display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
              {buildSel.length === 0 && <span style={{ color: '#334155', fontSize: '.78rem' }}>Tap the words in order… <span style={{ color: '#1e293b' }}>/ Toca las palabras en orden</span></span>}
              {buildSel.map((w, i) => (
                <button key={i} onClick={() => setBuildSel(buildSel.filter((_, j) => j !== i))}
                  style={{ ...S.btn, padding: '7px 12px', fontSize: '.8rem', background: 'linear-gradient(135deg,#06b6d4,#6366f1)', color: '#fff' }}>{w}</button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
              {paso.words.map((w, i) => {
                const usadas = buildSel.filter(x => x === w).length;
                const disp = paso.words.filter(x => x === w).length - usadas;
                return (
                  <button key={i} disabled={disp <= 0} onClick={() => setBuildSel([...buildSel, w])}
                    style={{ ...S.btn, padding: '7px 12px', fontSize: '.8rem', background: 'rgba(15,23,42,.85)', color: disp > 0 ? '#e2e8f0' : '#334155', border: '1px solid rgba(6,182,212,.25)', opacity: disp > 0 ? 1 : 0.4 }}>{w}</button>
                );
              })}
            </div>
            <button onClick={() => checkBuild(paso)} disabled={buildSel.length === 0} style={{ ...S.btn, ...S.cyan, width: '100%', opacity: buildSel.length ? 1 : 0.5 }}>Check ✓</button>
          </div>
        )}

        {/* Feedback pedagógico: el error enseña, nunca castiga */}
        {wrong && (
          <div style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.4)', borderRadius: 12, padding: '11px 14px', marginBottom: 12 }}>
            <div style={{ fontSize: '.72rem', fontWeight: 800, color: '#fbbf24', marginBottom: 3 }}>💡 GRAMMAR TIP — try again!</div>
            <div style={{ fontSize: '.8rem', fontWeight: 600 }}>{wrong.en}</div>
            <Sub>{wrong.es}</Sub>
          </div>
        )}

        {/* SOS */}
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => { sockRef.current.emit('city:sos', { titulo: mision.titulo }); setToast({ icon: '🆘', text: 'SOS sent to your team!' }); setTimeout(() => setToast(null), 3000); }}
            style={{ ...S.btn, background: 'rgba(239,68,68,.1)', color: '#f87171', border: '1px solid rgba(239,68,68,.35)', padding: '9px 18px', fontSize: '.75rem' }}>
            🆘 SOS — ask your team <span style={{ color: '#7f1d1d' }}>/ pide ayuda</span>
          </button>
        </div>
      </div></div>
    );
  }

  return null;
}
