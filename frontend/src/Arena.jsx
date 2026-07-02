import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const API = import.meta.env.VITE_API_URL || 'https://nexlum-aulaquest.onrender.com';

// ─── AulaQuest Arena — quiz multijugador en tiempo real (estilo Kahoot, A1) ──
// Componente aislado: no toca nada del resto de la app.

const LETRAS = ['A', 'B', 'C', 'D'];
const OPT_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981'];
const REACCIONES = ['👏', '🔥', '😂', '💪', '🎉', '😱'];

function Avatar({ name, color, size }) {
  const s = size || 38;
  const ini = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{width:s,height:s,borderRadius:'50%',background:color+'22',border:'2px solid '+color,display:'flex',alignItems:'center',justifyContent:'center',color,fontWeight:800,fontSize:s*0.34,flexShrink:0}}>
      {ini}
    </div>
  );
}

export default function ArenaGame({ token, onBack }) {
  const sockRef = useRef(null);
  const [conn, setConn]       = useState('...');   // '...' | 'ok' | 'fail'
  const [fase, setFase]       = useState('menu');  // menu | lobby | starting | question | reveal | end
  const [err, setErr]         = useState('');
  const [code, setCode]       = useState('');
  const [joinCode, setJoin]   = useState('');
  const [players, setPlayers] = useState([]);
  const [myId, setMyId]       = useState('');
  const [preg, setPreg]       = useState(null);
  const [restante, setRest]   = useState(15);
  const [miResp, setMiResp]   = useState(null);
  const [rev, setRev]         = useState(null);
  const [fin, setFin]         = useState(null);
  const [reacts, setReacts]   = useState([]);
  const [oculta, setOculta]   = useState([]);
  const [pista, setPista]     = useState('');
  const [votos, setVotos]     = useState(null);
  const [usado, setUsado]     = useState({ fifty: false, hint: false, votes: false });

  // ── Conexión ──
  useEffect(() => {
    const s = io(API + '/arena', { auth: { token } });
    sockRef.current = s;
    s.on('connect',        () => { setConn('ok'); setMyId(s.id); });
    s.on('connect_error',  () => { setConn('fail'); setErr('No se pudo conectar a la Arena. Intenta de nuevo en unos segundos.'); });
    s.on('arena:players',  (ps) => setPlayers(ps));
    s.on('arena:starting', () => { setErr(''); setFase('starting'); });
    s.on('arena:question', (data) => {
      setPreg(data); setPlayers(data.players || []);
      setMiResp(null); setRev(null); setOculta([]); setPista(''); setVotos(null);
      setFase('question');
    });
    s.on('arena:answered', ({ id }) => {
      setPlayers(prev => prev.map(p => p.id === id ? { ...p, answered: true } : p));
    });
    s.on('arena:reveal',   (data) => { setRev(data); setFase('reveal'); });
    s.on('arena:end',      (data) => { setFin(data); setFase('end'); });
    s.on('arena:error',    (m) => setErr(m));
    s.on('arena:react',    (r) => {
      const rid = Math.random().toString(36).slice(2);
      setReacts(prev => [...prev.slice(-5), { ...r, rid }]);
      setTimeout(() => setReacts(prev => prev.filter(x => x.rid !== rid)), 3200);
    });
    return () => { try { s.emit('arena:leave'); s.disconnect(); } catch (e) {} };
  }, [token]);

  // ── Timer visual (el real está en el servidor) ──
  useEffect(() => {
    if (fase !== 'question' || !preg) return;
    const t = setInterval(() => {
      setRest(Math.max(0, (preg.endsAt - Date.now()) / 1000));
    }, 100);
    return () => clearInterval(t);
  }, [fase, preg]);

  const crear = () => {
    setErr('');
    sockRef.current.emit('arena:create', (r) => {
      if (r.ok) { setCode(r.code); setPlayers(r.players); setFase('lobby'); }
      else setErr(r.error || 'Error al crear la sala.');
    });
  };
  const unirse = () => {
    setErr('');
    if (!/^\d{4}$/.test(joinCode.trim())) { setErr('El código es de 4 dígitos.'); return; }
    sockRef.current.emit('arena:join', { code: joinCode.trim() }, (r) => {
      if (r.ok) { setCode(r.code); setPlayers(r.players); setFase('lobby'); }
      else setErr(r.error || 'No se pudo entrar.');
    });
  };
  const iniciar   = () => sockRef.current.emit('arena:start');
  const responder = (i) => {
    if (miResp !== null || restante <= 0) return;
    setMiResp(i);
    sockRef.current.emit('arena:answer', { opt: i }, () => {});
  };
  const usarFifty = () => sockRef.current.emit('arena:fifty', (r) => { if (r.ok) { setOculta(r.ocultar); setUsado(u => ({ ...u, fifty: true })); } });
  const usarPista = () => sockRef.current.emit('arena:hint',  (r) => { if (r.ok) { setPista(r.pista);   setUsado(u => ({ ...u, hint: true })); } });
  const usarVotos = () => sockRef.current.emit('arena:votes', (r) => { if (r.ok) { setVotos(r);          setUsado(u => ({ ...u, votes: true })); } });
  const reaccionar = (e) => sockRef.current.emit('arena:react', e);

  const soyHost   = players.find(p => p.id === myId)?.isHost;
  const maxScore  = Math.max(100, ...players.map(p => p.score));
  const pctTimer  = preg ? Math.max(0, Math.min(100, (restante / (preg.duration / 1000)) * 100)) : 0;
  const rojo      = restante < 5;

  const S = {
    page:  { minHeight: '100vh', background: '#0a0e1a', color: '#e2e8f0', fontFamily: "'Poppins',sans-serif", paddingBottom: '2rem' },
    wrap:  { maxWidth: 560, margin: '0 auto', padding: '0 14px' },
    card:  { background: 'rgba(15,23,42,.7)', border: '1px solid rgba(6,182,212,.2)', borderRadius: 16, padding: '1.2rem', boxShadow: '0 10px 30px rgba(0,0,0,.45)' },
    btn:   { border: 'none', borderRadius: 12, padding: '13px 22px', fontWeight: 700, fontSize: '.9rem', cursor: 'pointer', fontFamily: "'Poppins',sans-serif" },
    cyan:  { background: 'linear-gradient(135deg,#06b6d4,#0891b2)', color: '#fff' },
    indigo:{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' },
  };

  // ── Feed de reacciones flotante ──
  const feed = (
    <div style={{position:'fixed',bottom:86,left:0,right:0,display:'flex',flexDirection:'column',alignItems:'center',gap:6,pointerEvents:'none',zIndex:60}}>
      {reacts.map(r => (
        <div key={r.rid} style={{background:'rgba(15,23,42,.9)',border:'1px solid '+r.color,borderRadius:50,padding:'4px 14px',fontSize:'.8rem',animation:'arenaUp 3.2s ease forwards'}}>
          <span style={{color:r.color,fontWeight:700}}>{r.name}</span> <span style={{fontSize:'1.05rem'}}>{r.emoji}</span>
        </div>
      ))}
    </div>
  );

  const barraReacciones = (fase === 'question' || fase === 'reveal') && (
    <div style={{position:'fixed',bottom:18,left:0,right:0,display:'flex',justifyContent:'center',gap:8,zIndex:61}}>
      {REACCIONES.map(e => (
        <button key={e} onClick={() => reaccionar(e)}
          style={{background:'rgba(15,23,42,.85)',border:'1px solid rgba(6,182,212,.3)',borderRadius:'50%',width:44,height:44,fontSize:'1.15rem',cursor:'pointer'}}>
          {e}
        </button>
      ))}
    </div>
  );

  // ── Header común ──
  const header = (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 0',marginBottom:12}}>
      <button onClick={onBack} style={{background:'none',border:'1px solid rgba(148,163,184,.25)',color:'#94a3b8',borderRadius:10,padding:'7px 14px',cursor:'pointer',fontSize:'.78rem',fontFamily:"'Poppins',sans-serif"}}>← Salir</button>
      <div style={{fontWeight:800,fontSize:'1.05rem'}}>🏟️ <span style={{color:'#06b6d4'}}>AulaQuest</span> Arena</div>
      <span style={{fontSize:'.62rem',color: conn==='ok' ? '#10b981' : conn==='fail' ? '#ef4444' : '#f59e0b'}}>● {conn==='ok'?'en línea':conn==='fail'?'sin conexión':'conectando'}</span>
    </div>
  );

  const errBox = err && (
    <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.35)',borderRadius:10,padding:'9px 14px',margin:'10px 0',color:'#f87171',fontSize:'.78rem'}}>{err}</div>
  );

  // ═══ MENU ═══
  if (fase === 'menu') return (
    <div style={S.page}><div style={S.wrap}>
      <style>{'@keyframes arenaUp{0%{opacity:0;transform:translateY(14px)}12%{opacity:1;transform:translateY(0)}80%{opacity:1}100%{opacity:0;transform:translateY(-18px)}}'}</style>
      {header}{errBox}
      <div style={{textAlign:'center',margin:'1.4rem 0 1.8rem'}}>
        <div style={{fontSize:'3rem'}}>⚔️</div>
        <h2 style={{margin:'8px 0 4px',fontSize:'1.3rem'}}>Quiz multijugador en vivo</h2>
        <p style={{color:'#64748b',fontSize:'.8rem',margin:0}}>Compite con hasta 8 jugadores respondiendo preguntas de inglés A1. ¡El más rápido gana más puntos!</p>
      </div>
      <div style={{...S.card, marginBottom:14, textAlign:'center'}}>
        <div style={{fontSize:'1.6rem',marginBottom:6}}>🎪</div>
        <div style={{fontWeight:700,marginBottom:4}}>Crear una sala</div>
        <p style={{color:'#64748b',fontSize:'.74rem',margin:'0 0 12px'}}>Te damos un código de 4 dígitos para invitar a tus compañeros.</p>
        <button onClick={crear} disabled={conn!=='ok'} style={{...S.btn, ...S.cyan, width:'100%', opacity: conn==='ok'?1:.5}}>Crear sala</button>
      </div>
      <div style={{...S.card, textAlign:'center'}}>
        <div style={{fontSize:'1.6rem',marginBottom:6}}>🎟️</div>
        <div style={{fontWeight:700,marginBottom:4}}>Unirse con código</div>
        <p style={{color:'#64748b',fontSize:'.74rem',margin:'0 0 12px'}}>Escribe el código que te compartió el creador de la sala.</p>
        <input value={joinCode} onChange={e=>setJoin(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="0000" inputMode="numeric"
          style={{width:130,textAlign:'center',fontSize:'1.5rem',letterSpacing:'.4em',background:'#0a0e1a',border:'1px solid rgba(6,182,212,.35)',borderRadius:12,color:'#06b6d4',padding:'10px 0 10px .4em',fontWeight:800,outline:'none',marginBottom:12}}/>
        <button onClick={unirse} disabled={conn!=='ok'} style={{...S.btn, ...S.indigo, width:'100%', opacity: conn==='ok'?1:.5}}>Entrar a la sala</button>
      </div>
    </div></div>
  );

  // ═══ LOBBY ═══
  if (fase === 'lobby' || fase === 'starting') return (
    <div style={S.page}><div style={S.wrap}>
      {header}{errBox}
      <div style={{...S.card, textAlign:'center', marginBottom:14}}>
        <div style={{color:'#64748b',fontSize:'.72rem',marginBottom:4}}>CÓDIGO DE LA SALA</div>
        <div style={{fontSize:'2.6rem',fontWeight:800,letterSpacing:'.35em',color:'#06b6d4',paddingLeft:'.35em'}}>{code}</div>
        <div style={{color:'#64748b',fontSize:'.72rem'}}>Compártelo para que entren (máx. 8 jugadores)</div>
      </div>
      <div style={{...S.card, marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:'.85rem',marginBottom:10}}>Jugadores ({players.length}/8)</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {players.map(p => (
            <div key={p.id} style={{display:'flex',alignItems:'center',gap:10,background:'rgba(10,14,26,.6)',borderRadius:10,padding:'8px 12px'}}>
              <Avatar name={p.name} color={p.color}/>
              <span style={{fontWeight:600,fontSize:'.85rem',flex:1}}>{p.name}{p.id===myId && <span style={{color:'#64748b',fontWeight:400}}> (tú)</span>}</span>
              {p.isHost && <span title="Anfitrión">👑</span>}
            </div>
          ))}
        </div>
      </div>
      {fase === 'starting' ? (
        <div style={{textAlign:'center',color:'#06b6d4',fontWeight:800,fontSize:'1.1rem'}}>🚦 ¡La partida empieza en segundos!</div>
      ) : soyHost ? (
        <button onClick={iniciar} style={{...S.btn, ...S.cyan, width:'100%', fontSize:'1rem'}}>🚀 Iniciar partida</button>
      ) : (
        <div style={{textAlign:'center',color:'#64748b',fontSize:'.8rem'}}>Esperando a que el anfitrión inicie la partida…</div>
      )}
    </div></div>
  );

  // ═══ PREGUNTA ═══
  if (fase === 'question' && preg) return (
    <div style={S.page}><div style={S.wrap}>
      <style>{'@keyframes arenaUp{0%{opacity:0;transform:translateY(14px)}12%{opacity:1;transform:translateY(0)}80%{opacity:1}100%{opacity:0;transform:translateY(-18px)}}'}</style>
      {header}
      {/* Timer */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
        <span style={{fontSize:'.72rem',color:'#64748b',fontWeight:700,whiteSpace:'nowrap'}}>Pregunta {preg.idx+1}/{preg.total}</span>
        <div style={{flex:1,height:10,background:'rgba(148,163,184,.12)',borderRadius:20,overflow:'hidden'}}>
          <div style={{height:'100%',width:pctTimer+'%',background: rojo ? 'linear-gradient(90deg,#ef4444,#f97316)' : 'linear-gradient(90deg,#06b6d4,#6366f1)',borderRadius:20,transition:'width .1s linear'}}/>
        </div>
        <span style={{fontWeight:800,fontSize:'1.05rem',color: rojo ? '#ef4444' : '#06b6d4',minWidth:30,textAlign:'right'}}>{Math.ceil(restante)}</span>
      </div>

      {/* Pregunta */}
      <div style={{...S.card, textAlign:'center', marginBottom:14}}>
        {preg.icon && <div style={{fontSize:'3.4rem',lineHeight:1.2}}>{preg.icon}</div>}
        <div style={{fontWeight:700,fontSize:'1.02rem',marginTop:preg.icon?6:0}}>{preg.q}</div>
      </div>

      {/* Opciones */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
        {preg.opts.map((o, i) => {
          const escondida = oculta.includes(i);
          const elegida   = miResp === i;
          return (
            <button key={i} onClick={() => !escondida && responder(i)}
              disabled={escondida || miResp !== null || restante <= 0}
              style={{...S.btn, padding:'16px 10px',
                background: elegida ? OPT_COLORS[i] : 'rgba(15,23,42,.8)',
                color: elegida ? '#fff' : '#e2e8f0',
                border: '2px solid ' + (elegida ? OPT_COLORS[i] : OPT_COLORS[i]+'55'),
                opacity: escondida ? .15 : (miResp !== null && !elegida ? .45 : 1),
                cursor: escondida || miResp !== null ? 'default' : 'pointer',
                fontSize:'.88rem'}}>
              <span style={{color: elegida ? '#fff' : OPT_COLORS[i], fontWeight:800, marginRight:6}}>{LETRAS[i]}</span>{o}
            </button>
          );
        })}
      </div>

      {miResp !== null && <div style={{textAlign:'center',color:'#06b6d4',fontSize:'.78rem',marginBottom:10}}>✔️ Respuesta enviada — esperando a los demás…</div>}
      {pista && <div style={{background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.35)',borderRadius:10,padding:'8px 14px',fontSize:'.78rem',color:'#fbbf24',marginBottom:10}}>💡 {pista}</div>}
      {votos && (
        <div style={{...S.card, padding:'.8rem 1rem', marginBottom:10}}>
          <div style={{fontSize:'.7rem',color:'#64748b',marginBottom:6}}>👥 Votos de la sala ({votos.respuestas} respuestas)</div>
          {preg.opts.map((o,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <span style={{fontSize:'.68rem',fontWeight:700,color:OPT_COLORS[i],width:12}}>{LETRAS[i]}</span>
              <div style={{flex:1,height:6,background:'rgba(148,163,184,.1)',borderRadius:8,overflow:'hidden'}}>
                <div style={{height:'100%',width:votos.votes[i]+'%',background:OPT_COLORS[i],borderRadius:8}}/>
              </div>
              <span style={{fontSize:'.66rem',color:'#94a3b8',width:32,textAlign:'right'}}>{votos.votes[i]}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Comodines */}
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        {[
          { k:'fifty', label:'50/50', icon:'✂️', fn: usarFifty },
          { k:'hint',  label:'Pista',  icon:'💡', fn: usarPista },
          { k:'votes', label:'Grupo',  icon:'👥', fn: usarVotos },
        ].map(c => (
          <button key={c.k} onClick={c.fn} disabled={usado[c.k] || miResp !== null}
            style={{...S.btn, flex:1, padding:'9px 6px', fontSize:'.72rem',
              background:'rgba(15,23,42,.8)', color: usado[c.k] ? '#334155' : '#94a3b8',
              border:'1px solid ' + (usado[c.k] ? 'rgba(51,65,85,.5)' : 'rgba(6,182,212,.3)'),
              cursor: usado[c.k] || miResp !== null ? 'default' : 'pointer'}}>
            {c.icon} {c.label}{usado[c.k] ? ' ✓' : ''}
          </button>
        ))}
      </div>

      {/* Pista de carrera */}
      <div style={{...S.card, padding:'1rem'}}>
        <div style={{fontSize:'.7rem',color:'#64748b',fontWeight:700,marginBottom:8}}>🏁 CARRERA</div>
        {players.map(p => (
          <div key={p.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            <Avatar name={p.name} color={p.color} size={26}/>
            <div style={{flex:1,height:12,background:'rgba(148,163,184,.08)',borderRadius:10,overflow:'hidden'}}>
              <div style={{height:'100%',width:Math.max(3,(p.score/maxScore)*100)+'%',background:'linear-gradient(90deg,'+p.color+'88,'+p.color+')',borderRadius:10,transition:'width .6s ease'}}/>
            </div>
            <span style={{fontSize:'.68rem',fontWeight:700,color:'#94a3b8',minWidth:42,textAlign:'right'}}>{p.score}{p.answered ? ' ✓' : ''}</span>
          </div>
        ))}
      </div>
      {feed}{barraReacciones}
    </div></div>
  );

  // ═══ REVEAL — Centro de aprendizaje ═══
  if (fase === 'reveal' && rev && preg) {
    const mio = rev.resultados.find(r => r.id === myId);
    return (
      <div style={S.page}><div style={S.wrap}>
        <style>{'@keyframes arenaUp{0%{opacity:0;transform:translateY(14px)}12%{opacity:1;transform:translateY(0)}80%{opacity:1}100%{opacity:0;transform:translateY(-18px)}}'}</style>
        {header}
        <div style={{textAlign:'center',marginBottom:12}}>
          {mio && mio.correcto
            ? <div style={{fontSize:'1.25rem',fontWeight:800,color:'#10b981'}}>✅ ¡Correcto! +{mio.delta} pts{mio.streak >= 3 && <span style={{color:'#f59e0b'}}> 🔥 racha x2</span>}</div>
            : <div style={{fontSize:'1.25rem',fontWeight:800,color:'#f87171'}}>{mio && mio.eligio !== null ? '❌ Incorrecto' : '⏱️ Sin respuesta'}</div>}
        </div>

        {/* Opciones con la correcta */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
          {preg.opts.map((o, i) => {
            const esAns = i === rev.ans;
            const mia   = mio && mio.eligio === i;
            return (
              <div key={i} style={{borderRadius:12,padding:'10px 8px',fontSize:'.8rem',fontWeight:600,textAlign:'center',
                background: esAns ? 'rgba(16,185,129,.16)' : mia ? 'rgba(239,68,68,.12)' : 'rgba(15,23,42,.6)',
                border:'2px solid ' + (esAns ? '#10b981' : mia ? '#ef4444' : 'rgba(51,65,85,.4)'),
                color: esAns ? '#6ee7b7' : mia ? '#fca5a5' : '#64748b'}}>
                {esAns ? '✅ ' : ''}{o}<div style={{fontSize:'.62rem',fontWeight:400,marginTop:2,color:'#475569'}}>{rev.votes[i]}% votó esto</div>
              </div>
            );
          })}
        </div>

        {/* Centro de aprendizaje */}
        {rev.learn && rev.learn.word && (
          <div style={{background:'linear-gradient(135deg,rgba(6,182,212,.12),rgba(99,102,241,.08))',border:'1px solid rgba(6,182,212,.35)',borderRadius:16,padding:'1.1rem 1.3rem',marginBottom:14}}>
            <div style={{fontSize:'.66rem',fontWeight:800,color:'#06b6d4',letterSpacing:'.08em',marginBottom:6}}>📚 CENTRO DE APRENDIZAJE</div>
            <div style={{display:'flex',alignItems:'baseline',gap:10,flexWrap:'wrap'}}>
              <span style={{fontSize:'1.5rem',fontWeight:800,color:'#e2e8f0'}}>{rev.learn.word}</span>
              <span style={{color:'#06b6d4',fontSize:'.85rem',fontWeight:600}}>/{rev.learn.pron}/</span>
              <span style={{color:'#94a3b8',fontSize:'.85rem'}}>= {rev.learn.meaning}</span>
            </div>
            {rev.learn.example && <div style={{marginTop:8,color:'#cbd5e1',fontSize:'.82rem',fontStyle:'italic'}}>“{rev.learn.example}”</div>}
          </div>
        )}

        {/* Mini ranking */}
        <div style={{...S.card, padding:'1rem'}}>
          <div style={{fontSize:'.7rem',color:'#64748b',fontWeight:700,marginBottom:8}}>PUNTAJES</div>
          {rev.resultados.map((r, i) => (
            <div key={r.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <span style={{fontSize:'.72rem',color:'#64748b',width:16}}>{i+1}.</span>
              <Avatar name={r.name} color={r.color} size={26}/>
              <span style={{flex:1,fontSize:'.8rem',fontWeight:600}}>{r.name}</span>
              {r.delta > 0 && <span style={{color:'#10b981',fontSize:'.72rem',fontWeight:700}}>+{r.delta}</span>}
              <span style={{fontWeight:800,fontSize:'.85rem',color:'#06b6d4'}}>{r.score}</span>
            </div>
          ))}
        </div>
        <div style={{textAlign:'center',color:'#475569',fontSize:'.72rem',marginTop:10}}>{rev.esUltima ? 'Resultados finales en unos segundos…' : 'Siguiente pregunta en unos segundos…'}</div>
        {feed}{barraReacciones}
      </div></div>
    );
  }

  // ═══ FIN — podio + palabras + leaderboard ═══
  if (fase === 'end' && fin) {
    const [p1, p2, p3] = fin.podium;
    const podioCol = (p, lugar, alto, emoji) => p ? (
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
        <div style={{fontSize:'1.5rem'}}>{emoji}</div>
        <Avatar name={p.name} color={p.color} size={46}/>
        <div style={{fontSize:'.75rem',fontWeight:700,textAlign:'center'}}>{p.name}</div>
        <div style={{width:'100%',height:alto,background:'linear-gradient(180deg,'+p.color+'66,'+p.color+'22)',border:'1px solid '+p.color,borderRadius:'10px 10px 0 0',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:p.color}}>{p.score}</div>
      </div>
    ) : <div style={{flex:1}}/>;

    return (
      <div style={S.page}><div style={S.wrap}>
        {header}
        <div style={{textAlign:'center',margin:'0 0 14px'}}>
          <div style={{fontSize:'2rem'}}>🏆</div>
          <h2 style={{margin:'4px 0',fontSize:'1.2rem'}}>¡Partida terminada!</h2>
          {p1 && <p style={{color:'#f59e0b',fontWeight:700,fontSize:'.85rem',margin:0}}>Ganador: {p1.name} 🎉</p>}
        </div>

        {/* Podio */}
        <div style={{display:'flex',alignItems:'flex-end',gap:8,marginBottom:16,padding:'0 10px'}}>
          {podioCol(p2, 2, 62, '🥈')}
          {podioCol(p1, 1, 92, '🥇')}
          {podioCol(p3, 3, 44, '🥉')}
        </div>

        {/* Ranking completo si hay más de 3 */}
        {fin.podium.length > 3 && (
          <div style={{...S.card, padding:'1rem', marginBottom:14}}>
            {fin.podium.slice(3).map((p, i) => (
              <div key={p.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <span style={{fontSize:'.72rem',color:'#64748b',width:16}}>{i+4}.</span>
                <Avatar name={p.name} color={p.color} size={24}/>
                <span style={{flex:1,fontSize:'.78rem'}}>{p.name}</span>
                <span style={{fontWeight:700,fontSize:'.8rem',color:'#06b6d4'}}>{p.score}</span>
              </div>
            ))}
          </div>
        )}

        {/* Palabras aprendidas */}
        {fin.words && fin.words.length > 0 && (
          <div style={{...S.card, marginBottom:14}}>
            <div style={{fontSize:'.7rem',color:'#06b6d4',fontWeight:800,letterSpacing:'.08em',marginBottom:10}}>📚 PALABRAS DE HOY</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {fin.words.map((w, i) => (
                <div key={i} style={{background:'rgba(10,14,26,.6)',border:'1px solid rgba(6,182,212,.18)',borderRadius:10,padding:'8px 10px'}}>
                  <div style={{fontWeight:700,fontSize:'.82rem'}}>{w.word}</div>
                  <div style={{color:'#06b6d4',fontSize:'.66rem'}}>/{w.pron}/</div>
                  <div style={{color:'#94a3b8',fontSize:'.7rem'}}>{w.meaning}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard global */}
        {fin.leaderboard && fin.leaderboard.length > 0 && (
          <div style={{...S.card, marginBottom:16}}>
            <div style={{fontSize:'.7rem',color:'#f59e0b',fontWeight:800,letterSpacing:'.08em',marginBottom:10}}>🌎 MEJORES DE TODOS LOS TIEMPOS</div>
            {fin.leaderboard.map((r, i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                <span style={{fontSize:'.72rem',color: i===0?'#f59e0b':'#64748b',width:18,fontWeight:700}}>{i+1}.</span>
                <span style={{flex:1,fontSize:'.78rem',fontWeight:600}}>{r.name}</span>
                <span style={{fontWeight:700,fontSize:'.8rem',color:'#f59e0b'}}>{r.score}</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={onBack} style={{...S.btn, ...S.cyan, width:'100%'}}>Volver al aula</button>
      </div></div>
    );
  }

  // Fallback (conectando)
  return (
    <div style={S.page}><div style={S.wrap}>
      {header}{errBox}
      <div style={{textAlign:'center',color:'#64748b',marginTop:'3rem'}}>Cargando Arena…</div>
    </div></div>
  );
}
