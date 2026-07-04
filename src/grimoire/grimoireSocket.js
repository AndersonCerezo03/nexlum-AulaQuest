const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const GrimoireCard   = require('../models/GrimoireCard');
const GrimoireDuel   = require('../models/GrimoireDuel');
const GrimoirePlayer = require('../models/GrimoirePlayer');

// ─── AulaQuest Grimoire — duelos de magos C1 (namespace /grimoire) ───
// Server autoritativo: HP, daño, timers, ventanas de bloqueo y validación
// viven aquí. El cliente nunca conoce la respuesta antes de resolver.
// Reutiliza el mismo io/JWT que Arena/City/Files/Royale.

const ROOMS = new Map();
const QUEUE = [];               // matchmaking ranked: {socketId, elo, since}
let   _cards = [];              // banco de cartas en memoria

const HP0        = 100;
const CAST_MS    = 12000;
const BLOCK_MS   = 8000;
const COUNTER    = 15;
const MISS_DMG   = 15;
const WINS_NEEDED = 2;          // best of 3
const GRACE_MS   = 30000;       // reconexión
const EMOTES = ['Well played!', 'Nice block!', 'Ouch!', 'GG'];
const BOT_NAMES = ['Archmage Nyx 🤖', 'Warlock Vex 🤖', 'Sage Lumen 🤖'];

