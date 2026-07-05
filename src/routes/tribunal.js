const router = require('express').Router();
const auth   = require('../middleware/auth');
const TribunalCase    = require('../models/TribunalCase');
const TribunalMandate = require('../models/TribunalMandate');
const TribunalMatch   = require('../models/TribunalMatch');
const TribunalRound   = require('../models/TribunalRound');
const TribunalStats   = require('../models/TribunalStats');

// ─── El Tribunal (C2) — API REST (Fase 1 MVP: solo texto, pool fijo, polling) ───
const DEVICES = ['hedging','litotes','irony','euphemism','hyperbole','rhetorical_question','nominalization'];
const clamp = (n) => Math.max(0, Math.min(100, n));
const uid = (x) => String(x || '');
function genCode() { return String(Math.floor(1000 + Math.random() * 9000)); }
function rankOf(avg, rol) {
  if (avg >= 80) return 'Archon de la Retórica';
  if (avg >= 65) return 'Pluma de Plata';
  if (avg >= 50) return 'Voz Consistente';
  if (avg >= 35) return rol === 'advocate' ? 'Aprendiz de la Corte' : 'Jurado Perspicaz';
  return 'Oyente Novato';
}
function calibrationScore(jurorComposite, magistrateConfidence) {
  const gap = Math.abs(jurorComposite - magistrateConfidence);
  return Math.max(0, 100 - gap * 2);
}

// ── El Magistrado (LLM, server-side; el cliente nunca ve la respuesta antes del veredicto) ──
async function magistrate(mandate, transcript, q, a) {
  const KEY = process.env.OPENAI_API_KEY;
  if (KEY) {
    try {
      const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 22000);
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini', temperature: 0.2, response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content:
`You are "The Magistrate", an impartial and precise judge of rhetorical skill in a C2-level English language game. You will receive: (1) a secret mandate the Advocate was given, (2) the Advocate's actual written argument, (3) a cross-examination Q&A.
Score strictly and return ONLY valid JSON with this schema:
{ "actualDevicesUsed": ["hedging", ...], "mandateFidelity": 0-100, "bluffWasPresent": true/false, "bluffExecutionScore": 0-100, "registerBreakOccurred": true/false, "registerConsistencyScore": 0-100, "crossExamComposureScore": 0-100, "magistrateConfidence": 0-100, "shortRationale": "max 2 sentences, plain English, for the player" }
Devices are limited to: hedging, litotes, irony, euphemism, hyperbole, rhetorical_question, nominalization. magistrateConfidence reflects how difficult THIS round was to judge correctly. Be consistent: identical linguistic patterns should always map to the same device labels.` },
            { role: 'user', content:
`SECRET MANDATE: required devices = ${JSON.stringify(mandate.requiredDevices)}; target register = ${mandate.registerTarget}; a bluff was required = ${mandate.requiresBluff}${mandate.requiresBluff ? '; bluff instruction = ' + mandate.bluffInstruction : ''}.
ADVOCATE ARGUMENT: """${transcript}"""
CROSS-EXAM QUESTION: """${q || '(none)'}"""
CROSS-EXAM ANSWER: """${a || '(none)'}"""` },
          ],
        }),
      });
      clearTimeout(to);
      if (r.ok) {
        const d = await r.json();
        const j = JSON.parse(d.choices[0].message.content);
        return {
          actualDevicesUsed: Array.isArray(j.actualDevicesUsed) ? j.actualDevicesUsed.filter(x => DEVICES.includes(x)) : [],
          mandateFidelity: clamp(Number(j.mandateFidelity)||0),
          bluffWasPresent: !!j.bluffWasPresent,
          bluffExecutionScore: clamp(Number(j.bluffExecutionScore)||0),
          registerBreakOccurred: !!j.registerBreakOccurred,
          registerConsistencyScore: clamp(Number(j.registerConsistencyScore)||0),
          crossExamComposureScore: clamp(Number(j.crossExamComposureScore)||0),
          magistrateConfidence: clamp(Number(j.magistrateConfidence)||50),
          shortRationale: String(j.shortRationale || '').slice(0, 240),
          rawLLMResponse: j,
        };
      }
    } catch (e) {}
  }
  // Fallback heurístico (si no hay IA): estima con base en el mandato y el largo del texto
  const txt = (transcript || '').toLowerCase();
  const used = (mandate.requiredDevices || []).filter(() => txt.length > 40);
  const len = Math.min(100, 40 + Math.floor((transcript || '').length / 4));
  return {
    actualDevicesUsed: used,
    mandateFidelity: clamp(len),
    bluffWasPresent: !!mandate.requiresBluff,
    bluffExecutionScore: clamp(len - 10),
    registerBreakOccurred: false,
    registerConsistencyScore: clamp(len),
    crossExamComposureScore: clamp((a || '').length > 20 ? len : 45),
    magistrateConfidence: 50,
    shortRationale: 'Evaluación automática (sin IA disponible).',
    rawLLMResponse: null,
  };
}

