// Pre-genera y guarda en la BD, para TODAS las palabras de TODAS las aulas:
//  - EjemploPalabra: oración de ejemplo + traducción + explicación de uso
//  - FraseReto: reto "completa la frase" (3 opciones) para practicar el uso
// Idempotente: salta las que ya están (se puede re-ejecutar / reanudar).
const mongoose = require('mongoose');
require('dotenv').config();
const KEY = process.env.OPENAI_API_KEY;

const EjemploPalabra = require('../models/EjemploPalabra');
const FraseReto = mongoose.models.FraseReto || mongoose.model('FraseReto', new mongoose.Schema({
  en: { type: String, unique: true }, prompt: String, promptEs: String, opts: [String], ans: Number, explic: String,
}, { timestamps: true }));
const Curso = mongoose.model('Curso', new mongoose.Schema({ nivel: String, temas: Array }, { collection: 'cursos' }));

async function chat(messages) {
  for (let intento = 0; intento < 3; intento++) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 20000);
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.4, response_format: { type: 'json_object' }, messages }),
      });
      clearTimeout(to);
      if (r.status === 429) { await new Promise(s => setTimeout(s, 2000 * (intento + 1))); continue; }
      if (!r.ok) continue;
      const d = await r.json();
      return JSON.parse(d.choices[0].message.content);
    } catch (e) { await new Promise(s => setTimeout(s, 800)); }
  }
  return null;
}

async function genEjemplo(en, es) {
  const j = await chat([
    { role: 'system', content: 'Eres Mr. Alex, profesor de inglés para principiantes hispanohablantes. Respondes SOLO JSON válido.' },
    { role: 'user', content:
      'Palabra/frase en inglés: "' + en + '" (significa: "' + es + '").\n' +
      'Devuelve JSON: {"frase": una oración de ejemplo MUY simple (máx 8 palabras) usando exactamente esa palabra en una conversación real, ' +
      '"fraseEs": su traducción al español, ' +
      '"explicacion": 1-2 frases en español MUY simple explicando cómo se usa (si es verbo, cómo se conjuga: ej. "am se usa con I: I am = yo soy")}.' },
  ]);
  if (!j || !j.frase) return null;
  return { frase: String(j.frase).slice(0, 140), fraseEs: String(j.fraseEs || '').slice(0, 140), explicacion: String(j.explicacion || '').slice(0, 260) };
}

async function genFrase(en, es) {
  const j = await chat([
    { role: 'system', content: 'Eres Mr. Alex, profesor de inglés para principiantes. Respondes SOLO JSON válido.' },
    { role: 'user', content:
      'Palabra en inglés: "' + en + '" (significa "' + es + '").\n' +
      'Crea un ejercicio de "completa la frase" para practicar CÓMO USARLA en una conversación real.\n' +
      'JSON: {"prompt": frase corta en inglés con un hueco "___" donde va "' + en + '" (ej: "___, how are you?"), ' +
      '"promptEs": la traducción de la frase completa al español, ' +
      '"opts": array de 3 opciones donde SOLO UNA es "' + en + '" y las otras 2 son distractores plausibles, ' +
      '"ans": índice (0-2) de la opción correcta "' + en + '", ' +
      '"explic": 1 frase MUY simple en español de por qué esa palabra completa la frase}.' },
  ]);
  if (!j || !Array.isArray(j.opts) || j.opts.length !== 3 || typeof j.ans !== 'number') return null;
  return { prompt: String(j.prompt || '').slice(0, 120), promptEs: String(j.promptEs || '').slice(0, 140), opts: j.opts.map(o => String(o).slice(0, 40)), ans: j.ans, explic: String(j.explic || '').slice(0, 200) };
}

async function pool(items, n, worker) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const idx = i++; try { await worker(items[idx], idx); } catch (e) {} }
  }));
}

async function run() {
  if (!KEY) { console.error('❌ Falta OPENAI_API_KEY'); process.exit(1); }
  const niveles = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  let totalGen = 0;
  for (const nivel of niveles) {
    const curso = await Curso.findOne({ nivel });
    if (!curso) { console.log('(sin curso ' + nivel + ')'); continue; }
    const seen = new Set(); const words = [];
    (curso.temas || []).forEach(t => (t.vocabulario || []).forEach(w => { const k = (w.en || '').toLowerCase().trim(); if (k && !seen.has(k)) { seen.add(k); words.push({ en: w.en.trim(), es: w.es || '' }); } }));
    let done = 0, gen = 0;
    await pool(words, 8, async (w) => {
      const [hasE, hasF] = await Promise.all([EjemploPalabra.findOne({ en: w.en }).lean(), FraseReto.findOne({ en: w.en }).lean()]);
      if (!hasE) { const e = await genEjemplo(w.en, w.es); if (e) { await EjemploPalabra.create(Object.assign({ en: w.en, es: w.es }, e)).catch(() => {}); gen++; } }
      if (!hasF) { const f = await genFrase(w.en, w.es); if (f) { await FraseReto.create(Object.assign({ en: w.en }, f)).catch(() => {}); gen++; } }
      done++;
      if (done % 25 === 0) console.log('  ' + nivel + ': ' + done + '/' + words.length);
    });
    totalGen += gen;
    console.log('✅ ' + nivel + ': ' + words.length + ' palabras · ' + gen + ' generadas');
  }
  const [ne, nf] = await Promise.all([EjemploPalabra.countDocuments(), FraseReto.countDocuments()]);
  console.log('✅ COMPLETO — ejemplos:' + ne + ' frases:' + nf + ' (nuevos:' + totalGen + ')');
  mongoose.disconnect();
}

mongoose.connect(process.env.MONGODB_URI).then(() => { console.log('✅ MongoDB conectado — generando…'); run(); }).catch(e => { console.error('❌', e.message); process.exit(1); });
