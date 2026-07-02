const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const ArenaQuestion = require('../models/ArenaQuestion');
const ArenaMatch    = require('../models/ArenaMatch');

// ─── AulaQuest Arena — quiz multijugador en tiempo real (namespace /arena) ───
// Módulo aislado: no toca ninguna ruta ni lógica existente.

const ROOMS = new Map();            // code -> room (en memoria)

const QUESTION_MS  = 15000;         // 15s por pregunta (timer server-side)
const REVEAL_MS    = 8000;          // pausa del centro de aprendizaje entre rondas
const MAX_PLAYERS  = 8;
const NUM_PREGS    = 8;             // preguntas por partida (6-10)
const BASE_PTS     = 100;
const SPEED_PTS    = 100;           // bonus máximo por velocidad
const COLORS = ['#06b6d4','#8b5cf6','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899','#84cc16'];

function genCode() {
  let c;
  do { c = String(Math.floor(1000 + Math.random() * 9000)); } while (ROOMS.has(c));
  return c;
}

function publicPlayers(room) {
  return [...room.players.values()].map(p => ({
    id: p.id, name: p.name, color: p.color, score: p.score,
    streak: p.streak, isHost: p.id === room.hostId,
    answered: room.state === 'question' ? p.answeredIdx !== null : false,
  })).sort((a, b) => b.score - a.score);
}

function clearTimers(room) {
  if (room.timer) { clearTimeout(room.timer); room.timer = null; }
}