// ── Crear partida ──
router.post('/match', auth, async function(req, res) {
  try {
    let code; do { code = genCode(); } while (await TribunalMatch.findOne({ roomCode: code }));
    const match = await TribunalMatch.create({
      roomCode: code, status: 'lobby', hostUserId: req.user._id,
      players: [{ userId: req.user._id, displayName: req.user.name, role: 'jury' }],
    });
    return res.json({ ok: true, code, matchId: match._id });
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

// ── Unirse ──
router.post('/match/:code/join', auth, async function(req, res) {
  try {
    const match = await TribunalMatch.findOne({ roomCode: req.params.code });
    if (!match) return res.status(404).json({ msg: 'Sala no encontrada' });
    if (match.status !== 'lobby') return res.status(400).json({ msg: 'La partida ya empezó' });
    if (match.players.length >= 4) return res.status(400).json({ msg: 'Sala llena (máx. 4)' });
    if (!match.players.some(p => uid(p.userId) === uid(req.user._id)))
      match.players.push({ userId: req.user._id, displayName: req.user.name, role: 'jury' });
    await match.save();
    return res.json({ ok: true, matchId: match._id });
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

// ── Estado de la sala (polling del lobby) ──
router.get('/match/:code', auth, async function(req, res) {
  try {
    const match = await TribunalMatch.findOne({ roomCode: req.params.code }).lean();
    if (!match) return res.status(404).json({ msg: 'Sala no encontrada' });
    const currentRoundId = match.rounds && match.rounds.length ? match.rounds[match.rounds.length - 1] : null;
    return res.json({
      matchId: match._id, code: match.roomCode, status: match.status,
      hostUserId: match.hostUserId, currentRoundIndex: match.currentRoundIndex, totalRounds: match.totalRounds,
      players: match.players.map(p => ({ userId: p.userId, name: p.displayName, ethos: p.ethos, pathos: p.pathos, logos: p.logos })),
      currentRoundId,
    });
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

// ── Iniciar ronda (host) ──
router.post('/match/:id/start-round', auth, async function(req, res) {
  try {
    const match = await TribunalMatch.findById(req.params.id);
    if (!match) return res.status(404).json({ msg: 'Partida no encontrada' });
    if (uid(match.hostUserId) !== uid(req.user._id)) return res.status(403).json({ msg: 'Solo el anfitrión inicia rondas' });
    if (match.players.length < 2) return res.status(400).json({ msg: 'Se necesitan al menos 2 jugadores' });
    if (match.status === 'finished') return res.status(400).json({ msg: 'La partida terminó' });
    if (match.totalRounds === 0) match.totalRounds = match.players.length;
    if (match.currentRoundIndex >= match.totalRounds) return res.status(400).json({ msg: 'No quedan rondas' });

    // Advocate rota (round-robin); cross_examiner = siguiente jugador
    const idx = match.currentRoundIndex;
    const advocate = match.players[idx % match.players.length];
    const crossEx  = match.players[(idx + 1) % match.players.length];
    match.players.forEach(p => { p.role = uid(p.userId) === uid(advocate.userId) ? 'advocate' : (uid(p.userId) === uid(crossEx.userId) ? 'cross_examiner' : 'jury'); });

    // Caso+Mandato del pool fijo, evitando repetir en esta partida
    const usados = (await TribunalRound.find({ matchId: match._id }).select('caseId').lean()).map(r => uid(r.caseId));
    const casos = await TribunalCase.find({}).lean();
    const dispon = casos.filter(c => !usados.includes(uid(c._id)));
    const caso = (dispon.length ? dispon : casos)[Math.floor(Math.random() * (dispon.length ? dispon.length : casos.length))];
    const mandate = await TribunalMandate.findOne({ caseId: caso._id }).lean();

    const round = await TribunalRound.create({
      matchId: match._id, caseId: caso._id, mandateId: mandate._id,
      advocateUserId: advocate.userId, crossExaminerUserId: crossEx.userId, phase: 'arguing',
    });
    match.rounds.push(round._id);
    match.status = 'in_progress';
    await match.save();
    return res.json({ ok: true, roundId: round._id });
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

// ── Advocate envía su argumento ──
router.post('/round/:id/submit-argument', auth, async function(req, res) {
  try {
    const round = await TribunalRound.findById(req.params.id);
    if (!round || round.phase !== 'arguing') return res.status(400).json({ msg: 'No es momento de argumentar' });
    if (uid(round.advocateUserId) !== uid(req.user._id)) return res.status(403).json({ msg: 'Solo el Advocate argumenta' });
    round.transcript = String(req.body.transcript || '').slice(0, 4000);
    round.phase = 'cross_exam';
    await round.save();
    return res.json({ ok: true });
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

// ── Contra-interrogación: pregunta ──
router.post('/round/:id/submit-cross-question', auth, async function(req, res) {
  try {
    const round = await TribunalRound.findById(req.params.id);
    if (!round || round.phase !== 'cross_exam') return res.status(400).json({ msg: 'No es momento de preguntar' });
    if (uid(round.crossExaminerUserId) !== uid(req.user._id)) return res.status(403).json({ msg: 'Solo el interrogador pregunta' });
    round.crossExamQuestion = String(req.body.question || '').slice(0, 600);
    await round.save();
    return res.json({ ok: true });
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

// ── Contra-interrogación: respuesta ──
router.post('/round/:id/submit-cross-answer', auth, async function(req, res) {
  try {
    const round = await TribunalRound.findById(req.params.id);
    if (!round || round.phase !== 'cross_exam') return res.status(400).json({ msg: 'No es momento de responder' });
    if (uid(round.advocateUserId) !== uid(req.user._id)) return res.status(403).json({ msg: 'Solo el Advocate responde' });
    round.crossExamAnswer = String(req.body.answer || '').slice(0, 2000);
    round.phase = 'jury_voting';
    await round.save();
    return res.json({ ok: true });
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

// ── Jurado vota (al completar todos → resuelve) ──
router.post('/round/:id/submit-jury-vote', auth, async function(req, res) {
  try {
    const round = await TribunalRound.findById(req.params.id);
    if (!round || round.phase !== 'jury_voting') return res.status(400).json({ msg: 'No es momento de votar' });
    if (uid(round.advocateUserId) === uid(req.user._id)) return res.status(403).json({ msg: 'El Advocate no vota' });
    if (round.jurorVotes.some(v => uid(v.userId) === uid(req.user._id))) return res.json({ ok: true, ya: true });
    const tagged = Array.isArray(req.body.taggedDevices) ? req.body.taggedDevices.filter(d => DEVICES.includes(d)) : [];
    round.jurorVotes.push({ userId: req.user._id, taggedDevices: tagged, bluffVote: !!req.body.bluffVote, registerBreakVote: !!req.body.registerBreakVote });
    await round.save();

    const match = await TribunalMatch.findById(round.matchId);
    const jurados = match.players.filter(p => uid(p.userId) !== uid(round.advocateUserId));
    if (round.jurorVotes.length >= jurados.length) await resolverRonda(round, match);
    return res.json({ ok: true, resolved: round.phase === 'verdict' });
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

// ── Resolver ronda: Magistrado + scoring (idempotente) ──
async function resolverRonda(round, match) {
  if (round.phase === 'verdict') return;
  const mandate = await TribunalMandate.findById(round.mandateId).lean();
  const v = await magistrate(mandate, round.transcript, round.crossExamQuestion, round.crossExamAnswer);
  round.magistrateVerdict = v;
  const outcomes = {};

  // Advocate
  const adv = match.players.find(p => uid(p.userId) === uid(round.advocateUserId));
  if (adv) {
    const composite = (v.mandateFidelity + v.bluffExecutionScore + v.registerConsistencyScore + v.crossExamComposureScore) / 4;
    const dE = (v.registerConsistencyScore - 50) / 6, dP = (composite - 50) / 6, dL = (v.mandateFidelity - 50) / 8;
    adv.ethos = clamp(adv.ethos + dE); adv.pathos = clamp(adv.pathos + dP); adv.logos = clamp(adv.logos + dL);
    outcomes[uid(adv.userId)] = { role: 'advocate', composite: Math.round(composite), dEthos: +dE.toFixed(1), dPathos: +dP.toFixed(1), dLogos: +dL.toFixed(1) };
  }
  // Jurado
  for (const vote of round.jurorVotes) {
    const jp = match.players.find(p => uid(p.userId) === uid(vote.userId));
    if (!jp) continue;
    const hits = vote.taggedDevices.filter(d => v.actualDevicesUsed.includes(d)).length;
    const precision = vote.taggedDevices.length ? hits / vote.taggedDevices.length : 0;
    const recall = v.actualDevicesUsed.length ? hits / v.actualDevicesUsed.length : (vote.taggedDevices.length === 0 ? 1 : 0);
    const detectionScore = ((precision + recall) / 2) * 100;
    const bluffCorrect = vote.bluffVote === v.bluffWasPresent;
    const registerCorrect = vote.registerBreakVote === v.registerBreakOccurred;
    const jurorComposite = (detectionScore + (bluffCorrect ? 100 : 20) + (registerCorrect ? 100 : 20)) / 3;
    const calibration = calibrationScore(jurorComposite, v.magistrateConfidence);
    let dL = (detectionScore - 50) / 6, dP = bluffCorrect ? 4 : -4, dE = registerCorrect ? 4 : -4;
    jp.logos = clamp(jp.logos + dL); jp.pathos = clamp(jp.pathos + dP); jp.ethos = clamp(jp.ethos + dE);
    outcomes[uid(jp.userId)] = { role: 'jury', detectionScore: Math.round(detectionScore), bluffCorrect, registerCorrect, calibration: Math.round(calibration), dEthos: dE, dPathos: dP, dLogos: +dL.toFixed(1) };
  }

  round.outcomes = outcomes;
  round.phase = 'verdict';
  await round.save();

  match.currentRoundIndex += 1;
  if (match.currentRoundIndex >= match.totalRounds) {
    match.status = 'finished';
    // Persistir stats
    for (const p of match.players) {
      const avg = (p.ethos + p.pathos + p.logos) / 3;
      const rt = rankOf(avg, p.role === 'advocate' ? 'advocate' : 'jury');
      let st = await TribunalStats.findOne({ userId: p.userId });
      if (!st) st = new TribunalStats({ userId: p.userId, name: p.displayName });
      st.name = p.displayName; st.matchesPlayed += 1;
      st.totalEthos += Math.round(p.ethos); st.totalPathos += Math.round(p.pathos); st.totalLogos += Math.round(p.logos);
      st.rankTitle = rt;
      await st.save();
    }
  }
  await match.save();
}

router.post('/round/:id/resolve', auth, async function(req, res) {
  try {
    const round = await TribunalRound.findById(req.params.id);
    if (!round) return res.status(404).json({ msg: 'Ronda no encontrada' });
    if (round.phase === 'verdict') return res.json({ ok: true, already: true });
    const match = await TribunalMatch.findById(round.matchId);
    await resolverRonda(round, match);
    return res.json({ ok: true });
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

// ── Estado de la ronda (polling); adapta lo que ve cada jugador ──
router.get('/round/:id', auth, async function(req, res) {
  try {
    const round = await TribunalRound.findById(req.params.id).lean();
    if (!round) return res.status(404).json({ msg: 'Ronda no encontrada' });
    const match = await TribunalMatch.findById(round.matchId).lean();
    const caso  = await TribunalCase.findById(round.caseId).lean();
    const soyAdvocate = uid(round.advocateUserId) === uid(req.user._id);
    const esVerdict = round.phase === 'verdict';

    const out = {
      roundId: round._id, matchId: round.matchId, phase: round.phase,
      caseTitle: caso ? caso.title : '', caseText: caso ? caso.briefText : '',
      advocateUserId: round.advocateUserId, crossExaminerUserId: round.crossExaminerUserId,
      timers: round.timers,
      players: match.players.map(p => ({ userId: p.userId, name: p.displayName, role: p.role, ethos: Math.round(p.ethos), pathos: Math.round(p.pathos), logos: Math.round(p.logos) })),
      votesCount: round.jurorVotes.length,
      juryTotal: match.players.filter(p => uid(p.userId) !== uid(round.advocateUserId)).length,
      iVoted: round.jurorVotes.some(v => uid(v.userId) === uid(req.user._id)),
      matchStatus: match.status, currentRoundIndex: match.currentRoundIndex, totalRounds: match.totalRounds,
      hostUserId: match.hostUserId,
    };
    // Transcript visible desde cross_exam en adelante
    if (['cross_exam','jury_voting','verdict'].includes(round.phase)) {
      out.transcript = round.transcript;
      out.crossExamQuestion = round.crossExamQuestion;
      out.crossExamAnswer = round.crossExamAnswer;
    }
    // El Mandato SOLO al advocate (siempre) y a todos en el veredicto
    const mandate = await TribunalMandate.findById(round.mandateId).lean();
    if (soyAdvocate || esVerdict) out.mandate = { requiredDevices: mandate.requiredDevices, registerTarget: mandate.registerTarget, requiresBluff: mandate.requiresBluff, bluffInstruction: mandate.bluffInstruction };
    // El veredicto del Magistrado SOLO en fase verdict
    if (esVerdict) { out.verdict = round.magistrateVerdict; out.outcomes = round.outcomes; }
    return res.json(out);
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

// ── Leaderboard global ──
router.get('/leaderboard', auth, async function(req, res) {
  try {
    const stats = await TribunalStats.find({}).lean();
    const top = stats.map(s => {
      const games = Math.max(1, s.matchesPlayed);
      const avg = (s.totalEthos + s.totalPathos + s.totalLogos) / (3 * games);
      return { name: s.name, rankTitle: s.rankTitle, avg: Math.round(avg), matches: s.matchesPlayed };
    }).sort((a, b) => b.avg - a.avg).slice(0, 20);
    return res.json({ top });
  } catch (err) { return res.status(500).json({ msg: err.message }); }
});

module.exports = router;
