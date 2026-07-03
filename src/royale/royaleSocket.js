const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const RoyaleChallenge = require('../models/RoyaleChallenge');
const RoyaleMatch     = require('../models/RoyaleMatch');

// ─── AulaQuest Royale — battle royale de inglés B2 (namespace /royale) ───
// Toda la lógica (tormenta, duelos, derribos, vivos, círculo final) vive en el
// SERVIDOR. El cliente solo pinta el estado y envía acciones. Reutiliza el
// mismo io/JWT que Arena/City/Files.

const ROOMS = new Map();

const ZONES = [
  { id: 'beach',      nombre: 'Beach',        icono: '🏖️' },
  { id: 'ghost',      nombre: 'Ghost Village', icono: '🏚️' },
  { id: 'lighthouse', nombre: 'Lighthouse',   icono: '🗼' },
  { id: 'jungle',     nombre: 'Jungle',       icono: '🌴' },
  { id: 'lab',        nombre: 'Lab',          icono: '🧪' },
];
const SHRINK = ['beach', 'ghost', 'lighthouse', 'jungle']; // lab es el ojo de la tormenta
const STORM_MS   = 40000;   // la tormenta cierra el círculo cada 40s
const STORM_DMG  = 42;
const CHEST_MS   = 16000;
const DUEL_MS    = 16000;
const REVIVE_MS  = 18000;
const BLEED_MS   = 13000;
const FINAL_MS   = 90000;
const FINAL_WINS = 3;
const MAX_PLAYERS = 50;
const SQUAD_NAMES = ['Falcons', 'Sharks', 'Wolves', 'Cobras', 'Ravens', 'Bulls', 'Vipers', 'Tigers', 'Hawks', 'Panthers'];

function genCode() { let c; do { c = String(Math.floor(1000 + Math.random() * 9000)); } while (ROOMS.has(c)); return c; }
function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
function safeZones(phase) { const dead = SHRINK.slice(0, phase); return ZONES.map(z => z.id).filter(id => !dead.includes(id)); }
function clearT(room) { if (room.storm) { clearTimeout(room.storm); room.storm = null; } }

