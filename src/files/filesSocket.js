const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const FilesCase  = require('../models/FilesCase');
const FilesMatch = require('../models/FilesMatch');

// ─── AulaQuest Files — eventos de detectives en tiempo real (namespace /files) ───
// Salas de EVENTO en memoria (como Arena): código de 4 dígitos, 1-50 jugadores,
// auto-reparto en escuadras de 4-5 y fases sincronizadas por el servidor.
// Guion fijo desde MongoDB (FilesCase); el resultado se guarda en FilesMatch.

const ROOMS = new Map();
const MAX_PLAYERS = 50;

// Duraciones de fase (segundos) — el anfitrión puede saltar con files:next
const FASES = ['briefing', 'investigation', 'deliberation', 'verdict', 'reveal'];
const DURACION = { briefing: 180, investigation: 600, deliberation: 300, verdict: 120 };

const SQUAD_NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliett'];
const ROLES = ['Lead Detective', 'Interviewer', 'Forensics', 'Archivist', 'Profiler'];
const NPCS  = ['Det. Holmes', 'Det. Rivera', 'Det. Chen'];

function genCode() {
  let c;
  do { c = String(Math.floor(1000 + Math.random() * 9000)); } while (ROOMS.has(c));
  return c;
}

// El caso que ve el cliente: sin culpable, sin teoría correcta, sin contradicción
function casoPublico(caso) {
  const c = caso.toObject ? caso.toObject() : caso;
  return {
    numero: c.numero, titulo: c.titulo, tituloEs: c.tituloEs,
    tutorial: c.tutorial, cinematica: c.cinematica,
    mapa: c.mapa, timeline: c.timeline, sospechosos: c.sospechosos,
    teorias: c.teorias,
  };
}

function roster(room) {
  return [...room.players.values()].map(p => ({
    id: p.id, name: p.name, squad: p.squad, rol: p.rol, puntos: p.puntos,
    isHost: p.id === room.hostId, npc: !!p.npc,
  }));
}

function clearTimer(room) { if (room.timer) { clearTimeout(room.timer); room.timer = null; } }

