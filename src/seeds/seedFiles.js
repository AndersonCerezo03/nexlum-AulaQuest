const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('✅ MongoDB conectado'); seed(); })
  .catch(err => { console.error('❌', err.message); process.exit(1); });

const FilesCase = require('../models/FilesCase');

// ─── Caso #7: The Midnight Gallery (B1) ───
// Gramática objetivo: past simple, past continuous, present perfect,
// reported speech y deducción con must / can't have been.
const CASO_7 = {
  numero: 7,
  titulo: 'Case #7 — The Midnight Gallery',
  tituloEs: 'Caso #7 — La Galería de Medianoche',
  activo: true,

  tutorial: [
    { icono: '🕵️', en: 'Interrogate the suspects. Only grammatically correct questions make them talk!', es: 'Interroga a los sospechosos. ¡Solo las preguntas bien formuladas los hacen hablar!' },
    { icono: '📌', en: 'Every answer unlocks a clue for your squad’s evidence board. Share everything!', es: 'Cada respuesta desbloquea una pista para el tablero de tu escuadra. ¡Comparte todo!' },
    { icono: '⚖️', en: 'Find the contradiction, vote the culprit and prove it with "must / can’t have been".', es: 'Encuentra la contradicción, vota al culpable y demuéstralo con "must / can’t have been".' },
  ],

  cinematica: [
    { icono: '🌙', texto: 'Friday, 11:58 pm. The City Museum is silent. Too silent.', textoEs: 'Viernes, 11:58 pm. El Museo de la Ciudad está en silencio. Demasiado silencio.' },
    { icono: '🖼️', texto: 'At midnight, the alarm rings. "The Golden Sunset", a painting worth two million dollars, has disappeared from the West Wing.', textoEs: 'A medianoche suena la alarma. "The Golden Sunset", una pintura de dos millones de dólares, ha desaparecido del Ala Oeste.' },
    { icono: '🚔', texto: 'Four people were near the museum that night. One of them is lying. Your squad has one job: find out who.', textoEs: 'Cuatro personas estaban cerca del museo esa noche. Una de ellas miente. Tu escuadra tiene una misión: descubrir quién.' },
  ],

  mapa: [
    { icono: '🏛️', lugar: 'Main Hall', lugarEs: 'Salón principal', nota: 'Cameras cover every corner.', notaEs: 'Las cámaras cubren cada rincón.' },
    { icono: '🖼️', lugar: 'West Wing', lugarEs: 'Ala Oeste', nota: 'Crime scene. A window was broken.', notaEs: 'Escena del crimen. Una ventana estaba rota.' },
    { icono: '📹', lugar: 'Security Room', lugarEs: 'Sala de seguridad', nota: 'Cameras went off at 10:45 pm.', notaEs: 'Las cámaras se apagaron a las 10:45 pm.' },
    { icono: '📦', lugar: 'Storage', lugarEs: 'Bodega', nota: 'A leather glove was found here.', notaEs: 'Aquí se encontró un guante de cuero.' },
    { icono: '☕', lugar: 'Café Luna (across the street)', lugarEs: 'Café Luna (cruzando la calle)', nota: 'Popular with museum staff.', notaEs: 'Popular entre el personal del museo.' },
  ],

  timeline: [
    { hora: '9:00 pm',  evento: 'The museum closes to the public.', eventoEs: 'El museo cierra al público.' },
    { hora: '10:40 pm', evento: 'Sofia returns for her keys.', eventoEs: 'Sofia vuelve por sus llaves.' },
    { hora: '10:45 pm', evento: 'The cameras go off for 10 minutes.', eventoEs: 'Las cámaras se apagan por 10 minutos.' },
    { hora: '11:05 pm', evento: 'The alarm rings in the West Wing.', eventoEs: 'Suena la alarma en el Ala Oeste.' },
    { hora: '11:15 pm', evento: 'Marcus reports a broken window.', eventoEs: 'Marcus reporta una ventana rota.' },
    { hora: '12:00 am', evento: 'The painting is officially missing.', eventoEs: 'La pintura desaparece oficialmente.' },
  ],

  sospechosos: [
    {
      id: 'marcus', nombre: 'Marcus Reed', cargo: 'Security guard', cargoEs: 'Guardia de seguridad',
      color: '#3b82f6', retrato: { skin: '#c68863', hair: '#1f2937', hairStyle: 'short', acc: 'cap' },
      coartada: 'I was doing my rounds on the second floor all night.',
      coartadaEs: 'Estuve haciendo mis rondas en el segundo piso toda la noche.',
      interrogatorio: [
        { opts: ['Where were you at 11 pm?', 'Where was you at 11 pm?', 'Where you were at 11 pm?'], ans: 0,
          feedback: { en: 'Past simple questions: Where + was/were + subject. "You" always takes WERE.', es: 'Preguntas en pasado: Where + was/were + sujeto. "You" siempre usa WERE.' },
          respuesta: 'I was on the second floor. But listen... the cameras were turned off from the Security Room. Only staff know that code.',
          respuestaEs: 'Estaba en el segundo piso. Pero escucha... las cámaras se apagaron desde la Sala de Seguridad. Solo el personal conoce ese código.',
          clue: { en: 'The camera code — only STAFF could turn them off.', es: 'El código de las cámaras: solo el PERSONAL pudo apagarlas.' } },
        { opts: ['What were you doing when the alarm rang?', 'What did you doing when the alarm rang?', 'What you were doing when the alarm rang?'], ans: 0,
          feedback: { en: 'Past continuous question: What + were + subject + -ing. Never "did + doing".', es: 'Pregunta en pasado continuo: What + were + sujeto + -ing. Nunca "did + doing".' },
          respuesta: 'I was checking the Main Hall. Through the window I saw an elegant black car parked behind the museum. It wasn’t a staff car.',
          respuestaEs: 'Estaba revisando el Salón Principal. Por la ventana vi un elegante carro negro estacionado detrás del museo. No era de un empleado.',
          clue: { en: 'An elegant black car was parked behind the museum.', es: 'Un carro negro elegante estaba estacionado detrás del museo.' },
          rsOpts: ['He said that he had seen an elegant black car.', 'He said that he has seen an elegant black car.', 'He said that he see an elegant black car.'], rsAns: 0,
          rsFeedback: { en: 'Reported speech: "I saw" becomes "he had seen" (past → past perfect).', es: 'Estilo indirecto: "I saw" se convierte en "he had seen" (pasado → pasado perfecto).' } },
        { opts: ['Have you checked the broken window?', 'Did you have checked the broken window?', 'Have you check the broken window?'], ans: 0,
          feedback: { en: 'Present perfect: Have + subject + past participle (checked).', es: 'Presente perfecto: Have + sujeto + participio (checked).' },
          respuesta: 'Yes, and here’s the strange part: the glass fell OUTSIDE. That window was broken from the INSIDE.',
          respuestaEs: 'Sí, y aquí está lo raro: el vidrio cayó HACIA AFUERA. Esa ventana fue rota desde ADENTRO.',
          clue: { en: 'The window was broken from the INSIDE — the thief was already in.', es: 'La ventana fue rota desde ADENTRO: el ladrón ya estaba dentro.' } },
      ],
    },
    {
      id: 'elena', nombre: 'Elena Cruz', cargo: 'Art restorer', cargoEs: 'Restauradora de arte',
      color: '#10b981', retrato: { skin: '#e8b58a', hair: '#4a2c17', hairStyle: 'bun', acc: 'glasses' },
      coartada: 'I had already left at 9 pm. I went straight home.',
      coartadaEs: 'Ya me había ido a las 9 pm. Fui directo a casa.',
      interrogatorio: [
        { opts: ['How long have you worked at the museum?', 'How long do you worked at the museum?', 'How long you have worked at the museum?'], ans: 0,
          feedback: { en: 'Present perfect for duration: How long + have + subject + past participle.', es: 'Presente perfecto para duración: How long + have + sujeto + participio.' },
          respuesta: 'I’ve worked here for eight years. Last week a collector asked me about the value of The Golden Sunset. He knew the insurance number exactly: two million.',
          respuestaEs: 'He trabajado aquí ocho años. La semana pasada un coleccionista me preguntó por el valor de The Golden Sunset. Sabía el número del seguro exacto: dos millones.',
          clue: { en: 'A collector asked Elena about the painting’s exact insurance value.', es: 'Un coleccionista le preguntó a Elena por el valor exacto del seguro de la pintura.' } },
        { opts: ['Did you notice anything strange before leaving?', 'Did you noticed anything strange before leaving?', 'You did notice anything strange before leaving?'], ans: 0,
          feedback: { en: 'Past simple questions: Did + subject + BASE verb (notice, not noticed).', es: 'Preguntas en pasado: Did + sujeto + verbo BASE (notice, no noticed).' },
          respuesta: 'Yes. When I was leaving at 8:50, the Storage door was open. That door is always locked.',
          respuestaEs: 'Sí. Cuando salía a las 8:50, la puerta de la Bodega estaba abierta. Esa puerta siempre está cerrada con llave.',
          clue: { en: 'The Storage door was open at 8:50 pm — it is always locked.', es: 'La puerta de la Bodega estaba abierta a las 8:50 pm; siempre está cerrada.' } },
        { opts: ['Have you lost anything from your kit?', 'Have you losed anything from your kit?', 'Did you have lost anything from your kit?'], ans: 0,
          feedback: { en: 'Present perfect: have + LOST (irregular participle of lose).', es: 'Presente perfecto: have + LOST (participio irregular de lose).' },
          respuesta: 'Now that you mention it... my restoration gloves have disappeared. Leather gloves, size large. They were in the Storage.',
          respuestaEs: 'Ahora que lo mencionas... mis guantes de restauración desaparecieron. Guantes de cuero, talla grande. Estaban en la Bodega.',
          clue: { en: 'Elena’s leather gloves disappeared from the Storage.', es: 'Los guantes de cuero de Elena desaparecieron de la Bodega.' },
          rsOpts: ['She said that her gloves had disappeared.', 'She said that her gloves have disappeared.', 'She said that her gloves disappear.'], rsAns: 0,
          rsFeedback: { en: 'Reported speech: present perfect ("have disappeared") becomes past perfect ("had disappeared").', es: 'Estilo indirecto: presente perfecto ("have disappeared") pasa a pasado perfecto ("had disappeared").' } },
      ],
    },
    {
      id: 'victor', nombre: 'Victor Stone', cargo: 'Art collector', cargoEs: 'Coleccionista de arte',
      color: '#f59e0b', retrato: { skin: '#e5c29f', hair: '#9ca3af', hairStyle: 'slick', acc: 'scarf' },
      coartada: 'I was having dinner at Café Luna until midnight. Ask anyone.',
      coartadaEs: 'Estuve cenando en el Café Luna hasta la medianoche. Pregúntale a cualquiera.',
      interrogatorio: [
        { opts: ['What were you doing on Friday night?', 'What was you doing on Friday night?', 'What were you do on Friday night?'], ans: 0,
          feedback: { en: 'Past continuous: were + subject + verb-ING (doing).', es: 'Pasado continuo: were + sujeto + verbo-ING (doing).' },
          respuesta: 'I was having dinner at Café Luna, across the street. I stayed until midnight. Lovely coffee, by the way.',
          respuestaEs: 'Estaba cenando en el Café Luna, cruzando la calle. Me quedé hasta la medianoche. Excelente café, por cierto.',
          clue: { en: 'Victor claims he stayed at Café Luna UNTIL MIDNIGHT.', es: 'Victor afirma que se quedó en el Café Luna HASTA LA MEDIANOCHE.' },
          rsOpts: ['He said that he had stayed until midnight.', 'He said that he stays until midnight.', 'He said that he is staying until midnight.'], rsAns: 0,
          rsFeedback: { en: 'Reported speech: "I stayed" becomes "he had stayed".', es: 'Estilo indirecto: "I stayed" se convierte en "he had stayed".' } },
        { opts: ['Have you ever tried to buy this painting?', 'Have you ever tryed to buy this painting?', 'Did you have ever tried to buy this painting?'], ans: 0,
          feedback: { en: 'Present perfect with EVER: Have + subject + ever + past participle (tried).', es: 'Presente perfecto con EVER: Have + sujeto + ever + participio (tried).' },
          respuesta: 'Twice. The museum refused both offers. Some things money can’t buy... officially.',
          respuestaEs: 'Dos veces. El museo rechazó ambas ofertas. Hay cosas que el dinero no puede comprar... oficialmente.',
          clue: { en: 'Victor tried to buy the painting TWICE. The museum refused.', es: 'Victor intentó comprar la pintura DOS VECES. El museo se negó.' } },
        { opts: ['Do you own a black car?', 'Do you own a car black?', 'Own you a black car?'], ans: 0,
          feedback: { en: 'Adjective BEFORE noun: a BLACK CAR. Questions: Do + subject + verb.', es: 'El adjetivo va ANTES del sustantivo: a BLACK CAR. Preguntas: Do + sujeto + verbo.' },
          respuesta: 'A black Bentley, yes. I parked it... near the museum. Parking is terrible in this city.',
          respuestaEs: 'Un Bentley negro, sí. Lo estacioné... cerca del museo. Estacionar es terrible en esta ciudad.',
          clue: { en: 'Victor owns a black Bentley — parked NEAR THE MUSEUM that night.', es: 'Victor tiene un Bentley negro, estacionado CERCA DEL MUSEO esa noche.' } },
      ],
    },
    {
      id: 'sofia', nombre: 'Sofia Marsh', cargo: 'Tour guide', cargoEs: 'Guía turística',
      color: '#ec4899', retrato: { skin: '#f0c8a0', hair: '#b45309', hairStyle: 'long', acc: 'none' },
      coartada: 'I came back at 10:40 because I had forgotten my keys.',
      coartadaEs: 'Volví a las 10:40 porque había olvidado mis llaves.',
      interrogatorio: [
        { opts: ['Why did you come back to the museum?', 'Why you came back to the museum?', 'Why did you came back to the museum?'], ans: 0,
          feedback: { en: 'Past simple questions: did + BASE verb (come, not came).', es: 'Preguntas en pasado: did + verbo BASE (come, no came).' },
          respuesta: 'I had forgotten my keys in the staff room. I came back at 10:40, took them and left in five minutes.',
          respuestaEs: 'Había olvidado mis llaves en el cuarto del personal. Volví a las 10:40, las tomé y salí en cinco minutos.',
          clue: { en: 'Sofia was inside the museum at 10:40 pm — five minutes before the cameras went off.', es: 'Sofia estuvo dentro del museo a las 10:40 pm, cinco minutos antes de que se apagaran las cámaras.' } },
        { opts: ['Did you see anyone while you were leaving?', 'Did you saw anyone while you were leaving?', 'Did you see anyone while you was leaving?'], ans: 0,
          feedback: { en: 'Did + see (base verb). Past continuous: you WERE leaving.', es: 'Did + see (verbo base). Pasado continuo: you WERE leaving.' },
          respuesta: 'Yes! A tall man in an elegant coat and scarf was standing near the Security Room. I thought he was a VIP guest.',
          respuestaEs: '¡Sí! Un hombre alto con abrigo elegante y bufanda estaba parado cerca de la Sala de Seguridad. Pensé que era un invitado VIP.',
          clue: { en: 'A tall man with an elegant coat and SCARF was near the Security Room at ~10:42.', es: 'Un hombre alto de abrigo elegante y BUFANDA estaba cerca de la Sala de Seguridad a las ~10:42.' },
          rsOpts: ['She said that a tall man was standing near the Security Room.', 'She said that a tall man is standing near the Security Room.', 'She said that a tall man stands near the Security Room.'], rsAns: 0,
          rsFeedback: { en: 'Reported speech keeps past continuous: "was standing" stays "was standing".', es: 'El estilo indirecto mantiene el pasado continuo: "was standing" queda igual.' } },
        { opts: ['What time does Café Luna close on Fridays?', 'What time Café Luna closes on Fridays?', 'What time do Café Luna closes on Fridays?'], ans: 0,
          feedback: { en: 'Questions with does: What time + does + subject + BASE verb (close).', es: 'Preguntas con does: What time + does + sujeto + verbo BASE (close).' },
          respuesta: 'Café Luna? It closes at 10:30 on Fridays. I know because I always miss their desserts after my late tours.',
          respuestaEs: '¿El Café Luna? Cierra a las 10:30 los viernes. Lo sé porque siempre me pierdo sus postres después de mis tours nocturnos.',
          clue: { en: '⚡ Café Luna CLOSES AT 10:30 on Fridays. Nobody could have dinner there until midnight!', es: '⚡ El Café Luna CIERRA A LAS 10:30 los viernes. ¡Nadie pudo cenar allí hasta medianoche!' } },
      ],
    },
  ],

  teorias: [
    { texto: 'Marcus must have stolen it: he was alone and knew the cameras.', textoEs: 'Marcus debió robarla: estaba solo y conocía las cámaras.' },
    { texto: 'Victor can’t have been at Café Luna until midnight — it closed at 10:30. He must have taken the painting while the cameras were off.', textoEs: 'Victor no pudo estar en el Café Luna hasta medianoche: cerró a las 10:30. Debió llevarse la pintura mientras las cámaras estaban apagadas.' },
    { texto: 'Elena must have used her own gloves to open the frame and hide the painting in the Storage.', textoEs: 'Elena debió usar sus propios guantes para abrir el marco y esconder la pintura en la Bodega.' },
    { texto: 'Sofia can’t have left in five minutes — she must have turned off the cameras at 10:45.', textoEs: 'Sofia no pudo salir en cinco minutos: debió apagar las cámaras a las 10:45.' },
  ],
  culpable: 'victor',
  teoriaCorrecta: 1,
  contradiccion: {
    en: 'Victor swore he was at Café Luna "until midnight"… but the café closes at 10:30 on Fridays. The elegant man with the scarf near the Security Room, the black Bentley behind the museum, the stolen leather gloves — it was Victor all along.',
    es: 'Victor juró que estuvo en el Café Luna "hasta la medianoche"… pero el café cierra a las 10:30 los viernes. El hombre elegante con bufanda junto a la Sala de Seguridad, el Bentley negro detrás del museo, los guantes robados: fue Victor todo el tiempo.',
  },
};

async function seed() {
  await FilesCase.deleteMany({ numero: 7 });
  await FilesCase.create(CASO_7);
  const pistas = CASO_7.sospechosos.reduce((a, s) => a + s.interrogatorio.length, 0);
  console.log(`✅ Files: Caso #7 "${CASO_7.titulo}" — ${CASO_7.sospechosos.length} sospechosos, ${pistas} pistas, ${CASO_7.teorias.length} teorías`);
  mongoose.disconnect();
}
