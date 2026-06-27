/**
 * Seed del Test de DIAGNÓSTICO — AulaQuest
 * Un solo test lineal y completo (~32 preguntas) ordenado de fácil (A1) a difícil (C2).
 * Mide TODO el inglés: imágenes (encuentra en inglés), verb to be, presente, pasado,
 *   futuro, perfecto, pasiva, condicionales, vocabulario, listening y pronunciación.
 *
 * El test NO asigna aula: todos empiezan en el Aula 1 (A1). Solo da un diagnóstico
 *   informativo (nota, nivel estimado y desglose por área) que el alumno verá en el aula.
 *
 * Categoría (para el desglose) se deriva del tipo en el backend:
 *   image→imagenes · vocab→vocabulario · grammar/fill→gramatica · listening→listening · pronunciation→pronunciacion
 * El campo `nivel` se usa para estimar el nivel del alumno.
 */
const mongoose = require('mongoose');
require('dotenv').config();

const PlacementTest = require('../models/PlacementTest');

// Orden = orden de aparición (de principiante a avanzado)
const preguntas = [

  // ── A1 · Principiante: imágenes, to be, saludos ───────────────────────────
  { nivel:'A1', tipo:'image', img:'🍎', q:'Encuentra en inglés: ¿qué es esto?', opts:['Apple','Orange','Banana','Grape'], ans:0 },
  { nivel:'A1', tipo:'image', img:'🐶', q:'¿Qué animal es?', opts:['Cat','Cow','Dog','Horse'], ans:2 },
  { nivel:'A1', tipo:'grammar', q:'Verb "to be": "I ___ a student."', opts:['am','is','are','be'], ans:0 },
  { nivel:'A1', tipo:'grammar', q:'Verb "to be": "She ___ happy."', opts:['am','are','is','be'], ans:2 },
  { nivel:'A1', tipo:'vocab', q:'¿Qué significa "Good morning"?', opts:['Buenas noches','Buenos días','Buenas tardes','Adiós'], ans:1 },
  { nivel:'A1', tipo:'image', img:'☀️', q:'¿Qué es esto?', opts:['Moon','Sun','Star','Rain'], ans:1 },
  { nivel:'A1', tipo:'pronunciation', img:'🍎', audio:'apple', target:'apple', q:'Escucha a Mr. Alex y repite la palabra.' },
  { nivel:'A1', tipo:'listening', audio:'How are you?', q:'Mr. Alex pregunta. ¿Qué significa?', opts:['¿Cómo estás?','¿Cómo te llamas?','¿De dónde eres?','¿Qué edad tienes?'], ans:0 },

  // ── A2 · Elemental: presente simple, pasado, rutinas ──────────────────────
  { nivel:'A2', tipo:'grammar', q:'Presente simple: "He ___ to music every day."', opts:['listen','listens','listening','listened'], ans:1 },
  { nivel:'A2', tipo:'fill', q:'Pasado simple: "Yesterday I ___ to the park."', opts:['go','goes','went','going'], ans:2 },
  { nivel:'A2', tipo:'image', img:'🏃', q:'What is he doing?', opts:['eating','running','sleeping','reading'], ans:1 },
  { nivel:'A2', tipo:'vocab', q:'¿Qué significa "hungry"?', opts:['cansado','hambriento','feliz','aburrido'], ans:1 },
  { nivel:'A2', tipo:'pronunciation', audio:'What time is it?', target:'what time is it', q:'Escucha y repite la pregunta.' },
  { nivel:'A2', tipo:'listening', audio:'Where are you from?', q:'Mr. Alex pregunta. ¿Qué significa?', opts:['¿Cómo te llamas?','¿De dónde eres?','¿Cuántos años tienes?','¿Adónde vas?'], ans:1 },

  // ── B1 · Intermedio: futuro, presente perfecto, modales ───────────────────
  { nivel:'B1', tipo:'grammar', q:'Futuro: "If it rains tomorrow, we ___ stay home."', opts:['will','would','should','shall'], ans:0 },
  { nivel:'B1', tipo:'fill', q:'Presente perfecto: "She ___ her homework before dinner."', opts:['already finished','has already finished','already finishes','had already finish'], ans:1 },
  { nivel:'B1', tipo:'grammar', q:'"I have known her ___ 2015."', opts:['since','for','from','during'], ans:0 },
  { nivel:'B1', tipo:'vocab', q:'¿Qué significa "to overcome a challenge"?', opts:['rendirse ante un reto','superar un reto','ignorar un reto','crear un reto'], ans:1 },
  { nivel:'B1', tipo:'image', img:'✈️', q:'Where is she? (She is at the...)', opts:['hospital','airport','school','bank'], ans:1 },
  { nivel:'B1', tipo:'pronunciation', audio:'I would rather stay home tonight', target:'i would rather stay home tonight', q:'Escucha y repite la oración.' },

  // ── B2 · Intermedio alto: pasiva, wish, condicionales ─────────────────────
  { nivel:'B2', tipo:'grammar', q:'"I wish I ___ more time to study for this exam."', opts:['have','had','will have','would have'], ans:1 },
  { nivel:'B2', tipo:'fill', q:'Voz pasiva (futuro): "The report ___ by Friday at the latest."', opts:['will submit','will be submitted','is submitted','was submitted'], ans:1 },
  { nivel:'B2', tipo:'vocab', q:'¿Qué significa "ambiguous"?', opts:['muy claro','con doble sentido / poco claro','enorme','ambicioso'], ans:1 },
  { nivel:'B2', tipo:'listening', audio:'Had she known about the meeting, she would have attended.', q:'¿Qué estructura condicional usa esta oración?', opts:['Zero conditional','First conditional','Second conditional','Third conditional'], ans:3 },
  { nivel:'B2', tipo:'pronunciation', audio:'I would appreciate it if you could reconsider', target:'i would appreciate it if you could reconsider', q:'Repite esta frase formal.' },

  // ── C1 · Avanzado: inversión, vocabulario sofisticado ─────────────────────
  { nivel:'C1', tipo:'grammar', q:'Inversión: "No sooner ___ the door than the phone rang."', opts:['he had closed','had he closed','he closed','did he close'], ans:1 },
  { nivel:'C1', tipo:'vocab', q:'¿Qué significa "meticulous"?', opts:['descuidado','extremadamente cuidadoso','perezoso','generoso'], ans:1 },
  { nivel:'C1', tipo:'listening', audio:'The legislation, albeit well-intentioned, has had unforeseen repercussions.', q:'¿Qué significa "albeit"?', opts:['aunque','además','sin embargo','por lo tanto'], ans:0 },
  { nivel:'C1', tipo:'pronunciation', audio:'No sooner had he closed the door than the phone rang', target:'no sooner had he closed the door than the phone rang', q:'Escucha y repite con precisión.' },

  // ── C2 · Maestría: matices léxicos, sintaxis compleja ─────────────────────
  { nivel:'C2', tipo:'vocab', q:'¿Qué significa "perspicacious"?', opts:['torpe y distraído','de perspicacia aguda / muy perceptivo','melancólico y reservado','ambicioso sin escrúpulos'], ans:1 },
  { nivel:'C2', tipo:'grammar', q:'"Not only ___ the project fail, but it also cost millions."', opts:['did','had','was','were'], ans:0 },
  { nivel:'C2', tipo:'pronunciation', audio:'The ramifications of such an unprecedented geopolitical shift', target:'the ramifications of such an unprecedented geopolitical shift', q:'Pronuncia esta frase de nivel maestría.' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await PlacementTest.deleteMany({});
  await PlacementTest.create({ preguntas });
  const porNivel = preguntas.reduce((a, p) => { a[p.nivel] = (a[p.nivel] || 0) + 1; return a; }, {});
  console.log(`✅ Test de diagnóstico creado: ${preguntas.length} preguntas`);
  console.log('   Por nivel:', JSON.stringify(porNivel));
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
