import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const API = import.meta.env.VITE_API_URL || 'https://nexlum-aulaquest.onrender.com';

// ─── AulaQuest Grimoire — C1 Wizard Duels (componente aislado) ───
// Tema arcano morado/cyan. Server autoritativo. TTS de listening: navegador.
const SCHOOL = {
  fire:      { icon: '🔥', color: '#f97316', name: 'Collocations' },
  ice:       { icon: '❄️', color: '#38bdf8', name: 'Nuance' },
  lightning: { icon: '⚡', color: '#a78bfa', name: 'Structures' },
  nature:    { icon: '🌿', color: '#34d399', name: 'Register' },
  shield:    { icon: '🛡️', color: '#22d3ee', name: 'Accents' },
  legendary: { icon: '⭐', color: '#fbbf24', name: 'Legendary' },
};
const EMOTES = ['Well played!', 'Nice block!', 'Ouch!', 'GG'];

function speak(text, accent) {
  try { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = accent || 'en-GB'; u.rate = 0.95; window.speechSynthesis.speak(u); } catch (e) {}
}
function Sub({ children, style }) { return <div style={{ color: '#7c6aa8', fontSize: '.72rem', marginTop: 2, ...style }}>{children}</div>; }

function Card({ c, onClick, dim, small }) {
  const s = SCHOOL[c.school] || SCHOOL.fire;
  return (
    <div onClick={onClick} style={{
      background: 'linear-gradient(160deg,rgba(30,20,55,.95),rgba(15,12,30,.95))', border: '1px solid ' + s.color + '66',
      borderRadius: 12, padding: small ? '7px 6px' : '9px 8px', textAlign: 'center', cursor: onClick ? 'pointer' : 'default',
      opacity: dim ? 0.4 : 1, boxShadow: c.rareza === 'legendary' ? '0 0 14px ' + s.color + '55' : 'none', position: 'relative', minWidth: 0,
    }}>
      <div style={{ fontSize: small ? '1.2rem' : '1.5rem' }}>{s.icon}</div>
      <div style={{ fontSize: small ? '.6rem' : '.66rem', fontWeight: 700, color: '#e9e2ff', lineHeight: 1.15, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nombre}</div>
      <div style={{ fontSize: '.58rem', color: c.tipo === 'heal' ? '#34d399' : s.color, fontWeight: 700 }}>{c.tipo === 'heal' ? '+' + c.valor : c.valor} {c.tipo === 'heal' ? 'HP' : 'dmg'}</div>
    </div>
  );
}

export default function GrimoireGame({ token, onBack }) {
  const sockRef = useRef(null);
  const [conn, setConn] = useState('...');
  const [ui, setUi] = useState('menu');       // menu | queue | deck | duel | victory
  const [err, setErr] = useState('');
  const [code, setCode] = useState('');
  const [joinCode, setJoin] = useState('');
  const [myId, setMyId] = useState('');
  const [deck, setDeck] = useState([]);        // mi mazo (8 cartas)
  const [oppName, setOppName] = useState('');
  const [st, setSt] = useState(null);
  const [feed, setFeed] = useState([]);
  const [ch, setCh] = useState(null);
  const [chShown, setChShown] = useState(0);
  const [rest, setRest] = useState(0);
  const [banReq, setBanReq] = useState(null);
  const [victory, setVictory] = useState(null);
  const [emoteToast, setEmoteToast] = useState(null);
  const [fx, setFx] = useState(null);          // efecto de intercambio
  const [modal, setModal] = useState('');      // '' | 'collection' | 'leaderboard'
  const [me, setMe] = useState(null);
  const [board, setBoard] = useState(null);

  useEffect(() => {
    const s = io(API + '/grimoire', { auth: { token } });
    sockRef.current = s;
    s.on('connect', () => { setConn('ok'); setMyId(s.id); });
    s.on('connect_error', () => { setConn('fail'); setErr('No connection. / Sin conexión.'); });
    s.on('grim:queue', () => setUi('queue'));
    s.on('grim:matched', (d) => { setCode(d.code); setDeck(d.deck); setOppName(d.opponent); setFeed([]); setVictory(null); setUi('deck'); });
    s.on('grim:round-start', () => { setCh(null); setBanReq(null); setFx(null); setUi('duel'); });
    s.on('grim:state', setSt);
    s.on('grim:cast', (d) => { if (d.caster !== s.id) setFx({ kind: 'incoming', card: d.card }); });
    s.on('grim:challenge', (c) => { setCh(c); setChShown(Date.now()); if (c.say) setTimeout(() => speak(c.say, c.accent), 250); });
    s.on('grim:exchange', (e) => {
      setCh(null);
      setFx({ kind: 'result', e });
      setTimeout(() => setFx(null), 2200);
    });
    s.on('grim:round', () => setFx(null));
    s.on('grim:ban-request', (d) => setBanReq(d));
    s.on('grim:feed', (f) => setFeed(prev => [...prev.slice(-7), f]));
    s.on('grim:emote', (d) => { setEmoteToast(d); setTimeout(() => setEmoteToast(null), 2500); });
    s.on('grim:victory', (d) => { setVictory(d); setUi('victory'); });
    return () => { try { s.emit('grim:leave'); s.disconnect(); } catch (e) {} window.speechSynthesis && window.speechSynthesis.cancel(); };
  }, [token]);

  useEffect(() => {
    if (!ch) return;
    const t = setInterval(() => setRest(Math.max(0, (ch.deadline - Date.now()) / 1000)), 100);
    return () => clearInterval(t);
  }, [ch]);

  const yo = st ? st.players[myId] : null;
  const oppId = st ? st.order.find(id => id !== myId) : null;
  const opp = st && oppId ? st.players[oppId] : null;
  const miTurno = st && st.turn === myId && !ch && !st.exchange;

  const A = {
    page: { minHeight: '100vh', background: 'radial-gradient(1200px 600px at 50% -10%, #1a1035, #0a0715 60%)', color: '#e9e2ff', fontFamily: "'Poppins',sans-serif", paddingBottom: '2rem' },
    wrap: { maxWidth: 560, margin: '0 auto', padding: '0 14px' },
    card: { background: 'rgba(25,18,48,.7)', border: '1px solid rgba(139,92,246,.3)', borderRadius: 16, padding: '1.1rem', boxShadow: '0 10px 40px rgba(0,0,0,.5)' },
    btn: { border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer', fontFamily: "'Poppins',sans-serif" },
    arcane: { background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', color: '#fff' },
    cyan: { background: 'linear-gradient(135deg,#06b6d4,#0891b2)', color: '#fff' },
    ghost: { background: 'rgba(25,18,48,.8)', color: '#b3a3d6', border: '1px solid rgba(139,92,246,.35)' },
  };
  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', marginBottom: 8 }}>
      <button onClick={() => { window.speechSynthesis && window.speechSynthesis.cancel(); onBack(); }} style={{ ...A.btn, ...A.ghost, padding: '7px 14px', fontSize: '.76rem' }}>← Exit</button>
      <div style={{ fontWeight: 800, fontSize: '1rem' }}>📖 <span style={{ color: '#a78bfa' }}>AulaQuest</span> Grimoire</div>
      <span style={{ fontSize: '.62rem', color: conn === 'ok' ? '#34d399' : conn === 'fail' ? '#f87171' : '#fbbf24' }}>● {conn === 'ok' ? 'online' : conn === 'fail' ? 'offline' : '...'}</span>
    </div>
  );
  const errBox = err && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.35)', borderRadius: 10, padding: '9px 14px', margin: '8px 0', color: '#f87171', fontSize: '.78rem' }}>{err}</div>;

  const hpBar = (p, mine) => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', marginBottom: 3 }}>
        <span style={{ fontWeight: 700 }}>{p ? p.name : '—'}{mine ? ' (you)' : ''} {p && p.streak >= 1 ? '🔥'.repeat(Math.min(3, p.streak)) : ''}{p && p.critNext ? ' ⚡CRIT' : ''}</span>
        <span style={{ color: '#a78bfa', fontWeight: 700 }}>{p ? p.hp : 0} HP</span>
      </div>
      <div style={{ height: 12, background: 'rgba(139,92,246,.12)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: (p ? p.hp : 0) + '%', background: mine ? 'linear-gradient(90deg,#06b6d4,#22d3ee)' : 'linear-gradient(90deg,#8b5cf6,#c084fc)', borderRadius: 20, transition: 'width .4s' }} />
      </div>
    </div>
  );

  // ═══ MENU ═══
  if (ui === 'menu') return (
    <div style={A.page}><div style={A.wrap}>
      {header}{errBox}
      <div style={{ textAlign: 'center', margin: '.8rem 0 1.2rem' }}>
        <div style={{ fontSize: '3rem' }}>🔮</div>
        <h2 style={{ margin: '6px 0 2px', fontSize: '1.3rem' }}>C1 Wizard Duels</h2>
        <Sub>Duelos 1v1: cada hechizo es un reto C1 contrarreloj. La precisión es el daño.</Sub>
      </div>
      <div style={{ ...A.card, marginBottom: 10, textAlign: 'center' }}>
        <div style={{ fontWeight: 700 }}>🏅 Ranked duel</div><Sub style={{ marginBottom: 10 }}>Emparejamiento por ELO/liga</Sub>
        <button onClick={() => sockRef.current.emit('grim:rank')} disabled={conn !== 'ok'} style={{ ...A.btn, ...A.arcane, width: '100%', opacity: conn === 'ok' ? 1 : .5 }}>Find opponent</button>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <div style={{ ...A.card, flex: 1, textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '.85rem' }}>🤖 Practice</div><Sub style={{ marginBottom: 8 }}>vs bot</Sub>
          <button onClick={() => sockRef.current.emit('grim:bot')} disabled={conn !== 'ok'} style={{ ...A.btn, ...A.ghost, width: '100%', padding: '9px', fontSize: '.78rem' }}>Duel bot</button>
        </div>
        <div style={{ ...A.card, flex: 1, textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '.85rem' }}>🎟️ Challenge</div><Sub style={{ marginBottom: 8 }}>friend by code</Sub>
          <button onClick={() => sockRef.current.emit('grim:create', (r) => { if (r.ok) { setCode(r.code); setUi('waiting'); } })} disabled={conn !== 'ok'} style={{ ...A.btn, ...A.ghost, width: '100%', padding: '9px', fontSize: '.78rem' }}>Create</button>
        </div>
      </div>
      <div style={{ ...A.card, marginBottom: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '.85rem' }}>Join a duel code</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={joinCode} onChange={e => setJoin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0000" inputMode="numeric"
            style={{ flex: 1, textAlign: 'center', fontSize: '1.1rem', letterSpacing: '.3em', background: '#140f28', border: '1px solid rgba(139,92,246,.4)', borderRadius: 10, color: '#a78bfa', padding: '9px', fontWeight: 800, outline: 'none' }} />
          <button onClick={() => { if (/^\d{4}$/.test(joinCode)) sockRef.current.emit('grim:join', { code: joinCode }, (r) => { if (!r.ok) setErr(r.error); }); else setErr('Code = 4 digits'); }} style={{ ...A.btn, ...A.arcane }}>Join</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={async () => { const r = await fetch(API + '/api/grimoire/me', { headers: { Authorization: 'Bearer ' + token } }); setMe(await r.json()); setModal('collection'); }} style={{ ...A.btn, ...A.ghost, flex: 1, fontSize: '.78rem' }}>📚 Collection</button>
        <button onClick={async () => { const r = await fetch(API + '/api/grimoire/leaderboard', { headers: { Authorization: 'Bearer ' + token } }); setBoard((await r.json()).top); setModal('leaderboard'); }} style={{ ...A.btn, ...A.ghost, flex: 1, fontSize: '.78rem' }}>🏆 Ranking</button>
      </div>

      {modal === 'collection' && me && (
        <Overlay onClose={() => setModal('')}>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>📚 Your Grimoire</div>
          <Sub style={{ marginBottom: 10 }}>{me.liga} · {me.elo} ELO · {me.wins}W-{me.losses}L · {me.pool.length}/{me.total} cartas</Sub>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, maxHeight: '60vh', overflowY: 'auto' }}>
            {me.pool.map(c => <Card key={c.cardId} c={c} small />)}
          </div>
        </Overlay>
      )}
      {modal === 'leaderboard' && board && (
        <Overlay onClose={() => setModal('')}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>🏆 Global C1 Ranking</div>
          {board.length === 0 && <Sub>No duels yet. Be the first Archmage!</Sub>}
          {board.map(p => (
            <div key={p.pos} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 22, color: p.pos <= 3 ? '#fbbf24' : '#7c6aa8', fontWeight: 700 }}>{p.pos}.</span>
              <span style={{ flex: 1, fontSize: '.82rem', fontWeight: 600 }}>{p.name}</span>
              <span style={{ fontSize: '.66rem', color: '#a78bfa' }}>{p.liga}</span>
              <span style={{ fontWeight: 800, color: '#c084fc' }}>{p.elo}</span>
            </div>
          ))}
        </Overlay>
      )}
    </div></div>
  );

  // ═══ WAITING (código creado) ═══
  if (ui === 'waiting') return (
    <div style={A.page}><div style={A.wrap}>{header}
      <div style={{ ...A.card, textAlign: 'center', marginTop: '2rem' }}>
        <div style={{ color: '#7c6aa8', fontSize: '.72rem' }}>DUEL CODE / código</div>
        <div style={{ fontSize: '2.6rem', fontWeight: 800, letterSpacing: '.35em', color: '#a78bfa', paddingLeft: '.35em' }}>{code}</div>
        <Sub>Comparte el código. El duelo empieza cuando tu rival entre.</Sub>
        <button onClick={() => { sockRef.current.emit('grim:leave'); setUi('menu'); }} style={{ ...A.btn, ...A.ghost, marginTop: 14 }}>Cancel</button>
      </div>
    </div></div>
  );

  // ═══ QUEUE (ranked) ═══
  if (ui === 'queue') return (
    <div style={A.page}><div style={A.wrap}>{header}
      <div style={{ ...A.card, textAlign: 'center', marginTop: '2rem' }}>
        <div style={{ fontSize: '2rem' }}>🔍</div>
        <div style={{ fontWeight: 700, margin: '8px 0' }}>Searching for an opponent…</div>
        <Sub>Buscando rival por ELO (el rango se amplía cada 10s). Si no hay nadie, puedes practicar con el bot.</Sub>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'center' }}>
          <button onClick={() => { sockRef.current.emit('grim:cancel'); setUi('menu'); }} style={{ ...A.btn, ...A.ghost }}>Cancel</button>
          <button onClick={() => { sockRef.current.emit('grim:cancel'); sockRef.current.emit('grim:bot'); }} style={{ ...A.btn, ...A.arcane }}>Duel bot instead</button>
        </div>
      </div>
    </div></div>
  );

  // ═══ DECK (confirmar mazo) ═══
  if (ui === 'deck') return (
    <div style={A.page}><div style={A.wrap}>{header}
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div style={{ fontWeight: 800 }}>⚔️ Duel vs {oppName}</div>
        <Sub>Tu grimorio de 8 hechizos (5 escuelas). ¡A la batalla!</Sub>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {deck.map(c => <Card key={c.cardId} c={c} small />)}
      </div>
      <button onClick={() => sockRef.current.emit('grim:ready', {})} style={{ ...A.btn, ...A.arcane, width: '100%', fontSize: '1rem' }}>⚔️ To battle!</button>
      <div style={{ textAlign: 'center', marginTop: 8 }}><Sub>Best of 3 · el ganador de cada ronda banea 1 carta rival</Sub></div>
    </div></div>
  );

  // ═══ VICTORY ═══
  if (ui === 'victory' && victory) {
    const gane = victory.winner === myId;
    return (
      <div style={A.page}><div style={A.wrap}>{header}
        <div style={{ ...A.card, textAlign: 'center', marginBottom: 12, border: '1px solid ' + (gane ? 'rgba(251,191,36,.5)' : 'rgba(139,92,246,.4)') }}>
          <div style={{ fontSize: '2.6rem' }}>{gane ? '👑' : '💀'}</div>
          <div style={{ fontSize: '.72rem', fontWeight: 800, color: gane ? '#fbbf24' : '#a78bfa', letterSpacing: '.1em' }}>{gane ? 'VICTORY' : 'DEFEAT'}{victory.forfeit ? ' (forfeit)' : ''}</div>
          <h2 style={{ margin: '4px 0', fontSize: '1.2rem' }}>{victory.winnerName} wins the duel</h2>
        </div>
        <div style={{ ...A.card, marginBottom: 12 }}>
          {victory.standings.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ flex: 1, fontWeight: 700, fontSize: '.82rem' }}>{s.name}{s.id === myId ? ' (you)' : ''}{s.win ? ' 👑' : ''}</span>
              <span style={{ fontSize: '.66rem', color: '#a78bfa' }}>{s.liga}</span>
              <span style={{ fontWeight: 800, color: s.eloDelta >= 0 ? '#34d399' : '#f87171' }}>{s.eloDelta >= 0 ? '+' : ''}{s.eloDelta} ELO</span>
              <span style={{ fontSize: '.72rem', color: '#c084fc', width: 42, textAlign: 'right' }}>{s.elo}</span>
            </div>
          ))}
        </div>
        {victory.unlocked && victory.unlocked.winnerId === myId && (
          <div style={{ ...A.card, marginBottom: 12, textAlign: 'center', border: '1px solid rgba(251,191,36,.5)' }}>
            <Sub style={{ color: '#fbbf24', fontWeight: 800 }}>✨ NEW CARD UNLOCKED</Sub>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}><div style={{ width: 120 }}><Card c={victory.unlocked.card} /></div></div>
          </div>
        )}
        <button onClick={() => { setUi('menu'); setSt(null); setFeed([]); }} style={{ ...A.btn, ...A.arcane, width: '100%' }}>Back to the tower</button>
      </div></div>
    );
  }

  // ═══ DUEL ═══
  if (ui === 'duel' && st) {
    return (
      <div style={A.page}><div style={A.wrap}>
        {emoteToast && <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 95, background: 'rgba(25,18,48,.96)', border: '1px solid #8b5cf6', borderRadius: 50, padding: '6px 16px', fontSize: '.78rem' }}>💬 <b>{emoteToast.from}:</b> {emoteToast.emote}</div>}
        {header}
        <div style={{ fontSize: '.64rem', color: '#7c6aa8', textAlign: 'center', marginBottom: 8 }}>Best of 3 · Round {st.round} · {st.wins[myId] || 0}–{st.wins[oppId] || 0}</div>

        {hpBar(opp, false)}
        {/* Arena */}
        <div style={{ ...A.card, margin: '12px 0', minHeight: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          {fx && fx.kind === 'incoming' && <div style={{ color: '#f87171', fontWeight: 700 }}>🌩️ {opp ? opp.name : 'Opponent'} casts {fx.card.nombre}… block it!</div>}
          {fx && fx.kind === 'result' && (() => {
            const e = fx.e; const yoCaster = e.caster === myId;
            return (
              <div>
                <div style={{ fontSize: '1.4rem' }}>{e.blocked ? '🛡️' : e.heal ? '🌿' : e.crit ? '⚡' : e.casterCorrect ? '✨' : '💥'}</div>
                <div style={{ fontWeight: 700, fontSize: '.9rem' }}>
                  {e.blocked ? (yoCaster ? 'Blocked! You took ' + 15 : 'You blocked & countered!')
                    : e.heal ? (yoCaster ? 'You healed ' + e.heal : opp.name + ' healed')
                    : !e.casterCorrect ? (yoCaster ? 'You missed! −' + e.selfDmg : opp.name + ' missed')
                    : (yoCaster ? (e.crit ? 'CRIT! ' : '') + 'You hit ' + e.dmg : 'You took ' + e.dmg)}
                </div>
                {e.feedback && <div style={{ marginTop: 6, background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.35)', borderRadius: 8, padding: '6px 10px' }}><div style={{ fontSize: '.72rem', fontWeight: 600, color: '#fbbf24' }}>💡 {e.feedback.en}</div><Sub>{e.feedback.es}</Sub></div>}
              </div>
            );
          })()}
          {!fx && <div style={{ color: miTurno ? '#34d399' : '#7c6aa8', fontWeight: 700 }}>{miTurno ? '⚔️ Your turn — cast a spell!' : (st.turn === myId ? 'Casting…' : '⏳ ' + (opp ? opp.name : 'Opponent') + "'s turn")}</div>}
        </div>
        {hpBar(yo, true)}

        {/* Mano */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: '.62rem', color: '#7c6aa8', fontWeight: 700, marginBottom: 6 }}>YOUR SPELLS {miTurno ? '· tap to cast' : ''}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 7 }}>
            {deck.map(c => <Card key={c.cardId} c={c} small dim={!miTurno} onClick={miTurno ? () => sockRef.current.emit('grim:cast', { cardId: c.cardId }) : null} />)}
          </div>
        </div>

        {/* Emotes */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          {EMOTES.map(e => <button key={e} onClick={() => sockRef.current.emit('grim:emote', e)} style={{ ...A.btn, ...A.ghost, padding: '5px 10px', fontSize: '.66rem' }}>{e}</button>)}
        </div>

        {/* Feed */}
        <div style={{ marginTop: 12, fontSize: '.66rem', color: '#7c6aa8', textAlign: 'center' }}>
          {[...feed].slice(-3).map((f, i) => <div key={i}>{f.texto}</div>)}
        </div>

        {/* Reto (cast / block) */}
        {ch && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,4,15,.9)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
            <div style={{ ...A.card, width: 'min(520px,100%)', border: '2px solid ' + (ch.ctx === 'block' ? '#22d3ee' : (SCHOOL[ch.school] || {}).color || '#8b5cf6') }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: '.68rem', fontWeight: 800, color: ch.ctx === 'block' ? '#22d3ee' : '#a78bfa' }}>
                  {ch.ctx === 'block' ? '🛡️ BLOCK! solve faster than your rival' : '✨ CAST ' + ch.nombre + (ch.crit ? ' ⚡x2' : '')}
                </div>
                <div style={{ fontWeight: 800, color: rest < 3 ? '#f87171' : '#c084fc' }}>{Math.ceil(rest)}s</div>
              </div>
              {ch.say
                ? <div style={{ textAlign: 'center', margin: '6px 0 12px' }}><button onClick={() => speak(ch.say, ch.accent)} style={{ ...A.btn, ...A.cyan, padding: '12px 24px' }}>🔊 Listen ({ch.accent})</button><Sub>Toca para repetir</Sub></div>
                : <><div style={{ fontWeight: 700, fontSize: '.92rem', margin: '4px 0 2px' }}>{ch.q}</div><Sub style={{ marginBottom: 8 }}>{ch.qEs}</Sub></>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ch.opts.map((o, i) => (
                  <button key={i} onClick={() => { sockRef.current.emit('grim:answer', { token: ch.token, opt: i, ms: Date.now() - chShown }); setCh(c => c ? { ...c, waiting: true } : c); }}
                    disabled={ch.waiting}
                    style={{ ...A.btn, textAlign: 'left', background: 'rgba(20,15,40,.9)', color: '#e9e2ff', border: '1px solid rgba(139,92,246,.35)', fontSize: '.82rem', fontWeight: 600, opacity: ch.waiting ? .5 : 1 }}>{o}</button>
                ))}
              </div>
              {ch.waiting && <div style={{ textAlign: 'center', color: '#7c6aa8', fontSize: '.74rem', marginTop: 10 }}>Resolving… <Sub>Resolviendo el intercambio…</Sub></div>}
            </div>
          </div>
        )}

        {/* Baneo entre rondas */}
        {banReq && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,4,15,.9)', zIndex: 91, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
            <div style={{ ...A.card, width: 'min(520px,100%)' }}>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>🚫 Ban a card from {banReq.loserName}</div>
              <Sub style={{ marginBottom: 10 }}>Ganaste la ronda: elimina 1 hechizo del rival para la siguiente.</Sub>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 7 }}>
                {banReq.deck.map(c => <Card key={c.cardId} c={c} small onClick={() => { sockRef.current.emit('grim:ban', { cardId: c.cardId }); setBanReq(null); }} />)}
              </div>
            </div>
          </div>
        )}
      </div></div>
    );
  }

  return <div style={A.page}><div style={A.wrap}>{header}{errBox}<div style={{ textAlign: 'center', color: '#7c6aa8', marginTop: '3rem' }}>Loading…</div></div></div>;
}

function Overlay({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(6,4,15,.85)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(25,18,48,.96)', border: '1px solid rgba(139,92,246,.4)', borderRadius: 16, padding: '1.1rem', width: 'min(520px,100%)', maxHeight: '86vh', overflowY: 'auto', boxShadow: '0 10px 50px rgba(0,0,0,.6)' }}>{children}</div>
    </div>
  );
}