module.exports = function initFiles(io) {
  const nsp = io.of('/files');

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

  function roomOf(socket) { return socket.filesCode ? ROOMS.get(socket.filesCode) : null; }

  function armarEscuadras(room) {
    const reales = [...room.players.values()].filter(p => !p.npc);
    const orden = [...reales].sort(() => Math.random() - 0.5);
    const nSquads = Math.max(1, Math.ceil(orden.length / 5));
    room.squads = new Map();
    for (let i = 0; i < nSquads; i++) {
      const id = 'sq' + i;
      room.squads.set(id, { id, nombre: 'Squad ' + SQUAD_NAMES[i % SQUAD_NAMES.length], evidencias: [], veredicto: { sospechoso: '', teoria: -1 }, bonus: 0 });
    }
    orden.forEach((p, i) => {
      const sqId = 'sq' + (i % nSquads);
      p.squad = sqId;
      p.rol = ROLES[Math.floor(i / nSquads) % ROLES.length];
      const s = nsp.sockets.get(p.id);
      if (s) s.join(room.code + ':' + sqId);
    });
    // Modo solo: compañeros NPC cubren los otros roles de la escuadra
    if (room.solo) {
      NPCS.forEach((n, i) => {
        room.players.set('npc' + i, { id: 'npc' + i, userId: null, name: n, squad: 'sq0', rol: ROLES[i + 1], puntos: 0, clues: new Set(), npc: true });
      });
    }
  }

  function setFase(room, fase) {
    clearTimer(room);
    room.state = fase;
    const dur = DURACION[fase] || 0;
    room.endsAt = dur ? Date.now() + dur * 1000 : 0;
    const payload = { fase, endsAt: room.endsAt, duracion: dur, players: roster(room) };
    if (fase === 'briefing') payload.caso = casoPublico(room.caso);
    nsp.to(room.code).emit('files:phase', payload);

    if (fase === 'investigation' && room.solo) programarNPCs(room);
    if (fase === 'reveal') { finalizar(room); return; }
    if (dur) {
      const idx = FASES.indexOf(fase);
      room.timer = setTimeout(() => {
        const sig = FASES[idx + 1];
        if (sig) setFase(room, sig);
      }, dur * 1000 + 400);
    }
  }

  // NPCs del modo solo: aportan 2 pistas al tablero durante la investigación
  function programarNPCs(room) {
    const drops = [
      { delay: 25000, npc: NPCS[0], sId: 'marcus', step: 1 },
      { delay: 55000, npc: NPCS[1], sId: 'elena',  step: 1 },
    ];
    drops.forEach(d => {
      setTimeout(() => {
        if (!ROOMS.has(room.code) || room.state !== 'investigation') return;
        agregarEvidencia(room, 'sq0', d.sId, d.step, d.npc);
      }, d.delay);
    });
  }

  function pasoDe(room, sId, step) {
    const sosp = room.caso.sospechosos.find(s => s.id === sId);
    return sosp ? sosp.interrogatorio[step] : null;
  }

  function agregarEvidencia(room, sqId, sId, step, porNombre) {
    const squad = room.squads.get(sqId);
    const paso = pasoDe(room, sId, step);
    if (!squad || !paso || !paso.clue || !paso.clue.en) return null;
    const key = sId + ':' + step;
    if (squad.evidencias.some(e => e.key === key)) return null;
    const sosp = room.caso.sospechosos.find(s => s.id === sId);
    const ev = {
      key, sId, step,
      texto: paso.clue.en, textoEs: paso.clue.es,
      sospechoso: sosp.nombre, color: sosp.color,
      por: porNombre,
      rs: (paso.rsOpts || []).length > 0, rsOpts: paso.rsOpts || [], archivada: (paso.rsOpts || []).length === 0,
    };
    squad.evidencias.push(ev);
    nsp.to(room.code + ':' + sqId).emit('files:evidence', ev);
    return ev;
  }

  async function finalizar(room) {
    clearTimer(room);
    const culpable = room.caso.culpable;
    const teoriaOk = room.caso.teoriaCorrecta;

    const squadsRes = [...room.squads.values()].map(sq => {
      const base = [...room.players.values()].filter(p => p.squad === sq.id).reduce((a, p) => a + p.puntos, 0);
      const acerto = sq.veredicto.sospechoso === culpable;
      const teoria = sq.veredicto.teoria === teoriaOk;
      const puntos = base + (acerto ? 100 : 0) + (teoria ? 60 : 0) + sq.evidencias.filter(e => e.archivada).length * 5;
      return { id: sq.id, nombre: sq.nombre, puntos, acerto, teoriaOk: teoria, evidencias: sq.evidencias.length, veredicto: sq.veredicto };
    }).sort((a, b) => b.puntos - a.puntos);

    const jugadores = [...room.players.values()].filter(p => !p.npc).sort((a, b) => b.puntos - a.puntos);
    const mvp = jugadores[0] || null;

    try {
      await FilesMatch.create({
        code: room.code, caso: room.caso.numero, solo: room.solo,
        squads: squadsRes.map(s => ({ nombre: s.nombre, puntos: s.puntos, acerto: s.acerto, teoriaOk: s.teoriaOk })),
        players: jugadores.map(p => ({ userId: p.userId, name: p.name, squad: (room.squads.get(p.squad) || {}).nombre || '', rol: p.rol, puntos: p.puntos, mvp: mvp && p.id === mvp.id })),
      });
    } catch (e) { console.error('Files save error:', e.message); }

    const sospCulpable = room.caso.sospechosos.find(s => s.id === culpable);
    nsp.to(room.code).emit('files:reveal', {
      culpable, culpableNombre: sospCulpable ? sospCulpable.nombre : culpable,
      teoriaCorrecta: teoriaOk,
      contradiccion: room.caso.contradiccion,
      podium: squadsRes,
      mvp: mvp ? { name: mvp.name, puntos: mvp.puntos, rol: mvp.rol } : null,
      players: roster(room),
    });
    ROOMS.delete(room.code);
  }

  function leaveRoom(socket) {
    const room = roomOf(socket);
    socket.filesCode = null;
    if (!room) return;
    room.players.delete(socket.id);
    socket.leave(room.code);
    const reales = [...room.players.values()].filter(p => !p.npc);
    if (reales.length === 0) { clearTimer(room); ROOMS.delete(room.code); return; }
    if (room.hostId === socket.id) room.hostId = reales[0].id;
    nsp.to(room.code).emit('files:players', roster(room));
  }

  nsp.on('connection', (socket) => {

    const crearSala = (solo, cb) => {
      leaveRoom(socket);
      const code = genCode();
      const room = { code, hostId: socket.id, solo, state: 'lobby', endsAt: 0, timer: null, caso: null, players: new Map(), squads: new Map() };
      room.players.set(socket.id, { id: socket.id, userId: socket.userId, name: socket.userName, squad: '', rol: '', puntos: 0, clues: new Set(), npc: false });
      ROOMS.set(code, room);
      socket.filesCode = code;
      socket.join(code);
      cb({ ok: true, code, players: roster(room) });
    };

    socket.on('files:create', (cb) => { if (typeof cb === 'function') crearSala(false, cb); });
    socket.on('files:solo',   (cb) => { if (typeof cb === 'function') crearSala(true, cb); });

    socket.on('files:join', (data, cb) => {
      if (typeof cb !== 'function') return;
      const code = String((data && data.code) || '').trim();
      const room = ROOMS.get(code);
      if (!room) return cb({ ok: false, error: 'Event not found. Check the code. / Evento no encontrado.' });
      if (room.state !== 'lobby') return cb({ ok: false, error: 'The event already started. / El evento ya empezó.' });
      if (room.solo) return cb({ ok: false, error: 'That is a solo game. / Esa es una partida individual.' });
      if (room.players.size >= MAX_PLAYERS) return cb({ ok: false, error: 'Event full (max 50). / Evento lleno.' });
      leaveRoom(socket);
      room.players.set(socket.id, { id: socket.id, userId: socket.userId, name: socket.userName, squad: '', rol: '', puntos: 0, clues: new Set(), npc: false });
      socket.filesCode = code;
      socket.join(code);
      nsp.to(code).emit('files:players', roster(room));
      cb({ ok: true, code, players: roster(room) });
    });

    socket.on('files:start', async () => {
      const room = roomOf(socket);
      if (!room || room.hostId !== socket.id || room.state !== 'lobby') return;
      try { room.caso = await FilesCase.findOne({ numero: 7, activo: true }); } catch (e) {}
      if (!room.caso) { nsp.to(room.code).emit('files:error', 'Case not available. / Caso no disponible.'); return; }
      armarEscuadras(room);
      setFase(room, 'briefing');
    });

    // El anfitrión puede adelantar la fase (útil si todos terminaron antes)
    socket.on('files:next', () => {
      const room = roomOf(socket);
      if (!room || room.hostId !== socket.id) return;
      const idx = FASES.indexOf(room.state);
      if (idx >= 0 && idx < FASES.length - 1) setFase(room, FASES[idx + 1]);
    });

    // Pregunta correcta en el interrogatorio → pista al tablero del escuadrón
    socket.on('files:clue', (data, cb) => {
      const room = roomOf(socket);
      if (!room || room.state !== 'investigation') return typeof cb === 'function' && cb({ ok: false });
      const p = room.players.get(socket.id);
      const paso = pasoDe(room, data && data.sId, Number(data && data.step));
      if (!p || !paso) return typeof cb === 'function' && cb({ ok: false });
      const key = data.sId + ':' + data.step;
      if (!p.clues.has(key)) {
        p.clues.add(key);
        p.puntos += 15 + (data.firstTry ? 10 : 0);   // pista + bonus por gramática a la primera
      }
      agregarEvidencia(room, p.squad, data.sId, Number(data.step), p.name);
      nsp.to(room.code).emit('files:players', roster(room));
      if (typeof cb === 'function') cb({ ok: true, puntos: p.puntos });
    });

    // Deliberación: archivar evidencia con reported speech correcto
    socket.on('files:rs', (data, cb) => {
      if (typeof cb !== 'function') return;
      const room = roomOf(socket);
      if (!room || room.state !== 'deliberation') return cb({ ok: false });
      const p = room.players.get(socket.id);
      const squad = p && room.squads.get(p.squad);
      const ev = squad && squad.evidencias.find(e => e.key === (data && data.key));
      const paso = ev && pasoDe(room, ev.sId, ev.step);
      if (!ev || !paso) return cb({ ok: false });
      if (ev.archivada) return cb({ ok: true, ya: true });
      if (Number(data.opt) === paso.rsAns) {
        ev.archivada = true;
        p.puntos += 10;
        nsp.to(room.code + ':' + p.squad).emit('files:evidence-update', { key: ev.key, archivada: true, por: p.name });
        nsp.to(room.code).emit('files:players', roster(room));
        return cb({ ok: true });
      }
      return cb({ ok: false, feedback: paso.rsFeedback });
    });

    // Veredicto del escuadrón (cualquier miembro puede ajustarlo; se comparte en vivo)
    socket.on('files:verdict', (data) => {
      const room = roomOf(socket);
      if (!room || room.state !== 'verdict') return;
      const p = room.players.get(socket.id);
      const squad = p && room.squads.get(p.squad);
      if (!squad) return;
      if (data && typeof data.sospechoso === 'string') squad.veredicto.sospechoso = data.sospechoso;
      if (data && data.teoria !== undefined) squad.veredicto.teoria = Number(data.teoria);
      nsp.to(room.code + ':' + p.squad).emit('files:verdict', { ...squad.veredicto, por: p.name });
    });

    socket.on('files:leave', () => leaveRoom(socket));
    socket.on('disconnect',  () => leaveRoom(socket));
  });
};