module.exports = function initRoyale(io) {
  const nsp = io.of('/royale');

  nsp.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error('Sin token'));
      const d = jwt.verify(token, process.env.JWT_SECRET);
      const u = await User.findById(d.id).select('name');
      if (!u) return next(new Error('Usuario no encontrado'));
      socket.userId = String(u._id); socket.userName = u.name; next();
    } catch (e) { next(new Error('Token invalido')); }
  });

  const roomOf = (s) => s.royaleCode ? ROOMS.get(s.royaleCode) : null;
  const pick = (room, tipo) => { const pool = tipo ? room.challenges.filter(c => c.tipo === tipo) : room.challenges; return rnd(pool.length ? pool : room.challenges); };

  function publicState(room) {
    const squads = [...room.squads.values()].map(sq => ({
      id: sq.id, nombre: sq.nombre, finalPoints: sq.finalPoints || 0,
      vivo: [...room.players.values()].some(p => p.squad === sq.id && p.alive),
      miembros: [...room.players.values()].filter(p => p.squad === sq.id).map(p => ({
        id: p.id, name: p.name, hp: p.hp, shield: p.shield, zone: p.zone, down: p.down, alive: p.alive, bot: p.bot, duelsWon: p.duelsWon,
      })),
    }));
    const aliveSquads = squads.filter(s => s.vivo).length;
    const alivePlayers = [...room.players.values()].filter(p => p.alive).length;
    return {
      fase: room.state, stormPhase: room.stormPhase, safe: safeZones(room.stormPhase),
      stormEndsAt: room.stormEndsAt, zones: ZONES, aliveSquads, alivePlayers, squads,
    };
  }
  function emitState(room) { nsp.to(room.code).emit('royale:state', publicState(room)); }
  function feed(room, texto, icon) { nsp.to(room.code).emit('royale:feed', { texto, icon: icon || '•', t: Date.now() }); }

  function roster(room) {
    return [...room.players.values()].map(p => ({ id: p.id, name: p.name, isHost: p.id === room.hostId, bot: p.bot }));
  }

  // ── Enviar un reto a un jugador (el cliente nunca ve la respuesta) ──
  function sendChallenge(room, p, ctx, extra) {
    if (p.bot) return;
    const ch = (extra && extra.ch) || pick(room, ctx === 'revive' ? 'listening' : (extra && extra.tipo));
    p.pending = { ctx, ch, token: Math.random().toString(36).slice(2), deadline: Date.now() + ((extra && extra.ms) || CHEST_MS), duelId: extra && extra.duelId, targetId: extra && extra.targetId };
    const s = nsp.sockets.get(p.id);
    if (s) s.emit('royale:challenge', {
      ctx, token: p.pending.token, tipo: ch.tipo, q: ch.q, qEs: ch.qEs, say: ch.say || '',
      opts: ch.opts, deadline: p.pending.deadline, opponent: extra && extra.opponent, targetName: extra && extra.targetName,
    });
  }

  function damage(room, p, dmg, causa) {
    if (!p.alive || p.down) return;
    let d = dmg;
    if (p.shield > 0) { const abs = Math.min(p.shield, d); p.shield -= abs; d -= abs; }
    p.hp -= d;
    if (p.hp <= 0) { p.hp = 0; downPlayer(room, p, causa); }
  }

  function downPlayer(room, p, causa) {
    p.down = true; p.pending = null;
    feed(room, `${p.name} was knocked down${causa ? ' (' + causa + ')' : ''}`, '🩸');
    const s = nsp.sockets.get(p.id); if (s) s.emit('royale:down', {});
    // Sangrado: si nadie lo revive, queda eliminado
    p.bleed = setTimeout(() => eliminate(room, p, causa), BLEED_MS);
    // ¿Toda la escuadra derribada/muerta? → aniquilación
    const squadAlive = [...room.players.values()].filter(x => x.squad === p.squad && x.alive && !x.down);
    if (squadAlive.length === 0) {
      [...room.players.values()].filter(x => x.squad === p.squad && x.alive).forEach(x => eliminate(room, x, 'squad wiped'));
    }
    emitState(room); checkWin(room);
  }

  function eliminate(room, p, causa) {
    if (!p.alive) return;
    if (p.bleed) { clearTimeout(p.bleed); p.bleed = null; }
    p.alive = false; p.down = false; p.pending = null;
    feed(room, `${p.name} was eliminated`, '💀');
    const s = nsp.sockets.get(p.id); if (s) s.emit('royale:eliminated', {});
    emitState(room); checkWin(room);
  }

  function revivePlayer(room, target, byName) {
    if (!target.down || !target.alive) return;
    if (target.bleed) { clearTimeout(target.bleed); target.bleed = null; }
    target.down = false; target.hp = 45; target.shield = 0;
    feed(room, `${byName} revived ${target.name}`, '💚');
    const s = nsp.sockets.get(target.id); if (s) s.emit('royale:revived', {});
    emitState(room);
  }

  // ── Tormenta ──
  function stormTick(room) {
    if (room.state !== 'playing') return;
    room.stormPhase++;
    const safe = safeZones(room.stormPhase);
    feed(room, `⛈️ The storm is closing in! Safe: ${safe.map(id => ZONES.find(z => z.id === id).nombre).join(', ')}`, '⛈️');
    [...room.players.values()].forEach(p => {
      if (p.alive && !p.down && !safe.includes(p.zone)) damage(room, p, STORM_DMG, 'storm');
    });
    room.stormEndsAt = Date.now() + STORM_MS;
    emitState(room);
    if (checkWin(room)) return;
    if (room.stormPhase >= SHRINK.length) { setTimeout(() => maybeFinal(room, true), 1500); return; }
    room.storm = setTimeout(() => stormTick(room), STORM_MS);
  }

  function aliveSquadIds(room) {
    return [...room.squads.keys()].filter(sq => [...room.players.values()].some(p => p.squad === sq && p.alive));
  }

  function maybeFinal(room, force) {
    if (room.state !== 'playing') return false;
    const alive = aliveSquadIds(room);
    if (alive.length <= 1) { victory(room, alive[0]); return true; }
    if (alive.length === 2 || force) { setFinal(room, alive); return true; }
    return false;
  }

  function checkWin(room) {
    if (room.state === 'ended') return true;
    if (room.state === 'playing') {
      const alive = aliveSquadIds(room);
      if (alive.length <= 1) { victory(room, alive[0]); return true; }
      if (alive.length === 2) { setFinal(room, alive); return true; }
    }
    if (room.state === 'final') {
      const alive = aliveSquadIds(room);
      if (alive.length <= 1) { victory(room, alive[0]); return true; }
    }
    return false;
  }

  // ── Círculo final: ronda relámpago (reset limpio de los 2 últimos squads) ──
  function setFinal(room, squadIds) {
    if (room.state !== 'playing') return;
    clearT(room);
    room.state = 'final';
    room.stormEndsAt = Date.now() + FINAL_MS;
    squadIds.forEach(sq => { const s = room.squads.get(sq); if (s) s.finalPoints = 0; });
    [...room.players.values()].forEach(p => {
      if (p.alive && squadIds.includes(p.squad)) {
        if (p.bleed) { clearTimeout(p.bleed); p.bleed = null; }
        p.down = false; p.hp = 100; p.shield = 0; p.pending = null;
      }
    });
    feed(room, `⚡ FINAL CIRCLE! Lightning round — first squad to ${FINAL_WINS} wins!`, '⚡');
    nsp.to(room.code).emit('royale:final', { squads: squadIds.map(id => room.squads.get(id).nombre), endsAt: room.stormEndsAt, meta: FINAL_WINS });
    emitState(room);
    [...room.players.values()].forEach(p => { if (p.alive && squadIds.includes(p.squad)) { if (p.bot) scheduleBotFinal(room, p); else sendChallenge(room, p, 'final', { ms: FINAL_MS }); } });
    room.storm = setTimeout(() => {
      // Tiempo agotado: gana la escuadra con más puntos
      const rank = squadIds.map(id => room.squads.get(id)).sort((a, b) => (b.finalPoints || 0) - (a.finalPoints || 0));
      victory(room, rank[0] && rank[0].id);
    }, FINAL_MS + 500);
  }

  async function victory(room, squadId) {
    clearT(room);
    room.state = 'ended';
    const win = room.squads.get(squadId);
    const standings = [...room.squads.values()].map(sq => ({
      id: sq.id, nombre: sq.nombre, finalPoints: sq.finalPoints || 0,
      duelsWon: [...room.players.values()].filter(p => p.squad === sq.id).reduce((a, p) => a + p.duelsWon, 0),
      win: sq.id === squadId,
    })).sort((a, b) => (b.win - a.win) || (b.finalPoints - a.finalPoints) || (b.duelsWon - a.duelsWon));

    const jugadores = [...room.players.values()].filter(p => !p.bot).map(p => ({
      userId: p.userId, name: p.name, squad: (room.squads.get(p.squad) || {}).nombre || '',
      duelsWon: p.duelsWon, kills: p.kills, revives: p.revives, win: p.squad === squadId,
      puntos: p.duelsWon * 20 + p.revives * 15 + (p.squad === squadId ? 100 : 0),
    })).sort((a, b) => b.puntos - a.puntos);

    try {
      await RoyaleMatch.create({ code: room.code, solo: room.solo, ganador: win ? win.nombre : '', players: jugadores });
    } catch (e) { console.error('Royale save error:', e.message); }

    nsp.to(room.code).emit('royale:victory', {
      ganador: win ? win.nombre : '—',
      standings, jugadores, mvp: jugadores[0] || null,
    });
    ROOMS.delete(room.code);
  }

  // ── Bots ──
  function botTick(room) {
    if (room.state === 'ended') return;
    const bots = [...room.players.values()].filter(p => p.bot && p.alive && !p.down);
    bots.forEach(b => {
      const safe = safeZones(room.stormPhase);
      if (!safe.includes(b.zone)) b.zone = rnd(safe);                    // huir de la tormenta
      else if (Math.random() < 0.5) b.zone = rnd(safe);                   // moverse
      if (Math.random() < 0.4 && Math.random() < 0.55) b.shield = Math.min(50, b.shield + 25); // cofre
    });
    // Combate: los bots enemigos también se enfrentan y van cayendo (atrición)
    if (room.state === 'playing') botCombat(room);
    // Bots derribados que un compañero bot puede revivir (baja probabilidad)
    [...room.players.values()].filter(p => p.bot && p.down && p.alive).forEach(b => {
      const mate = [...room.players.values()].find(x => x.squad === b.squad && x.alive && !x.down && x.id !== b.id);
      if (mate && Math.random() < 0.25) revivePlayer(room, b, mate.name);
    });
    emitState(room);
    if (room.state === 'playing' || room.state === 'final') room.botTimer = setTimeout(() => botTick(room), 5000);
  }

  // Duelo instantáneo entre dos bots enemigos → uno cae (reduce las escuadras)
  function botCombat(room) {
    const bots = [...room.players.values()].filter(p => p.bot && p.alive && !p.down);
    if (bots.length < 2 || Math.random() > 0.85) return;
    const a = rnd(bots);
    const rivales = bots.filter(x => x.squad !== a.squad);
    if (!rivales.length) return;
    const b = rnd(rivales);
    const win = Math.random() < 0.5 ? a : b, lose = win === a ? b : a;
    win.duelsWon++;
    damage(room, lose, 70, 'duel');
    if (!lose.alive) win.kills++;
    feed(room, `⚔️ ${win.name} knocked out ${lose.name}`, '⚔️');
  }
  function scheduleBotFinal(room, bot) {
    if (room.state !== 'final' || !bot.alive) return;
    setTimeout(() => {
      if (room.state !== 'final' || !bot.alive) return;
      if (Math.random() < 0.5) { const sq = room.squads.get(bot.squad); sq.finalPoints = (sq.finalPoints || 0) + 1; feed(room, `${bot.name} scored a point!`, '⚡'); emitState(room); if (sq.finalPoints >= FINAL_WINS) return victory(room, bot.squad); }
      scheduleBotFinal(room, bot);
    }, 4000 + Math.random() * 4000);
  }

  // ── Duelos 1v1 ──
  function startDuel(room, a, b) {
    if (!a.alive || !b.alive || a.down || b.down || a.pending || b.pending) return;
    const ch = pick(room);
    const duelId = Math.random().toString(36).slice(2);
    room.duels.set(duelId, { a: a.id, b: b.id, ch, res: {}, done: false });
    feed(room, `⚔️ ${a.name} vs ${b.name} — duel in ${ZONES.find(z => z.id === a.zone).nombre}!`, '⚔️');
    [[a, b], [b, a]].forEach(([p, opp]) => {
      if (p.bot) scheduleBotDuel(room, duelId, p);
      else sendChallenge(room, p, 'duel', { ch, duelId, ms: DUEL_MS, opponent: opp.name });
    });
    // Timeout del duelo
    setTimeout(() => resolveDuel(room, duelId), DUEL_MS + 800);
  }
  function scheduleBotDuel(room, duelId, bot) {
    setTimeout(() => {
      const d = room.duels.get(duelId); if (!d || d.done) return;
      d.res[bot.id] = { correct: Math.random() < 0.5, ms: 3000 + Math.random() * 9000 };
      if (d.res[d.a] && d.res[d.b]) resolveDuel(room, duelId);
    }, 3000 + Math.random() * 8000);
  }
  function resolveDuel(room, duelId) {
    const d = room.duels.get(duelId); if (!d || d.done) return;
    d.done = true; room.duels.delete(duelId);
    const A = room.players.get(d.a), B = room.players.get(d.b);
    if (!A || !B) return;
    const ra = d.res[d.a] || { correct: false, ms: 999999 };
    const rb = d.res[d.b] || { correct: false, ms: 999999 };
    A.pending = null; B.pending = null;
    let winner = null, loser = null;
    if (ra.correct && !rb.correct) { winner = A; loser = B; }
    else if (rb.correct && !ra.correct) { winner = B; loser = A; }
    else if (ra.correct && rb.correct) { if (ra.ms <= rb.ms) { winner = A; loser = B; } else { winner = B; loser = A; } }
    if (winner) {
      winner.duelsWon++;
      const fatal = !loser.down;
      damage(room, loser, 70, 'duel vs ' + winner.name);
      if (!loser.alive) winner.kills++;
      feed(room, `⚔️ ${winner.name} won the duel vs ${loser.name}`, '⚔️');
      const ws = nsp.sockets.get(winner.id); if (ws) ws.emit('royale:duel-result', { win: true, opponent: loser.name });
      const ls = nsp.sockets.get(loser.id); if (ls) ls.emit('royale:duel-result', { win: false, opponent: winner.name });
    } else {
      // ambos fallaron: daño leve a los dos
      [A, B].forEach(p => damage(room, p, 25, 'duel draw'));
      feed(room, `⚔️ ${A.name} vs ${B.name} ended in a draw`, '⚔️');
      [A, B].forEach(p => { const s = nsp.sockets.get(p.id); if (s) s.emit('royale:duel-result', { win: false, draw: true }); });
    }
    emitState(room);
  }

  function armar(room) {
    const reales = [...room.players.values()].filter(p => !p.bot);
    // Rellenar con bots hasta tener al menos 4 jugadores y número par de escuadras
    const SQUAD_SIZE = reales.length >= 6 ? 3 : 2;
    let total = reales.length;
    let objetivo = Math.max(4, Math.ceil(total / SQUAD_SIZE) * SQUAD_SIZE);
    if (room.solo) objetivo = Math.max(objetivo, 6);   // solo: 3 escuadras = royale ágil
    let botN = 0;
    while (total < objetivo || total < 4) {
      const id = 'bot' + botN++;
      room.players.set(id, { id, userId: null, name: rnd(['Ava','Leo','Mia','Sam','Noa','Kai','Zoe','Max','Ivy','Ben']) + ' 🤖', bot: true, squad: '', zone: '', hp: 100, shield: 0, down: false, alive: true, duelsWon: 0, kills: 0, revives: 0, pending: null });
      total++;
    }
    const all = [...room.players.values()].sort(() => Math.random() - 0.5);
    const nSquads = Math.ceil(all.length / SQUAD_SIZE);
    room.squads = new Map();
    for (let i = 0; i < nSquads; i++) room.squads.set('sq' + i, { id: 'sq' + i, nombre: SQUAD_NAMES[i % SQUAD_NAMES.length], finalPoints: 0 });
    all.forEach((p, i) => {
      p.squad = 'sq' + (i % nSquads);
      p.zone = rnd(ZONES).id; p.hp = 100; p.shield = 0; p.down = false; p.alive = true; p.pending = null;
      const s = nsp.sockets.get(p.id); if (s) s.join(room.code);
    });
  }

  nsp.on('connection', (socket) => {
    const crear = (solo, cb) => {
      salir(socket);
      const code = genCode();
      const room = { code, hostId: socket.id, solo, state: 'lobby', stormPhase: 0, stormEndsAt: 0, storm: null, botTimer: null, challenges: [], players: new Map(), squads: new Map(), duels: new Map() };
      room.players.set(socket.id, { id: socket.id, userId: socket.userId, name: socket.userName, bot: false, squad: '', zone: '', hp: 100, shield: 0, down: false, alive: true, duelsWon: 0, kills: 0, revives: 0, pending: null });
      ROOMS.set(code, room);
      socket.royaleCode = code; socket.join(code);
      cb({ ok: true, code, players: roster(room) });
    };
    socket.on('royale:create', (cb) => typeof cb === 'function' && crear(false, cb));
    socket.on('royale:solo',   (cb) => typeof cb === 'function' && crear(true, cb));

    socket.on('royale:join', (data, cb) => {
      if (typeof cb !== 'function') return;
      const room = ROOMS.get(String((data && data.code) || '').trim());
      if (!room) return cb({ ok: false, error: 'Match not found. / Partida no encontrada.' });
      if (room.state !== 'lobby') return cb({ ok: false, error: 'The match already started. / La partida ya empezó.' });
      if (room.solo) return cb({ ok: false, error: 'That is a solo match. / Esa es individual.' });
      if (room.players.size >= MAX_PLAYERS) return cb({ ok: false, error: 'Match full. / Partida llena.' });
      salir(socket);
      room.players.set(socket.id, { id: socket.id, userId: socket.userId, name: socket.userName, bot: false, squad: '', zone: '', hp: 100, shield: 0, down: false, alive: true, duelsWon: 0, kills: 0, revives: 0, pending: null });
      socket.royaleCode = room.code; socket.join(room.code);
      nsp.to(room.code).emit('royale:players', roster(room));
      cb({ ok: true, code: room.code, players: roster(room) });
    });

    socket.on('royale:start', async () => {
      const room = roomOf(socket);
      if (!room || room.hostId !== socket.id || room.state !== 'lobby') return;
      try { room.challenges = await RoyaleChallenge.find({}).lean(); } catch (e) {}
      if (!room.challenges.length) { nsp.to(room.code).emit('royale:err', 'No challenges. / Sin retos.'); return; }
      armar(room);
      room.state = 'playing'; room.stormPhase = 0; room.stormEndsAt = Date.now() + STORM_MS;
      nsp.to(room.code).emit('royale:begin', { zones: ZONES });
      feed(room, '🪂 Detectives dropped onto the island! Survive the storm.', '🪂');
      emitState(room);
      room.storm = setTimeout(() => stormTick(room), STORM_MS);
      room.botTimer = setTimeout(() => botTick(room), 5000);
      setTimeout(() => checkWin(room), 900);   // por si arranca ya con ≤2 escuadras

    });

    socket.on('royale:move', (data) => {
      const room = roomOf(socket); if (!room || (room.state !== 'playing')) return;
      const p = room.players.get(socket.id);
      if (!p || !p.alive || p.down || p.pending) return;
      const zone = String((data && data.zone) || '');
      if (!ZONES.some(z => z.id === zone)) return;
      p.zone = zone;
      emitState(room);
      // ¿Enemigo en la zona? → duelo
      const enemigo = [...room.players.values()].find(x => x.zone === zone && x.squad !== p.squad && x.alive && !x.down && !x.pending && x.id !== p.id);
      if (enemigo) startDuel(room, p, enemigo);
    });

    socket.on('royale:chest', (cb) => {
      const room = roomOf(socket); if (!room || room.state !== 'playing') return;
      const p = room.players.get(socket.id);
      if (!p || !p.alive || p.down || p.pending) return typeof cb === 'function' && cb({ ok: false });
      sendChallenge(room, p, 'chest', { ms: CHEST_MS });
      if (typeof cb === 'function') cb({ ok: true });
    });

    socket.on('royale:revive', (data, cb) => {
      const room = roomOf(socket); if (!room || room.state !== 'playing') return;
      const p = room.players.get(socket.id);
      const target = room.players.get(data && data.targetId);
      if (!p || !p.alive || p.down || p.pending) return typeof cb === 'function' && cb({ ok: false });
      if (!target || target.squad !== p.squad || !target.down || !target.alive || target.zone !== p.zone) return typeof cb === 'function' && cb({ ok: false, error: 'You must be in the same zone as your downed teammate.' });
      sendChallenge(room, p, 'revive', { ms: REVIVE_MS, targetId: target.id, targetName: target.name });
      if (typeof cb === 'function') cb({ ok: true });
    });

    // Respuesta a cualquier reto (cofre/duelo/revivir/final)
    socket.on('royale:answer', (data, cb) => {
      const room = roomOf(socket); if (!room) return;
      const p = room.players.get(socket.id);
      if (!p || !p.pending || !data || data.token !== p.pending.token) return typeof cb === 'function' && cb({ ok: false });
      const pend = p.pending;
      const correct = Number(data.opt) === pend.ch.ans;
      const fb = correct ? null : pend.ch.feedback;

      if (pend.ctx === 'duel') {
        const d = room.duels.get(pend.duelId);
        if (d && !d.done) { d.res[p.id] = { correct, ms: Number(data.ms) || 9999 }; if (d.res[d.a] && d.res[d.b]) resolveDuel(room, pend.duelId); }
        p.pending = null;
        return typeof cb === 'function' && cb({ ok: true, correct, feedback: fb });
      }
      p.pending = null;
      if (pend.ctx === 'chest') {
        if (correct) {
          if (Math.random() < 0.5) { p.shield = Math.min(50, p.shield + 30); feed(room, `${p.name} looted a shield`, '🛡️'); }
          else { p.hp = Math.min(100, p.hp + 30); feed(room, `${p.name} looted a medkit`, '❤️‍🩹'); }
        }
        emitState(room);
        return typeof cb === 'function' && cb({ ok: true, correct, feedback: fb, loot: correct });
      }
      if (pend.ctx === 'revive') {
        const target = room.players.get(pend.targetId);
        if (correct && target) { p.revives++; revivePlayer(room, target, p.name); }
        return typeof cb === 'function' && cb({ ok: true, correct, feedback: fb });
      }
      if (pend.ctx === 'final') {
        if (room.state === 'final' && p.alive) {
          if (correct) { const sq = room.squads.get(p.squad); sq.finalPoints = (sq.finalPoints || 0) + 1; feed(room, `${p.name} scored a point!`, '⚡'); emitState(room); if (sq.finalPoints >= FINAL_WINS) { victory(room, p.squad); return typeof cb === 'function' && cb({ ok: true, correct, done: true }); } }
          sendChallenge(room, p, 'final', { ms: FINAL_MS });
        }
        return typeof cb === 'function' && cb({ ok: true, correct, feedback: fb });
      }
      if (typeof cb === 'function') cb({ ok: true, correct, feedback: fb });
    });

    socket.on('royale:leave', () => salir(socket));
    socket.on('disconnect',  () => salir(socket));

    function salir(s) {
      const room = roomOf(s); s.royaleCode = null;
      if (!room) return;
      const p = room.players.get(s.id);
      if (room.state === 'lobby') { room.players.delete(s.id); }
      else if (p) { p.disconnected = true; if (p.alive && !p.down) eliminate(room, p, 'left'); }
      const reales = [...room.players.values()].filter(x => !x.bot && !x.disconnected);
      if (reales.length === 0) { clearT(room); if (room.botTimer) clearTimeout(room.botTimer); ROOMS.delete(room.code); return; }
      if (room.hostId === s.id) room.hostId = reales[0].id;
      if (room.state === 'lobby') nsp.to(room.code).emit('royale:players', roster(room));
    }
  });
};
