import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const API = import.meta.env.VITE_API_URL || 'https://nexlum-aulaquest.onrender.com';

// ─── AulaQuest Royale — English Battle Royale (B2, componente aislado) ───
// Todo el estado autoritativo viene del server. TTS de listening: navegador.
function speak(text) {
  try { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.92; window.speechSynthesis.speak(u); } catch (e) {}
}
function Sub({ children, style }) { return <div style={{ color: '#64748b', fontSize: '.72rem', marginTop: 2, ...style }}>{children}</div>; }

export default function RoyaleGame({ token, onBack }) {
  const sockRef = useRef(null);
  const [conn, setConn] = useState('...');
  const [ui, setUi]     = useState('menu');   // menu | lobby | play | victory
  const [err, setErr]   = useState('');
  const [code, setCode] = useState('');
  const [joinCode, setJoin] = useState('');
  const [players, setPlayers] = useState([]);
  const [myId, setMyId] = useState('');
  const [st, setSt]     = useState(null);     // royale:state
  const [rest, setRest] = useState(0);
  const [feed, setFeed] = useState([]);
  const [ch, setCh]     = useState(null);     // reto activo
  const [chShown, setChShown] = useState(0);
  const [chWrong, setChWrong] = useState(null);
  const [toast, setToast] = useState(null);
  const [finalInfo, setFinalInfo] = useState(null);
  const [victory, setVictory] = useState(null);
  const [status, setStatus] = useState('alive'); // alive | down | out

  const authH = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
  const toastFor = (icon, text, ms) => { setToast({ icon, text }); setTimeout(() => setToast(null), ms || 2600); };

  useEffect(() => {
    const s = io(API + '/royale', { auth: { token } });
    sockRef.current = s;
    s.on('connect', () => { setConn('ok'); setMyId(s.id); });
    s.on('connect_error', () => { setConn('fail'); setErr('No connection. / Sin conexión.'); });
    s.on('royale:players', setPlayers);
    s.on('royale:err', setErr);
    s.on('royale:begin', () => { setUi('play'); setStatus('alive'); setVictory(null); setFinalInfo(null); });
    s.on('royale:state', setSt);
    s.on('royale:feed', (f) => setFeed(prev => [...prev.slice(-9), f]));
    s.on('royale:challenge', (c) => { setCh(c); setChShown(Date.now()); setChWrong(null); if (c.tipo === 'listening' && c.say) setTimeout(() => speak(c.say), 250); });
    s.on('royale:duel-result', (r) => { setCh(null); toastFor(r.win ? '⚔️' : r.draw ? '🤝' : '💥', r.win ? 'You won the duel vs ' + r.opponent + '!' : r.draw ? 'Duel draw' : 'You lost the duel'); });
    s.on('royale:down', () => { setStatus('down'); setCh(null); toastFor('🩸', 'You are down! A teammate can revive you.', 4000); });
    s.on('royale:revived', () => { setStatus('alive'); toastFor('💚', 'You were revived!'); });
    s.on('royale:eliminated', () => { setStatus('out'); setCh(null); toastFor('💀', 'You were eliminated — watch your squad!', 4000); });
    s.on('royale:final', (d) => { setFinalInfo(d); setStatus('alive'); toastFor('⚡', 'FINAL CIRCLE! Lightning round!', 3500); });
    s.on('royale:victory', (d) => { setVictory(d); setUi('victory'); });
    return () => { try { s.emit('royale:leave'); s.disconnect(); } catch (e) {} window.speechSynthesis && window.speechSynthesis.cancel(); };
  }, [token]);

  // timer visual de la tormenta / final
  useEffect(() => {
    const end = st && st.stormEndsAt;
    if (!end) return;
    const t = setInterval(() => setRest(Math.max(0, Math.round((end - Date.now()) / 1000))), 300);
    return () => clearInterval(t);
  }, [st && st.stormEndsAt]);

  const yo = st ? (st.squads.flatMap(s => s.miembros).find(m => m.id === myId)) : null;
  const miSquad = st && yo ? st.squads.find(s => s.miembros.some(m => m.id === myId)) : null;
  const soyHost = (players.find(p => p.id === myId) || {}).isHost;

  const S = {
    page: { minHeight: '100vh', background: '#0a0e1a', color: '#e2e8f0', fontFamily: "'Poppins',sans-serif", paddingBottom: '2rem' },
    wrap: { maxWidth: 560, margin: '0 auto', padding: '0 14px' },
    card: { background: 'rgba(15,23,42,.7)', border: '1px solid rgba(6,182,212,.2)', borderRadius: 16, padding: '1.1rem', boxShadow: '0 10px 30px rgba(0,0,0,.45)' },
    btn:  { border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer', fontFamily: "'Poppins',sans-serif" },
    cyan: { background: 'linear-gradient(135deg,#06b6d4,#0891b2)', color: '#fff' },
    ghost:{ background: 'rgba(15,23,42,.8)', color: '#94a3b8', border: '1px solid rgba(6,182,212,.25)' },
  };
  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', marginBottom: 10 }}>
      <button onClick={() => { window.speechSynthesis && window.speechSynthesis.cancel(); onBack(); }} style={{ ...S.btn, ...S.ghost, padding: '7px 14px', fontSize: '.76rem' }}>← Exit</button>
      <div style={{ fontWeight: 800, fontSize: '1rem' }}>🪂 <span style={{ color: '#06b6d4' }}>AulaQuest</span> Royale</div>
      <span style={{ fontSize: '.62rem', color: conn === 'ok' ? '#10b981' : conn === 'fail' ? '#ef4444' : '#f59e0b' }}>● {conn === 'ok' ? 'online' : conn === 'fail' ? 'offline' : '...'}</span>
    </div>
  );
  const errBox = err && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.35)', borderRadius: 10, padding: '9px 14px', margin: '8px 0', color: '#f87171', fontSize: '.78rem' }}>{err}</div>;
  const toastBox = toast && (
    <div style={{ position: 'fixed', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 95, maxWidth: '92vw', textAlign: 'center', background: 'rgba(15,23,42,.96)', border: '1px solid rgba(6,182,212,.5)', borderRadius: 12, padding: '9px 16px', fontSize: '.78rem', boxShadow: '0 8px 30px rgba(0,0,0,.5)' }}>{toast.icon} {toast.text}</div>
  );

  // ═══ MENU ═══
  if (ui === 'menu') return (
    <div style={S.page}><div style={S.wrap}>
      {header}{errBox}
      <div style={{ textAlign: 'center', margin: '1rem 0 1.4rem' }}>
        <div style={{ fontSize: '3rem' }}>🏝️</div>
        <h2 style={{ margin: '8px 0 2px', fontSize: '1.3rem' }}>English Battle Royale</h2>
        <Sub>Sobrevive la tormenta resolviendo retos B2: phrasal verbs, idioms, parafraseo y listening</Sub>
      </div>
      <div style={{ ...S.card, marginBottom: 12, textAlign: 'center' }}>
        <div style={{ fontWeight: 700 }}>🎪 Create a match</div><Sub style={{ marginBottom: 10 }}>2-50 jugadores en escuadras</Sub>
        <button onClick={() => act('create')} disabled={conn !== 'ok'} style={{ ...S.btn, ...S.cyan, width: '100%', opacity: conn === 'ok' ? 1 : .5 }}>Create match</button>
      </div>
      <div style={{ ...S.card, marginBottom: 12, textAlign: 'center' }}>
        <div style={{ fontWeight: 700 }}>🎟️ Join with a code</div><Sub style={{ marginBottom: 8 }}>Únete con el código de la partida</Sub>
        <input value={joinCode} onChange={e => setJoin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0000" inputMode="numeric"
          style={{ width: 120, textAlign: 'center', fontSize: '1.4rem', letterSpacing: '.4em', background: '#0a0e1a', border: '1px solid rgba(6,182,212,.35)', borderRadius: 12, color: '#06b6d4', padding: '9px 0 9px .4em', fontWeight: 800, outline: 'none', marginBottom: 10 }} />
        <button onClick={() => act('join')} disabled={conn !== 'ok'} style={{ ...S.btn, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', width: '100%', opacity: conn === 'ok' ? 1 : .5 }}>Join match</button>
      </div>
      <div style={{ ...S.card, textAlign: 'center' }}>
        <div style={{ fontWeight: 700 }}>🤖 Play solo</div><Sub style={{ marginBottom: 10 }}>Con bots que usan el banco de retos</Sub>
        <button onClick={() => act('solo')} disabled={conn !== 'ok'} style={{ ...S.btn, ...S.ghost, width: '100%', opacity: conn === 'ok' ? 1 : .5 }}>Drop solo</button>
      </div>
    </div></div>
  );

  function act(kind) {
    setErr('');
    if (kind === 'join') {
      if (!/^\d{4}$/.test(joinCode.trim())) { setErr('The code has 4 digits. / El código es de 4 dígitos.'); return; }
      sockRef.current.emit('royale:join', { code: joinCode.trim() }, (r) => { if (r.ok) { setCode(r.code); setPlayers(r.players); setUi('lobby'); } else setErr(r.error || 'Error'); });
    } else {
      sockRef.current.emit(kind === 'solo' ? 'royale:solo' : 'royale:create', (r) => { if (r.ok) { setCode(r.code); setPlayers(r.players); setUi('lobby'); } else setErr(r.error || 'Error'); });
    }
  }

  // ═══ LOBBY ═══
  if (ui === 'lobby') return (
    <div style={S.page}><div style={S.wrap}>
      {header}{errBox}
      <div style={{ ...S.card, textAlign: 'center', marginBottom: 12 }}>
        <div style={{ color: '#64748b', fontSize: '.72rem' }}>MATCH CODE <span style={{ color: '#334155' }}>/ código</span></div>
        <div style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '.35em', color: '#06b6d4', paddingLeft: '.35em' }}>{code}</div>
        <Sub>Squads are formed automatically · bots fill empty spots</Sub>
      </div>
      <div style={{ ...S.card, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: '.85rem', marginBottom: 10 }}>Players ({players.length})</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {players.map(p => (
            <div key={p.id} style={{ background: 'rgba(10,14,26,.6)', borderRadius: 50, padding: '5px 14px', fontSize: '.74rem', fontWeight: 600 }}>{p.name}{p.isHost ? ' 👑' : ''}</div>
          ))}
        </div>
      </div>
      {soyHost
        ? <button onClick={() => sockRef.current.emit('royale:start')} style={{ ...S.btn, ...S.cyan, width: '100%', fontSize: '1rem' }}>🪂 Drop into the island</button>
        : <div style={{ textAlign: 'center', color: '#64748b', fontSize: '.8rem' }}>Waiting for the host… <Sub>Esperando al anfitrión…</Sub></div>}
    </div></div>
  );

  // ═══ VICTORY ═══
  if (ui === 'victory' && victory) return (
    <div style={S.page}><div style={S.wrap}>
      {header}
      <div style={{ ...S.card, textAlign: 'center', marginBottom: 12, border: '1px solid rgba(245,158,11,.5)' }}>
        <div style={{ fontSize: '2.6rem' }}>👑</div>
        <div style={{ fontSize: '.72rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '.1em' }}>VICTORY ROYALE</div>
        <h2 style={{ margin: '4px 0', fontSize: '1.3rem' }}>Squad {victory.ganador} wins!</h2>
        {victory.mvp && <Sub>🏅 MVP: {victory.mvp.name} · {victory.mvp.puntos} pts</Sub>}
      </div>
      <div style={{ ...S.card, marginBottom: 12 }}>
        <div style={{ fontSize: '.7rem', fontWeight: 800, color: '#06b6d4', marginBottom: 8 }}>🏆 SQUADS</div>
        {victory.standings.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7, background: 'rgba(10,14,26,.6)', borderRadius: 10, padding: '9px 12px' }}>
            <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.'}</span>
            <span style={{ flex: 1, fontWeight: 700, fontSize: '.82rem' }}>{s.nombre}{s.win ? ' 👑' : ''}</span>
            <span style={{ fontSize: '.66rem', color: '#64748b' }}>{s.duelsWon} duels</span>
          </div>
        ))}
      </div>
      <button onClick={() => { setUi('menu'); setSt(null); setFeed([]); }} style={{ ...S.btn, ...S.cyan, width: '100%' }}>Play again</button>
    </div></div>
  );

  // ═══ PLAY (HUD) ═══
  if (ui === 'play' && st) {
    const safe = st.safe || [];
    const zonaCount = (zid) => st.squads.flatMap(s => s.miembros).filter(m => m.alive && m.zone === zid).length;
    const dur = finalInfo ? 90 : 60;
    const pctTimer = Math.max(0, Math.min(100, (rest / dur) * 100));
    const teammatesDown = miSquad ? miSquad.miembros.filter(m => m.down && m.alive && yo && m.zone === yo.zone && m.id !== myId) : [];

    return (
      <div style={S.page}><div style={S.wrap}>
        {toastBox}
        {header}

        {/* Barra superior: vivos + tormenta */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <div style={{ ...S.card, flex: 1, padding: '8px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '.82rem', fontWeight: 800 }}>👥 {st.alivePlayers}</div><div style={{ fontSize: '.58rem', color: '#475569' }}>alive · {st.aliveSquads} squads</div>
          </div>
          <div style={{ ...S.card, flex: 2, padding: '8px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.62rem', color: '#94a3b8', marginBottom: 3 }}>
              <span>{finalInfo ? '⚡ FINAL' : '⛈️ Storm ' + (st.stormPhase + 1)}</span><span style={{ color: rest < 15 ? '#ef4444' : '#06b6d4', fontWeight: 800 }}>{Math.floor(rest / 60)}:{String(rest % 60).padStart(2, '0')}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(148,163,184,.12)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: pctTimer + '%', background: rest < 15 ? '#ef4444' : 'linear-gradient(90deg,#06b6d4,#6366f1)', borderRadius: 20, transition: 'width .3s' }} />
            </div>
          </div>
        </div>

        {/* Tu estado */}
        {yo && (
          <div style={{ ...S.card, padding: '10px 14px', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: '.8rem' }}>Squad {miSquad ? miSquad.nombre : ''} {finalInfo && miSquad ? '· ⚡ ' + (miSquad.finalPoints || 0) + '/' + finalInfo.meta : ''}</span>
              <span style={{ fontSize: '.7rem', color: status === 'out' ? '#ef4444' : status === 'down' ? '#f59e0b' : '#10b981', fontWeight: 700 }}>{status === 'out' ? '💀 eliminated' : status === 'down' ? '🩸 knocked' : '🟢 alive'}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: '.7rem', width: 16 }}>❤️</span>
              <div style={{ flex: 1, height: 10, background: 'rgba(148,163,184,.12)', borderRadius: 20, overflow: 'hidden' }}><div style={{ height: '100%', width: yo.hp + '%', background: 'linear-gradient(90deg,#ef4444,#22c55e)', borderRadius: 20, transition: 'width .3s' }} /></div>
              <span style={{ fontSize: '.66rem', width: 28, textAlign: 'right' }}>{yo.hp}</span>
            </div>
            {yo.shield > 0 && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontSize: '.7rem', width: 16 }}>🛡️</span>
                <div style={{ flex: 1, height: 6, background: 'rgba(148,163,184,.12)', borderRadius: 20, overflow: 'hidden' }}><div style={{ height: '100%', width: (yo.shield / 50 * 100) + '%', background: '#06b6d4', borderRadius: 20 }} /></div>
                <span style={{ fontSize: '.62rem', width: 28, textAlign: 'right' }}>{yo.shield}</span>
              </div>
            )}
          </div>
        )}

        {/* Mapa de la isla */}
        {status !== 'out' && !finalInfo && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: '.66rem', color: '#64748b', fontWeight: 700, marginBottom: 6 }}>🗺️ ISLAND — tap a safe zone to move <Sub>toca una zona segura para moverte</Sub></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {st.zones.map(z => {
                const isSafe = safe.includes(z.id);
                const here = yo && yo.zone === z.id;
                return (
                  <div key={z.id} onClick={() => { if (isSafe && !here && status === 'alive' && !ch) sockRef.current.emit('royale:move', { zone: z.id }); }}
                    style={{ borderRadius: 12, padding: '10px 6px', textAlign: 'center', cursor: isSafe && !here ? 'pointer' : 'default',
                      background: here ? 'rgba(6,182,212,.18)' : isSafe ? 'rgba(15,23,42,.7)' : 'rgba(239,68,68,.12)',
                      border: '2px solid ' + (here ? '#06b6d4' : isSafe ? 'rgba(51,65,85,.5)' : 'rgba(239,68,68,.4)') }}>
                    <div style={{ fontSize: '1.5rem', filter: isSafe ? 'none' : 'grayscale(.5)' }}>{z.icono}</div>
                    <div style={{ fontSize: '.64rem', fontWeight: 700 }}>{z.nombre}</div>
                    <div style={{ fontSize: '.56rem', color: isSafe ? '#64748b' : '#ef4444' }}>{isSafe ? '👤 ' + zonaCount(z.id) : '⛈️ storm'}{here ? ' · you' : ''}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Acciones */}
        {status === 'alive' && !ch && !finalInfo && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button onClick={() => sockRef.current.emit('royale:chest', () => {})} style={{ ...S.btn, ...S.cyan, flex: 1 }}>🎁 Open a chest</button>
            {teammatesDown.map(m => (
              <button key={m.id} onClick={() => sockRef.current.emit('royale:revive', { targetId: m.id }, () => {})} style={{ ...S.btn, background: 'rgba(16,185,129,.15)', color: '#34d399', border: '1px solid rgba(16,185,129,.4)', flex: 1 }}>💚 Revive {m.name.split(' ')[0]}</button>
            ))}
          </div>
        )}
        {status === 'alive' && finalInfo && !ch && <div style={{ textAlign: 'center', color: '#f59e0b', fontWeight: 700, fontSize: '.82rem', marginBottom: 10 }}>⚡ Answer fast! Next question coming…</div>}
        {status === 'down' && <div style={{ ...S.card, textAlign: 'center', color: '#f59e0b', marginBottom: 10 }}>🩸 You are knocked down. A teammate in your zone can revive you. <Sub>Un compañero en tu zona puede revivirte.</Sub></div>}
        {status === 'out' && !victory && <div style={{ ...S.card, textAlign: 'center', color: '#94a3b8', marginBottom: 10 }}>💀 Eliminated — cheer for your squad! <Sub>Eliminado, pero tu escuadra sigue.</Sub></div>}

        {/* Escuadra */}
        {miSquad && (
          <div style={{ ...S.card, padding: '10px 14px', marginBottom: 10 }}>
            <div style={{ fontSize: '.66rem', color: '#06b6d4', fontWeight: 800, marginBottom: 6 }}>👥 YOUR SQUAD</div>
            {miSquad.miembros.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '.72rem', flex: 1 }}>{m.name}{m.id === myId ? ' (you)' : ''}</span>
                <span style={{ fontSize: '.62rem', color: !m.alive ? '#ef4444' : m.down ? '#f59e0b' : '#10b981' }}>{!m.alive ? 'out' : m.down ? 'down' : m.hp + '❤'}</span>
                <span style={{ fontSize: '.6rem', color: '#475569' }}>{st.zones.find(z => z.id === m.zone)?.icono}</span>
              </div>
            ))}
          </div>
        )}

        {/* Feed de la isla */}
        <div style={{ ...S.card, padding: '10px 14px' }}>
          <div style={{ fontSize: '.64rem', color: '#64748b', fontWeight: 700, marginBottom: 6 }}>📡 ISLAND FEED</div>
          {feed.length === 0 && <Sub>…</Sub>}
          {[...feed].slice(-8).reverse().map((f, i) => (
            <div key={i} style={{ fontSize: '.68rem', color: '#94a3b8', marginBottom: 3 }}>{f.icon} {f.texto}</div>
          ))}
        </div>

        {/* Modal de reto (cofre / duelo / revivir / final) */}
        {ch && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,.86)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
            <div style={{ ...S.card, width: 'min(520px,100%)', border: '1px solid ' + (ch.ctx === 'duel' ? 'rgba(239,68,68,.5)' : ch.ctx === 'revive' ? 'rgba(16,185,129,.5)' : ch.ctx === 'final' ? 'rgba(245,158,11,.5)' : 'rgba(6,182,212,.5)') }}>
              <div style={{ fontSize: '.66rem', fontWeight: 800, letterSpacing: '.06em', marginBottom: 6, color: ch.ctx === 'duel' ? '#f87171' : ch.ctx === 'revive' ? '#34d399' : ch.ctx === 'final' ? '#fbbf24' : '#06b6d4' }}>
                {ch.ctx === 'duel' ? '⚔️ DUEL vs ' + (ch.opponent || '') + ' — fastest correct wins!'
                  : ch.ctx === 'revive' ? '💚 REVIVE ' + (ch.targetName || '') + ' — listen & answer'
                  : ch.ctx === 'final' ? '⚡ FINAL — score for your squad!'
                  : '🎁 LOOT CHEST — ' + ch.tipo}
              </div>
              {ch.tipo === 'listening'
                ? <div style={{ textAlign: 'center', margin: '8px 0 12px' }}><button onClick={() => speak(ch.say)} style={{ ...S.btn, ...S.cyan, padding: '12px 26px' }}>🔊 Listen again</button><Sub>Toca para repetir</Sub></div>
                : <div style={{ fontWeight: 700, fontSize: '.92rem', margin: '4px 0 3px' }}>{ch.q}</div>}
              {ch.tipo !== 'listening' && <Sub style={{ marginBottom: 8 }}>{ch.qEs}</Sub>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ch.opts.map((o, i) => (
                  <button key={i} onClick={() => {
                    const ms = Date.now() - chShown;
                    sockRef.current.emit('royale:answer', { ctx: ch.ctx, token: ch.token, opt: i, ms }, (r) => {
                      if (!r || !r.ok) return;
                      if (ch.ctx === 'duel') { setCh(c => c ? { ...c, waiting: true } : c); return; }
                      if (ch.ctx === 'final') { if (r.correct) { toastFor('⚡', '+1 point!'); } else setChWrong(r.feedback); return; }
                      // chest / revive
                      setCh(null);
                      if (r.correct) toastFor(ch.ctx === 'revive' ? '💚' : '🎁', ch.ctx === 'revive' ? 'Revived!' : (r.loot ? 'Loot secured!' : 'Correct!'));
                      else if (r.feedback) toastFor('💡', r.feedback.en, 4200);
                    });
                  }} disabled={ch.waiting}
                    style={{ ...S.btn, textAlign: 'left', background: 'rgba(15,23,42,.85)', color: '#e2e8f0', border: '1px solid rgba(6,182,212,.28)', fontSize: '.82rem', fontWeight: 600, opacity: ch.waiting ? .5 : 1 }}>{o}</button>
                ))}
              </div>
              {ch.waiting && <div style={{ textAlign: 'center', color: '#64748b', fontSize: '.74rem', marginTop: 10 }}>Waiting for your opponent… <Sub>Esperando al rival…</Sub></div>}
              {chWrong && (
                <div style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.4)', borderRadius: 10, padding: '9px 12px', marginTop: 10 }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 800, color: '#fbbf24' }}>💡 {ch.ctx === 'final' ? 'Keep going!' : 'Try again!'}</div>
                  <div style={{ fontSize: '.76rem', fontWeight: 600 }}>{chWrong.en}</div><Sub>{chWrong.es}</Sub>
                </div>
              )}
            </div>
          </div>
        )}
      </div></div>
    );
  }

  return <div style={S.page}><div style={S.wrap}>{header}{errBox}<div style={{ textAlign: 'center', color: '#64748b', marginTop: '3rem' }}>Loading…</div></div></div>;
}