module.exports = function initArena(io) {
  const nsp = io.of('/arena');

  // Autenticación: mismo JWT del resto de la app, enviado en el handshake
  nsp.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error('Sin token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name');
      if (!user) return next(new Error('Usuario no encontrado'));
      socket.userId   = String(user._id);
      socket.userName = user.name;
      next();
    } catch (e) { next(new Error('Token invalido')); }
  });

  function roomOf(socket) {
    return socket.arenaCode ? ROOMS.get(socket.arenaCode) : null;
  }

  function currentQ(room) {
    return room.questions[room.qIndex];
  }

  function askQuestion(room) {
    const q = currentQ(room);
    if (!q) return endGame(room);
    room.state = 'question';
    room.qEndsAt = Date.now() + QUESTION_MS;
    for (const p of room.players.values()) { p.answeredIdx = null; p.answerMs = 0; }
    nsp.to(room.code).emit('arena:question', {
      idx: room.qIndex, total: room.questions.length,
      q: q.q, opts: q.opts, icon: q.icon || '',
      endsAt: room.qEndsAt, duration: QUESTION_MS,
      players: publicPlayers(room),
    });
    clearTimers(room);
    room.timer = setTimeout(() => reveal(room), QUESTION_MS + 400);
  }

  function reveal(room) {
    if (room.state !== 'question') return;
    clearTimers(room);
    room.state = 'reveal';
    const q = currentQ(room);

    // Votos por opción (para "Ayuda del grupo" y estadística de la ronda)
    const votes = [0, 0, 0, 0];
    let respondieron = 0;
    for (const p of room.players.values()) {
      if (p.answeredIdx !== null && p.answeredIdx >= 0 && p.answeredIdx < 4) { votes[p.answeredIdx]++; respondieron++; }
    }
    const votesPct = votes.map(v => respondieron ? Math.round((v / respondieron) * 100) : 0);

    // Puntos: base + bonus velocidad; racha de 3+ correctas => x2
    const resultados = [];
    for (const p of room.players.values()) {
      const correcto = p.answeredIdx === q.ans;
      let delta = 0;
      if (correcto) {
        p.streak++;
        const restante = Math.max(0, QUESTION_MS - p.answerMs);
        const bonus = Math.round(SPEED_PTS * (restante / QUESTION_MS));
        delta = (BASE_PTS + bonus) * (p.streak >= 3 ? 2 : 1);
        p.score += delta;
      } else {
        p.streak = 0;
      }
      resultados.push({ id: p.id, name: p.name, color: p.color, correcto, delta, score: p.score, streak: p.streak, eligio: p.answeredIdx });
    }
    resultados.sort((a, b) => b.score - a.score);

    nsp.to(room.code).emit('arena:reveal', {
      ans: q.ans, votes: votesPct, learn: q.learn || null,
      resultados, esUltima: room.qIndex >= room.questions.length - 1,
    });

    room.qIndex++;
    room.timer = setTimeout(() => {
      if (room.qIndex >= room.questions.length) endGame(room);
      else askQuestion(room);
    }, REVEAL_MS);
  }

  async function endGame(room) {
    clearTimers(room);
    room.state = 'end';
    const podium = publicPlayers(room);

    // Guardar la partida para el leaderboard global (no bloquea el fin de juego)
    try {
      await ArenaMatch.create({
        code: room.code, nivel: 'A1',
        players: [...room.players.values()].map(p => ({ userId: p.userId, name: p.name, score: p.score })),
        winnerName: podium[0] ? podium[0].name : '',
      });
    } catch (e) { console.error('Arena save error:', e.message); }

    // Top 10 global: mejores puntajes individuales por partida
    let leaderboard = [];
    try {
      leaderboard = await ArenaMatch.aggregate([
        { $unwind: '$players' },
        { $sort: { 'players.score': -1 } },
        { $limit: 10 },
        { $project: { _id: 0, name: '$players.name', score: '$players.score', fecha: '$createdAt' } },
      ]);
    } catch (e) { console.error('Arena leaderboard error:', e.message); }

    const words = room.questions.map(q => q.learn && q.learn.word ? q.learn : null).filter(Boolean);
    nsp.to(room.code).emit('arena:end', { podium, words, leaderboard });
    ROOMS.delete(room.code);
  }

  function leaveRoom(socket) {
    const room = roomOf(socket);
    socket.arenaCode = null;
    if (!room) return;
    room.players.delete(socket.id);
    socket.leave(room.code);
    if (room.players.size === 0) { clearTimers(room); ROOMS.delete(room.code); return; }
    // Si se fue el host, pasa al primero que quede
    if (room.hostId === socket.id) room.hostId = room.players.keys().next().value;
    nsp.to(room.code).emit('arena:players', publicPlayers(room));
    // Si en plena pregunta ya respondieron todos los que quedan, revelar ya
    if (room.state === 'question') {
      const todos = [...room.players.values()].every(p => p.answeredIdx !== null);
      if (todos) reveal(room);
    }
  }

  nsp.on('connection', (socket) => {

    socket.on('arena:create', (cb) => {
      if (typeof cb !== 'function') return;
      leaveRoom(socket);
      const code = genCode();
      const room = {
        code, hostId: socket.id, state: 'lobby',
        players: new Map(), questions: [], qIndex: 0, qEndsAt: 0, timer: null,
      };
      room.players.set(socket.id, {
        id: socket.id, userId: socket.userId, name: socket.userName,
        color: COLORS[0], score: 0, streak: 0, answeredIdx: null, answerMs: 0,
        usedFifty: false, usedHint: false, usedVotes: false,
      });
      ROOMS.set(code, room);
      socket.arenaCode = code;
      socket.join(code);
      cb({ ok: true, code, players: publicPlayers(room) });
    });

    socket.on('arena:join', (data, cb) => {
      if (typeof cb !== 'function') return;
      const code = String((data && data.code) || '').trim();
      const room = ROOMS.get(code);
      if (!room) return cb({ ok: false, error: 'Sala no encontrada. Revisa el código.' });
      if (room.state !== 'lobby') return cb({ ok: false, error: 'La partida ya empezó.' });
      if (room.players.size >= MAX_PLAYERS) return cb({ ok: false, error: 'Sala llena (máx. 8).' });
      leaveRoom(socket);
      room.players.set(socket.id, {
        id: socket.id, userId: socket.userId, name: socket.userName,
        color: COLORS[room.players.size % COLORS.length], score: 0, streak: 0,
        answeredIdx: null, answerMs: 0, usedFifty: false, usedHint: false, usedVotes: false,
      });
      socket.arenaCode = code;
      socket.join(code);
      nsp.to(code).emit('arena:players', publicPlayers(room));
      cb({ ok: true, code, players: publicPlayers(room) });
    });

    socket.on('arena:start', async () => {
      const room = roomOf(socket);
      if (!room || room.hostId !== socket.id || room.state !== 'lobby') return;
      try {
        room.questions = await ArenaQuestion.aggregate([{ $match: { nivel: 'A1' } }, { $sample: { size: NUM_PREGS } }]);
      } catch (e) { room.questions = []; }
      if (!room.questions.length) {
        nsp.to(room.code).emit('arena:error', 'No hay preguntas disponibles. Intenta más tarde.');
        return;
      }
      room.qIndex = 0;
      nsp.to(room.code).emit('arena:starting', { enSegundos: 3 });
      clearTimers(room);
      room.state = 'starting';
      room.timer = setTimeout(() => askQuestion(room), 3000);
    });

    socket.on('arena:answer', (data, cb) => {
      const room = roomOf(socket);
      if (!room || room.state !== 'question') return;
      const p = room.players.get(socket.id);
      if (!p || p.answeredIdx !== null) return;
      const opt = Number(data && data.opt);
      if (!(opt >= 0 && opt <= 3)) return;
      if (Date.now() > room.qEndsAt + 300) return;   // llegó tarde
      p.answeredIdx = opt;
      p.answerMs = Math.min(QUESTION_MS, QUESTION_MS - (room.qEndsAt - Date.now()));
      if (typeof cb === 'function') cb({ ok: true });
      nsp.to(room.code).emit('arena:answered', { id: p.id });
      const todos = [...room.players.values()].every(pl => pl.answeredIdx !== null);
      if (todos) reveal(room);
    });

    // ── Comodines (uno de cada tipo por partida) ──
    socket.on('arena:fifty', (cb) => {
      if (typeof cb !== 'function') return;
      const room = roomOf(socket);
      if (!room || room.state !== 'question') return cb({ ok: false });
      const p = room.players.get(socket.id);
      if (!p || p.usedFifty) return cb({ ok: false, error: 'Ya usaste el 50/50.' });
      p.usedFifty = true;
      const q = currentQ(room);
      const malas = [0, 1, 2, 3].filter(i => i !== q.ans);
      // ocultar 2 incorrectas al azar
      malas.sort(() => Math.random() - 0.5);
      cb({ ok: true, ocultar: malas.slice(0, 2) });
    });

    socket.on('arena:hint', (cb) => {
      if (typeof cb !== 'function') return;
      const room = roomOf(socket);
      if (!room || room.state !== 'question') return cb({ ok: false });
      const p = room.players.get(socket.id);
      if (!p || p.usedHint) return cb({ ok: false, error: 'Ya usaste la pista.' });
      p.usedHint = true;
      const q = currentQ(room);
      const correcta = q.opts[q.ans] || '';
      const pista = 'Empieza con "' + correcta.charAt(0).toUpperCase() + '" y tiene ' + correcta.length + ' letras.';
      cb({ ok: true, pista });
    });

    socket.on('arena:votes', (cb) => {
      if (typeof cb !== 'function') return;
      const room = roomOf(socket);
      if (!room || room.state !== 'question') return cb({ ok: false });
      const p = room.players.get(socket.id);
      if (!p || p.usedVotes) return cb({ ok: false, error: 'Ya usaste la ayuda del grupo.' });
      p.usedVotes = true;
      const votes = [0, 0, 0, 0];
      let n = 0;
      for (const pl of room.players.values()) {
        if (pl.id !== p.id && pl.answeredIdx !== null) { votes[pl.answeredIdx]++; n++; }
      }
      cb({ ok: true, votes: votes.map(v => n ? Math.round((v / n) * 100) : 0), respuestas: n });
    });

    // Reacciones de ánimo — todos las ven en vivo
    socket.on('arena:react', (emoji) => {
      const room = roomOf(socket);
      if (!room) return;
      const ok = ['👏','🔥','😂','💪','🎉','😱'];
      if (!ok.includes(emoji)) return;
      const p = room.players.get(socket.id);
      nsp.to(room.code).emit('arena:react', { name: p ? p.name : '?', color: p ? p.color : '#06b6d4', emoji });
    });

    socket.on('arena:leave', () => leaveRoom(socket));
    socket.on('disconnect',  () => leaveRoom(socket));
  });
};
