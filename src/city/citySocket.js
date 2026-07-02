const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const CityTeam     = require('../models/CityTeam');
const CityMission  = require('../models/CityMission');
const CityProgress = require('../models/CityProgress');

// ─── AulaQuest City — tiempo real (namespace /city) ───
// Reutiliza el mismo patrón de Arena (JWT en el handshake), pero los equipos
// son PERSISTENTES: viven en MongoDB y aquí solo se transmiten los cambios
// (cartas nuevas, feed, SOS, puntos, desbloqueos) a los miembros conectados.

// Día en hora de Colombia (UTC-5) para la meta diaria y la racha
function hoyCo()  { return new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10); }
function ayerCo() { return new Date(Date.now() - 5 * 3600e3 - 86400e3).toISOString().slice(0, 10); }

function feedPush(team, tipo, texto, name) {
  team.feed.push({ tipo, texto, name, fecha: new Date() });
  if (team.feed.length > 60) team.feed = team.feed.slice(-60);
}

module.exports = function initCity(io) {
  const nsp = io.of('/city');

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

  async function joinTeamRoom(socket) {
    try {
      const team = await CityTeam.findOne({ 'miembros.userId': socket.userId });
      if (team) { socket.teamId = String(team._id); socket.join('team:' + socket.teamId); }
      else { socket.teamId = null; }
    } catch (e) {}
  }

  nsp.on('connection', (socket) => {
    // Los listeners se registran YA (sin await antes): un evento que llegue
    // en los primeros milisegundos no se puede perder. La sala del equipo se
    // resuelve en segundo plano y cada handler la garantiza con ensureRoom.
    joinTeamRoom(socket);
    const ensureRoom = async () => { if (socket.teamId == null) await joinTeamRoom(socket); };

    // Se llama tras crear/unirse a un equipo por REST, para entrar a la sala en vivo
    socket.on('city:room', async (cb) => {
      await joinTeamRoom(socket);
      if (typeof cb === 'function') cb({ ok: true, enEquipo: !!socket.teamId });
    });

    // ── Paso completado: XP personal + carta al diccionario compartido en vivo ──
    socket.on('city:step', async (data, cb) => {
      try {
        await ensureRoom();
        const mision = await CityMission.findById(data && data.misionId);
        const paso = mision && mision.pasos[Number(data.stepIndex)];
        if (!paso) return typeof cb === 'function' && cb({ ok: false });
        const esTeach = paso.type === 'teach';
        const xp = esTeach ? (mision.xpTeach || 25) : (mision.xpPaso || 15);

        const prog = await CityProgress.findOneAndUpdate(
          { userId: socket.userId }, { $inc: { xp } }, { new: true, upsert: true, setDefaultsOnInsert: true });

        const team = socket.teamId ? await CityTeam.findById(socket.teamId) : null;
        if (team) {
          let cambio = false;
          if (esTeach) { team.puntos += 10; cambio = true; }   // bonus: enseñaste la palabra de un compañero
          if (paso.card && paso.card.en && !team.diccionario.some(c => c.en === paso.card.en)) {
            const carta = { en: paso.card.en, es: paso.card.es, aportadaPor: socket.userName, userId: socket.userId, fecha: new Date() };
            team.diccionario.push(carta);
            feedPush(team, 'card', 'unlocked "' + paso.card.en + '" for the team', socket.userName);
            cambio = true;
            await CityProgress.updateOne({ userId: socket.userId }, { $inc: { cartasAportadas: 1 } });
            nsp.to('team:' + socket.teamId).emit('city:card', carta);
          }
          if (cambio) {
            await team.save();
            nsp.to('team:' + socket.teamId).emit('city:points', { puntos: team.puntos });
            nsp.to('team:' + socket.teamId).emit('city:feed', team.feed.slice(-15));
          }
        }
        if (typeof cb === 'function') cb({ ok: true, xp, xpTotal: prog.xp });
      } catch (e) { if (typeof cb === 'function') cb({ ok: false, error: e.message }); }
    });

    // ── Misión completada: meta diaria, racha y progreso/desbloqueos del equipo ──
    socket.on('city:mission-done', async (data, cb) => {
      try {
        await ensureRoom();
        const mision = await CityMission.findById(data && data.misionId);
        if (!mision) return typeof cb === 'function' && cb({ ok: false });

        const hoy = hoyCo();
        let prog = await CityProgress.findOne({ userId: socket.userId });
        if (!prog) prog = new CityProgress({ userId: socket.userId });
        if (prog.fechaHoy !== hoy) { prog.fechaHoy = hoy; prog.misionesHoy = 0; }
        prog.misionesHoy++;
        let metaCumplida = false;
        if (prog.misionesHoy >= 3 && prog.ultimoDiaMeta !== hoy) {
          prog.racha = (prog.ultimoDiaMeta === ayerCo()) ? prog.racha + 1 : 1;
          prog.ultimoDiaMeta = hoy;
          metaCumplida = true;
        }
        if (!prog.misionesCompletadas.some(m => String(m.misionId) === String(mision._id))) {
          prog.misionesCompletadas.push({ distrito: mision.distrito, misionId: mision._id });
        }
        await prog.save();

        let desbloqueo = null;
        const team = socket.teamId ? await CityTeam.findById(socket.teamId) : null;
        if (team) {
          if (!team.misionesCompletadas.some(m => String(m.misionId) === String(mision._id))) {
            team.misionesCompletadas.push({ distrito: mision.distrito, misionId: mision._id, porUserId: socket.userId, porName: socket.userName });
            team.puntos += 5;
          }
          feedPush(team, 'mission', 'completed "' + mision.titulo + '"', socket.userName);

          // ¿El equipo completó todas las misiones del distrito?
          if (!team.distritosCompletados.includes(mision.distrito)) {
            const total  = await CityMission.countDocuments({ distrito: mision.distrito });
            const hechas = new Set(team.misionesCompletadas.filter(m => m.distrito === mision.distrito).map(m => String(m.misionId))).size;
            if (total > 0 && hechas >= total) {
              team.distritosCompletados.push(mision.distrito);
              feedPush(team, 'unlock', 'District completed: ' + mision.distrito + ' 🎉', socket.userName);
              desbloqueo = { distrito: mision.distrito, completados: team.distritosCompletados };
            }
          }
          await team.save();
          nsp.to('team:' + socket.teamId).emit('city:points', { puntos: team.puntos });
          nsp.to('team:' + socket.teamId).emit('city:feed', team.feed.slice(-15));
          if (desbloqueo) nsp.to('team:' + socket.teamId).emit('city:unlock', desbloqueo);
        }
        if (typeof cb === 'function') cb({ ok: true, misionesHoy: prog.misionesHoy, racha: prog.racha, metaCumplida, xpTotal: prog.xp });
      } catch (e) { if (typeof cb === 'function') cb({ ok: false, error: e.message }); }
    });

    // ── SOS: pedir ayuda a los compañeros online ──
    socket.on('city:sos', async (data) => {
      await ensureRoom();
      if (!socket.teamId) return;
      socket.to('team:' + socket.teamId).emit('city:sos', {
        name: socket.userName,
        mision: String((data && data.titulo) || '').slice(0, 80),
      });
    });

    // ── Mandar una pista: ambos ganan puntos de equipo (+20 en total) ──
    socket.on('city:hint', async (data) => {
      await ensureRoom();
      if (!socket.teamId) return;
      const pista = String((data && data.pista) || '').trim().slice(0, 200);
      if (!pista) return;
      nsp.to('team:' + socket.teamId).emit('city:hint', { from: socket.userName, pista });
      try {
        const team = await CityTeam.findById(socket.teamId);
        if (team) {
          team.puntos += 20;
          feedPush(team, 'sos', 'sent a hint to a teammate (+20 team pts)', socket.userName);
          await team.save();
          nsp.to('team:' + socket.teamId).emit('city:points', { puntos: team.puntos });
          nsp.to('team:' + socket.teamId).emit('city:feed', team.feed.slice(-15));
        }
      } catch (e) {}
    });
  });
};