function ligaDeElo(e) { return e >= 1800 ? 'Archimago' : e >= 1500 ? 'Diamante' : e >= 1300 ? 'Oro' : e >= 1100 ? 'Plata' : 'Bronce'; }
function genCode() { let c; do { c = String(Math.floor(1000 + Math.random() * 9000)); } while (ROOMS.has(c)); return c; }
function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
function shuffle(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
function pickDeck() { return shuffle(_cards).slice(0, 8); }
// carta pública (sin la respuesta)
function pubCard(c) { return { cardId: c.cardId, school: c.school, nombre: c.nombre, tipo: c.tipo, valor: c.valor, rareza: c.rareza, segundos: c.segundos }; }

async function getPlayer(userId) {
  let p = await GrimoirePlayer.findOne({ userId });
  if (!p) p = await GrimoirePlayer.create({ userId, elo: 1000, liga: 'Bronce' });
  return p;
}

module.exports = function initGrimoire(io) {
  const nsp = io.of('/grimoire');

  // Cargar el banco de cartas en memoria (y reintentar si aún no hay conexión)
  const cargarCartas = () => GrimoireCard.find({}).lean().then(c => { if (c.length) _cards = c; }).catch(() => {});
  cargarCartas(); setTimeout(cargarCartas, 8000);

  nsp.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error('Sin token'));
      const d = jwt.verify(token, process.env.JWT_SECRET);
      const u = await User.findById(d.id).select('name');
      if (!u) return next(new Error('Usuario no encontrado'));
      socket.userId = String(u._id); socket.userName = u.name;
      try { const gp = await getPlayer(socket.userId); socket.elo = gp.elo; } catch (e) { socket.elo = 1000; }
      next();
    } catch (e) { next(new Error('Token invalido')); }
  });

  const roomOf = (s) => s.grimCode ? ROOMS.get(s.grimCode) : null;
  const cardById = (id) => _cards.find(c => c.cardId === id);

  function pubState(room) {
    const P = {};
    for (const p of room.players.values()) P[p.id] = { id: p.id, name: p.name, hp: p.hp, elo: p.elo, streak: p.streak, critNext: p.critNext, bot: p.bot, connected: !p.disconnected };
    return { state: room.state, round: room.round, wins: room.wins, turn: room.turn, players: P, order: room.order };
  }
  const emitState = (room) => nsp.to(room.code).emit('grim:state', pubState(room));
  const feed = (room, texto) => nsp.to(room.code).emit('grim:feed', { texto, t: Date.now() });

  // ── Crear un duelo entre dos participantes (humanos o bot) ──
  function makeDuel(mode, a, b) {
    const code = genCode();
    const mk = (info) => ({
      id: info.id, userId: info.userId || null, name: info.name, elo: info.elo || 1000,
      bot: !!info.bot, hp: HP0, deck: pickDeck(), streak: 0, critNext: false, ready: info.bot ? true : false,
      pending: null, disconnected: false, discTimer: null,
    });
    const room = { code, mode, state: 'deck', round: 1, wins: {}, order: [a.id, b.id], turn: a.id, exchange: null, players: new Map(), timers: {} };
    room.players.set(a.id, mk(a)); room.players.set(b.id, mk(b));
    room.wins[a.id] = 0; room.wins[b.id] = 0;
    ROOMS.set(code, room);
    for (const pid of room.order) { const s = nsp.sockets.get(pid); if (s) { s.grimCode = code; s.join(code); } }
    // enviar mazo (privado) a cada humano
    for (const p of room.players.values()) {
      if (p.bot) continue;
      const s = nsp.sockets.get(p.id);
      if (s) s.emit('grim:matched', { code, mode, deck: p.deck.map(pubCard), opponent: [...room.players.values()].find(x => x.id !== p.id).name });
    }
    // si el rival es bot, arranca solo al confirmar el humano; si ambos bots (no pasa), arranca
    checkStart(room);
    return room;
  }

  function checkStart(room) {
    if (room.state !== 'deck') return;
    if ([...room.players.values()].every(p => p.ready)) startRound(room, room.order[0]);
  }

  function startRound(room, firstTurn) {
    room.state = 'duel';
    for (const p of room.players.values()) { p.hp = HP0; p.streak = 0; p.critNext = false; p.pending = null; }
    room.turn = firstTurn;
    room.exchange = null;
    nsp.to(room.code).emit('grim:round-start', { round: room.round, wins: room.wins });
    emitState(room);
    feed(room, `⚔️ Round ${room.round} — ${room.players.get(room.turn).name} starts`);
    maybeBotTurn(room);
  }

  function sendChallenge(room, p, ctx, card, ms, exId) {
    p.pending = { ctx, card, token: Math.random().toString(36).slice(2), exId, deadline: Date.now() + ms };
    if (p.bot) return;
    const s = nsp.sockets.get(p.id);
    if (s) s.emit('grim:challenge', {
      ctx, token: p.pending.token, cardId: card.cardId, nombre: card.nombre, school: card.school, tipo: card.tipo, valor: card.valor,
      q: card.reto.q, qEs: card.reto.qEs, opts: card.reto.opts, say: card.reto.say || '', accent: card.reto.accent || '',
      deadline: p.pending.deadline, crit: ctx === 'cast' && p.critNext,
    });
  }

  function startExchange(room, casterId, card) {
    if (room.state !== 'duel' || room.exchange) return;
    const caster = room.players.get(casterId);
    const defender = room.players.get(room.order.find(id => id !== casterId));
    if (!caster || !defender || caster.hp <= 0 || defender.hp <= 0) return;
    const exId = Math.random().toString(36).slice(2);
    room.exchange = { id: exId, casterId, defenderId: defender.id, card, ans: {}, done: false };
    feed(room, `✨ ${caster.name} casts ${card.nombre}`);
    nsp.to(room.code).emit('grim:cast', { caster: caster.id, card: pubCard(card) });
    sendChallenge(room, caster, 'cast', card, card.segundos * 1000 || CAST_MS, exId);
    sendChallenge(room, defender, 'block', card, BLOCK_MS, exId);
    if (caster.bot) botAnswer(room, caster, exId, card, 'cast');
    if (defender.bot) botAnswer(room, defender, exId, card, 'block');
    room.timers[exId] = setTimeout(() => resolveExchange(room, exId), Math.max(card.segundos * 1000 || CAST_MS, BLOCK_MS) + 900);
  }

  function botAnswer(room, bot, exId, card, ctx) {
    const acc = ctx === 'cast' ? 0.66 : 0.5;
    const ms = 1200 + Math.random() * (ctx === 'block' ? 1800 : 2800);
    setTimeout(() => {
      const ex = room.exchange; if (!ex || ex.id !== exId || ex.done) return;
      ex.ans[bot.id] = { correct: Math.random() < acc, ms };
      if (ex.ans[ex.casterId] && ex.ans[ex.defenderId]) resolveExchange(room, exId);
    }, ms);
  }

  function resolveExchange(room, exId) {
    const ex = room.exchange; if (!ex || ex.id !== exId || ex.done) return;
    ex.done = true; if (room.timers[exId]) { clearTimeout(room.timers[exId]); delete room.timers[exId]; }
    const caster = room.players.get(ex.casterId), defender = room.players.get(ex.defenderId);
    caster.pending = null; defender.pending = null;
    const ca = ex.ans[ex.casterId] || { correct: false, ms: 999999 };
    const da = ex.ans[ex.defenderId] || { correct: false, ms: 999999 };
    const card = ex.card;
    let dmg = 0, heal = 0, blocked = false, crit = false, selfDmg = 0;

    if (!ca.correct) {
      // fallo del atacante → auto-daño y se rompe la racha
      selfDmg = MISS_DMG; caster.hp -= MISS_DMG; caster.streak = 0; caster.critNext = false;
    } else {
      crit = caster.critNext;
      // ¿bloqueo? defensor correcto y tan rápido o más que el atacante
      if (da.correct && da.ms <= ca.ms) {
        blocked = true; caster.hp -= COUNTER; // contraataque
        defender.streak = 0;
        caster.streak = 0; caster.critNext = false;
      } else {
        if (card.tipo === 'heal') { heal = card.valor; caster.hp = Math.min(HP0, caster.hp + heal); }
        else { dmg = card.valor * (crit ? 2 : 1); defender.hp -= dmg; }
        caster.streak++;
        caster.critNext = caster.streak >= 3; if (caster.critNext) caster.streak = 0;
      }
    }
    caster.hp = Math.max(0, caster.hp); defender.hp = Math.max(0, defender.hp);
    room.exchange = null;

    nsp.to(room.code).emit('grim:exchange', {
      caster: caster.id, defender: defender.id, card: pubCard(card),
      casterCorrect: ca.correct, defenderCorrect: da.correct, blocked, crit, dmg, heal, selfDmg,
      hp: { [caster.id]: caster.hp, [defender.id]: defender.hp },
      feedback: (!ca.correct || blocked) ? card.reto.feedback : null,
    });
    if (blocked) feed(room, `🛡️ ${defender.name} blocked and countered!`);
    else if (!ca.correct) feed(room, `💥 ${caster.name} missed and took ${MISS_DMG}`);
    else if (heal) feed(room, `🌿 ${caster.name} healed ${heal}`);
    else feed(room, `${crit ? '⚡CRIT ' : ''}${caster.name} hit for ${dmg}`);
    emitState(room);

    if (caster.hp <= 0 || defender.hp <= 0) return endRound(room);
    room.turn = defender.id;   // pasa el turno
    emitState(room);
    setTimeout(() => maybeBotTurn(room), 900);
  }

  function endRound(room) {
    const [a, b] = room.order.map(id => room.players.get(id));
    const winner = a.hp > b.hp ? a : b;   // el que quede con más HP (si ambos >0 no pasa por aquí)
    const rWinner = a.hp <= 0 && b.hp <= 0 ? winner : (a.hp <= 0 ? b : a);
    room.wins[rWinner.id]++;
    nsp.to(room.code).emit('grim:round', { winner: rWinner.id, wins: room.wins });
    feed(room, `🏅 ${rWinner.name} wins round ${room.round}`);
    if (room.wins[rWinner.id] >= WINS_NEEDED) return endDuel(room, rWinner.id);
    // baneo: el ganador banea 1 carta del rival
    const loser = room.order.map(id => room.players.get(id)).find(p => p.id !== rWinner.id);
    room.state = 'roundEnd';
    room.round++;
    if (rWinner.bot) { // el bot banea al azar
      const rm = rnd(loser.deck); loser.deck = loser.deck.filter(c => c.cardId !== rm.cardId);
      feed(room, `🚫 ${rWinner.name} banned ${rm.nombre}`);
      startRound(room, loser.id);
    } else {
      const s = nsp.sockets.get(rWinner.id);
      if (s) s.emit('grim:ban-request', { loserName: loser.name, deck: loser.deck.map(pubCard) });
      room.timers.ban = setTimeout(() => { const rm = rnd(loser.deck); loser.deck = loser.deck.filter(c => c.cardId !== rm.cardId); startRound(room, loser.id); }, 15000);
    }
  }

  async function endDuel(room, winnerId, forfeit) {
    if (room.state === 'ended') return;
    room.state = 'ended';
    Object.values(room.timers).forEach(t => clearTimeout(t)); room.timers = {};
    const winner = room.players.get(winnerId);
    const loser = room.order.map(id => room.players.get(id)).find(p => p.id !== winnerId);

    // ELO (solo entre humanos con userId)
    const deltas = {};
    if (winner.userId && loser.userId) {
      const exp = 1 / (1 + Math.pow(10, (loser.elo - winner.elo) / 400));
      const d = Math.round(32 * (1 - exp));
      deltas[winner.id] = d; deltas[loser.id] = -d;
    } else { deltas[winner.id] = winner.userId ? 12 : 0; deltas[loser.id] = loser.userId ? -8 : 0; }

    let unlocked = null;
    try {
      for (const p of [winner, loser]) {
        if (!p.userId) continue;
        const gp = await getPlayer(p.userId);
        gp.elo = Math.max(0, gp.elo + (deltas[p.id] || 0));
        gp.liga = ligaDeElo(gp.elo);
        if (p.id === winnerId) {
          gp.wins++;
          // desbloquear una carta legendaria/rara que no tenga
          const owned = new Set(gp.coleccion);
          const nueva = _cards.find(c => (c.rareza === 'legendary' || c.rareza === 'rare') && !owned.has(c.cardId));
          if (nueva) { gp.coleccion.push(nueva.cardId); unlocked = { winnerId, card: pubCard(nueva) }; }
        } else gp.losses++;
        gp.historial.unshift({ oponente: (p.id === winnerId ? loser : winner).name, resultado: p.id === winnerId ? 'win' : 'loss', eloDelta: deltas[p.id] || 0 });
        gp.historial = gp.historial.slice(0, 40);
        await gp.save();
      }
      await GrimoireDuel.create({
        mode: room.mode, ganador: winner.name, rondas: room.wins[winnerId] + '-' + room.wins[loser.id],
        players: room.order.map(id => { const p = room.players.get(id); return { userId: p.userId, name: p.name, elo: p.elo, eloDelta: deltas[id] || 0, win: id === winnerId, bot: p.bot }; }),
      });
    } catch (e) { console.error('Grimoire save error:', e.message); }

    nsp.to(room.code).emit('grim:victory', {
      winner: winnerId, winnerName: winner.name, forfeit: !!forfeit,
      standings: room.order.map(id => { const p = room.players.get(id); return { id, name: p.name, win: id === winnerId, eloDelta: deltas[id] || 0, elo: (p.elo + (deltas[id] || 0)), liga: ligaDeElo(p.elo + (deltas[id] || 0)) }; }),
      unlocked,
    });
    ROOMS.delete(room.code);
  }

  function maybeBotTurn(room) {
    if (room.state !== 'duel' || room.exchange) return;
    const p = room.players.get(room.turn);
    if (p && p.bot) setTimeout(() => { if (room.state === 'duel' && !room.exchange && room.turn === p.id) startExchange(room, p.id, rnd(p.deck)); }, 1300);
  }

  // ── Matchmaking ranked ──
  function tryMatch() {
    for (let i = 0; i < QUEUE.length; i++) {
      for (let j = i + 1; j < QUEUE.length; j++) {
        const a = QUEUE[i], b = QUEUE[j];
        const rango = 100 + Math.floor((Date.now() - Math.max(a.since, b.since)) / 10000) * 100;
        if (Math.abs(a.elo - b.elo) <= rango) {
          const sa = nsp.sockets.get(a.socketId), sb = nsp.sockets.get(b.socketId);
          QUEUE.splice(j, 1); QUEUE.splice(i, 1);
          if (sa && sb) makeDuel('ranked', { id: sa.id, userId: sa.userId, name: sa.userName, elo: sa.elo }, { id: sb.id, userId: sb.userId, name: sb.userName, elo: sb.elo });
          return;
        }
      }
    }
  }

  nsp.on('connection', (socket) => {

    socket.on('grim:bot', () => {
      makeDuel('bot', { id: socket.id, userId: socket.userId, name: socket.userName, elo: socket.elo }, { id: 'bot_' + socket.id, name: rnd(BOT_NAMES), bot: true, elo: socket.elo });
    });

    socket.on('grim:rank', () => {
      if (QUEUE.some(q => q.socketId === socket.id)) return;
      QUEUE.push({ socketId: socket.id, elo: socket.elo || 1000, since: Date.now() });
      socket.emit('grim:queue', { n: QUEUE.length });
      tryMatch();
    });
    socket.on('grim:cancel', () => { const i = QUEUE.findIndex(q => q.socketId === socket.id); if (i >= 0) QUEUE.splice(i, 1); });

    socket.on('grim:create', (cb) => {
      if (typeof cb !== 'function') return;
      const code = genCode();
      ROOMS.set(code, { code, mode: 'code', state: 'waiting', host: { id: socket.id, userId: socket.userId, name: socket.userName, elo: socket.elo }, players: new Map(), order: [], wins: {}, timers: {} });
      socket.grimCode = code; socket.join(code);
      cb({ ok: true, code });
    });
    socket.on('grim:join', (data, cb) => {
      if (typeof cb !== 'function') return;
      const room = ROOMS.get(String((data && data.code) || '').trim());
      if (!room || room.state !== 'waiting') return cb({ ok: false, error: 'Duel not found. / Duelo no encontrado.' });
      cb({ ok: true, code: room.code });
      const host = room.host;
      ROOMS.delete(room.code); // makeDuel crea la sala real
      makeDuel('code', { id: host.id, userId: host.userId, name: host.name, elo: host.elo }, { id: socket.id, userId: socket.userId, name: socket.userName, elo: socket.elo });
    });

    // Confirmar mazo (deck-building); si no se manda, se usa el auto-asignado
    socket.on('grim:ready', (data) => {
      const room = roomOf(socket); if (!room || room.state !== 'deck') return;
      const p = room.players.get(socket.id); if (!p) return;
      if (data && Array.isArray(data.cardIds) && data.cardIds.length === 8) {
        const chosen = data.cardIds.map(cardById).filter(Boolean);
        if (chosen.length === 8) p.deck = chosen;
      }
      p.ready = true;
      checkStart(room);
    });

    socket.on('grim:cast', (data) => {
      const room = roomOf(socket); if (!room || room.state !== 'duel' || room.exchange) return;
      if (room.turn !== socket.id) return;
      const p = room.players.get(socket.id); if (!p || p.hp <= 0) return;
      const card = p.deck.find(c => c.cardId === (data && data.cardId));
      if (!card) return;
      startExchange(room, socket.id, card);
    });

    socket.on('grim:answer', (data) => {
      const room = roomOf(socket); if (!room) return;
      const p = room.players.get(socket.id);
      if (!p || !p.pending || !data || data.token !== p.pending.token) return;
      const ex = room.exchange;
      if (!ex || ex.id !== p.pending.exId || ex.done) { p.pending = null; return; }
      const correct = Number(data.opt) === p.pending.card.reto.ans;
      ex.ans[p.id] = { correct, ms: Number(data.ms) || 9999 };
      if (ex.ans[ex.casterId] && ex.ans[ex.defenderId]) resolveExchange(room, ex.id);
    });

    socket.on('grim:ban', (data) => {
      const room = roomOf(socket); if (!room || room.state !== 'roundEnd') return;
      if (room.timers.ban) { clearTimeout(room.timers.ban); delete room.timers.ban; }
      const loser = room.order.map(id => room.players.get(id)).find(p => p.id !== socket.id);
      if (loser) { loser.deck = loser.deck.filter(c => c.cardId !== (data && data.cardId)); if (loser.deck.length < 4) loser.deck = pickDeck(); feed(room, `🚫 ${room.players.get(socket.id).name} banned a card`); }
      startRound(room, loser ? loser.id : room.order[0]);
    });

    socket.on('grim:emote', (e) => {
      const room = roomOf(socket); if (!room || !EMOTES.includes(e)) return;
      const p = room.players && room.players.get && room.players.get(socket.id);
      nsp.to(room.code).emit('grim:emote', { from: p ? p.name : socket.userName, emote: e });
    });

    const salir = () => {
      const i = QUEUE.findIndex(q => q.socketId === socket.id); if (i >= 0) QUEUE.splice(i, 1);
      const room = roomOf(socket); socket.grimCode = null;
      if (!room) return;
      if (room.state === 'waiting') { ROOMS.delete(room.code); return; }
      const p = room.players.get(socket.id); if (!p || room.state === 'ended') return;
      p.disconnected = true;
      feed(room, `⏳ ${p.name} disconnected — 30s to return`);
      emitState(room);
      p.discTimer = setTimeout(() => {
        const opp = room.order.map(id => room.players.get(id)).find(x => x.id !== p.id);
        if (opp) endDuel(room, opp.id, true);
      }, GRACE_MS);
    };
    socket.on('grim:leave', salir);
    socket.on('disconnect', salir);
  });
};
