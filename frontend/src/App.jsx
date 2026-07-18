import { useState, useEffect, useRef } from 'react';
import ArenaGame from './Arena.jsx';
import CityGame from './City.jsx';
import FilesGame from './Files.jsx';
import RoyaleGame from './Royale.jsx';
import GrimoireGame from './Grimoire.jsx';
import TribunalGame from './Tribunal.jsx';

const API = import.meta.env.VITE_API_URL || 'https://nexlum-aulaquest.onrender.com';
const authH = (t) => ({ 'Content-Type':'application/json', 'Authorization':'Bearer '+t });
const clean = (s) => s.toLowerCase().trim().replace(/[^a-z\s]/g,'');

// Mapa de palabras que el reconocedor confunde frecuentemente
const PHONETIC_MAP = {
  'six':         ['six','sex','sicks','sics','sick'],
  'seven':       ['seven','sevan','seben'],
  'three':       ['three','tree','free'],
  'one':         ['one','won','wan'],
  'two':         ['two','to','too'],
  'four':        ['four','for','fore'],
  'eight':       ['eight','ate','ait'],
  'eye':         ['eye','i','ai'],
  'ear':         ['ear','here','year'],
  'excuse me':   ['excuse me','excuse','scuse me'],
  'thank you':   ['thank you','thank','thanks'],
  'good morning':['good morning','morning'],
  'good night':  ['good night','goodnight','night'],
  'good afternoon':['good afternoon','afternoon'],
  'in front of': ['in front of','in front','front of'],
  'next to':     ['next to','next'],
  'i am':        ['i am','iam','i m'],
  'i can':       ['i can','icon','i ken'],
  'i cannot':    ['i cannot','i can not','cannot'],
  'i was':       ['i was','iwas'],
  'we are':      ['we are','wear','we r'],
  'you are':     ['you are','your','you r'],
  'he is':       ['he is','hes','he s'],
  'she is':      ['she is','shes','she s'],
  'they are':    ['they are','there','they r'],
  'i am studying':['i am studying','studying','i am study'],
  'how much':    ['how much','how much'],
  'how many':    ['how many','how many'],
};

const isMatch = (spoken, target) => {
  const s = clean(spoken);
  const t = clean(target);
  if (s === t) return true;
  // Verificar mapa fonético
  const alts = PHONETIC_MAP[t] || [];
  if (alts.includes(s)) return true;
  // Aceptar si el spoken contiene la palabra target completa
  if (s.includes(t) || t.includes(s)) return true;
  return false;
};
const rand = arr => arr[Math.floor(Math.random()*arr.length)];

const CORRECT = [
  "Excellent! That's perfect pronunciation!",
  "Amazing! You nailed it! Keep going!",
  "Fantastic! Your English is improving!",
  "Outstanding! That was spot on!",
  "Brilliant! You said it perfectly!",
];
const TRY_AGAIN = [
  "Good try! Listen carefully and try again.",
  "Almost there! Focus on the pronunciation.",
  "Don't give up! You can do it!",
];

const KF = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght=300;400;600;700;900&display=swap');
  @keyframes maRot { to { transform: rotate(360deg); } }
  @keyframes pulseBtn { 0%,100%{box-shadow:0 0 0 0 rgba(234,179,8,.4)} 50%{box-shadow:0 0 0 6px rgba(234,179,8,0)} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes pulse-glow { 0%,100%{opacity:.06} 50%{opacity:.12} }
  @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  html, body, #root { overflow-x: hidden !important; max-width: 100vw !important; }
  /* Tablets y móviles (todo lo que no sea escritorio ancho) */
  @media (max-width: 1024px) {
    .aq-2col { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
    .aq-topics { grid-template-columns: repeat(2,1fr) !important; }
    .aq-bar { flex-wrap: wrap !important; height: auto !important; padding: 8px 12px !important; gap: 8px !important; }
    nav { padding-left: 1rem !important; padding-right: 1rem !important; }
    #root, body > div { overflow-x: hidden !important; max-width: 100vw !important; }
    * { max-width: 100% !important; box-sizing: border-box; }
  }
  /* Móviles */
  @media (max-width: 620px) {
    nav { padding-left: .7rem !important; padding-right: .7rem !important; }
  }
  `;

const VOCAB_TEMAS = {
  greetings: [
    {en:'Hello',es:'Hola'},{en:'Goodbye',es:'Adios'},{en:'Good morning',es:'Buenos dias'},
    {en:'Good night',es:'Buenas noches'},{en:'Please',es:'Por favor'},{en:'Thank you',es:'Gracias'},
    {en:'Sorry',es:'Lo siento'},{en:'Welcome',es:'Bienvenido'},{en:'Yes',es:'Si'},{en:'No',es:'No'},
    {en:'Excuse me',es:'Disculpa'},{en:'See you',es:'Hasta luego'},{en:'Nice to meet you',es:'Mucho gusto'},
    {en:'Good afternoon',es:'Buenas tardes'},{en:'You are welcome',es:'De nada'},
  ],
  numbers: [
    {en:'One',es:'Uno'},{en:'Two',es:'Dos'},{en:'Three',es:'Tres'},{en:'Four',es:'Cuatro'},
    {en:'Five',es:'Cinco'},{en:'Six',es:'Seis'},{en:'Seven',es:'Siete'},{en:'Eight',es:'Ocho'},
    {en:'Nine',es:'Nueve'},{en:'Ten',es:'Diez'},{en:'Eleven',es:'Once'},{en:'Twelve',es:'Doce'},
    {en:'Twenty',es:'Veinte'},{en:'Hundred',es:'Cien'},{en:'Thousand',es:'Mil'},
  ],
  colors: [
    {en:'Red',es:'Rojo'},{en:'Blue',es:'Azul'},{en:'Green',es:'Verde'},{en:'Yellow',es:'Amarillo'},
    {en:'White',es:'Blanco'},{en:'Black',es:'Negro'},{en:'Pink',es:'Rosado'},{en:'Orange',es:'Naranja'},
    {en:'Purple',es:'Morado'},{en:'Brown',es:'Marron'},{en:'Gray',es:'Gris'},{en:'Gold',es:'Dorado'},
    {en:'Silver',es:'Plateado'},
  ],
  family: [
    {en:'Mother',es:'Madre'},{en:'Father',es:'Padre'},{en:'Brother',es:'Hermano'},{en:'Sister',es:'Hermana'},
    {en:'Son',es:'Hijo'},{en:'Daughter',es:'Hija'},{en:'Baby',es:'Bebe'},{en:'Grandmother',es:'Abuela'},
    {en:'Grandfather',es:'Abuelo'},{en:'Friend',es:'Amigo'},{en:'Uncle',es:'Tio'},{en:'Aunt',es:'Tia'},
    {en:'Cousin',es:'Primo'},{en:'Husband',es:'Esposo'},{en:'Wife',es:'Esposa'},
  ],
  food: [
    {en:'Water',es:'Agua'},{en:'Bread',es:'Pan'},{en:'Milk',es:'Leche'},{en:'Apple',es:'Manzana'},
    {en:'Rice',es:'Arroz'},{en:'Egg',es:'Huevo'},{en:'Coffee',es:'Cafe'},{en:'Juice',es:'Jugo'},
    {en:'Meat',es:'Carne'},{en:'Chicken',es:'Pollo'},{en:'Soup',es:'Sopa'},{en:'Sugar',es:'Azucar'},
    {en:'Salt',es:'Sal'},{en:'Banana',es:'Banano'},{en:'Fish',es:'Pescado'},
  ],
  body: [
    {en:'Head',es:'Cabeza'},{en:'Eye',es:'Ojo'},{en:'Nose',es:'Nariz'},{en:'Mouth',es:'Boca'},
    {en:'Ear',es:'Oreja'},{en:'Hand',es:'Mano'},{en:'Foot',es:'Pie'},{en:'Arm',es:'Brazo'},
    {en:'Leg',es:'Pierna'},{en:'Heart',es:'Corazon'},{en:'Back',es:'Espalda'},{en:'Neck',es:'Cuello'},
    {en:'Finger',es:'Dedo'},{en:'Knee',es:'Rodilla'},{en:'Shoulder',es:'Hombro'},
  ],
  verbs: [
    {en:'Run',es:'Correr'},{en:'Eat',es:'Comer'},{en:'Drink',es:'Beber'},{en:'Sleep',es:'Dormir'},
    {en:'Walk',es:'Caminar'},{en:'Talk',es:'Hablar'},{en:'Read',es:'Leer'},{en:'Write',es:'Escribir'},
    {en:'Study',es:'Estudiar'},{en:'Work',es:'Trabajar'},{en:'Play',es:'Jugar'},{en:'Go',es:'Ir'},
    {en:'Come',es:'Venir'},{en:'Give',es:'Dar'},{en:'Take',es:'Tomar'},{en:'Help',es:'Ayudar'},
    {en:'Learn',es:'Aprender'},
  ],
  adjectives: [
    {en:'Big',es:'Grande'},{en:'Small',es:'Pequeno'},{en:'Good',es:'Bueno'},{en:'Bad',es:'Malo'},
    {en:'Hot',es:'Caliente'},{en:'Cold',es:'Frio'},{en:'New',es:'Nuevo'},{en:'Old',es:'Viejo'},
    {en:'Fast',es:'Rapido'},{en:'Slow',es:'Lento'},{en:'Easy',es:'Facil'},{en:'Difficult',es:'Dificil'},
    {en:'Happy',es:'Feliz'},{en:'Sad',es:'Triste'},{en:'Cheap',es:'Barato'},{en:'Expensive',es:'Caro'},
  ],
};

// Flag global — true cuando el usuario está hablando
window._alexListening = false;

// Reproducir audio desde URL
function playAudio(url, rate, onEnd) {
  if (window._alexListening) { if(onEnd) onEnd(); return; }
  if (_currentAudio) { _currentAudio.pause(); _currentAudio.currentTime = 0; }
  const audio = new Audio(url);
  audio.playbackRate = rate || 1.0;
  _currentAudio = audio;
  audio.onended = onEnd || null;
  audio.onerror = () => { if(onEnd) onEnd(); };
  audio.play().catch(() => { if(onEnd) onEnd(); });
}

// Alex habla en inglés y luego en español
// Caché de audio por texto+idioma. Permite PRECARGAR la palabra mientras suena
// el saludo, para que la práctica arranque al instante (no re-descarga).
const _ttsBlobCache = {};
function ttsBlob(text, lang, token) {
  if (!text || !token) return Promise.resolve(null);
  const key = (lang==='es'?'es:':lang==='slow'?'slow:':'en:') + text;
  if (_ttsBlobCache[key]) return _ttsBlobCache[key];
  const path = lang==='es' ? '/api/tts/speak-es' : lang==='slow' ? '/api/tts/speak-slow' : '/api/tts/speak';
  const p = fetch(API+path, { method:'POST', headers:{'Content-Type':'application/json',Authorization:'Bearer '+token}, body: JSON.stringify({ text }) })
    .then(r => r.ok ? r.blob() : null).catch(() => null)
    .then(b => { if (!b) delete _ttsBlobCache[key]; return b; });   // no cachear fallos (permite reintentar)
  _ttsBlobCache[key] = p;
  return p;
}
// Precargar el audio (inglés + español + versión lenta) de una palabra
function prefetchWord(w, token) { if (w && token) { ttsBlob(w.en, 'en', token); ttsBlob(w.es, 'es', token); ttsBlob(w.en, 'slow', token); } }

// Mensajes de corrección suave cuando el alumno pronuncia mal (se precargan)
const ALEX_CORRECCION = [
  'No, no es así. Estás pronunciando diferente. Escucha con atención e intenta más suave, como lo hago yo.',
  'Casi, pero no es así. Tranquilo. Escúchame de nuevo: primero despacio, y repite suave como yo.',
  'Esa no fue la pronunciación correcta. No te preocupes. Escucha cómo lo digo yo, despacio, e inténtalo otra vez.',
];

// Mr. Alex pronuncia la palabra DESPACIO (modo tortuga), para modelar la pronunciación
function alexSpeakSlow(text, token, onEnd) {
  const mySeq = ++_alexCallSeq;
  let done = false, guard = setTimeout(finish, 9000);
  function finish() { if (done) return; done = true; clearTimeout(guard); if (onEnd && mySeq === _alexCallSeq) onEnd(); }
  if (window._alexListening) { finish(); return; }
  if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
  window.speechSynthesis && window.speechSynthesis.cancel();
  const fallback = () => {
    if (!window.speechSynthesis) { finish(); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.4; u.pitch = 1.0;
    u.onend = finish; u.onerror = finish;
    window.speechSynthesis.speak(u);
  };
  ttsBlob(text, 'slow', token).then(blob => {
    if (mySeq !== _alexCallSeq) { finish(); return; }
    if (!blob) { fallback(); return; }
    const a = new Audio(URL.createObjectURL(blob));
    _currentAudio = a;
    a.onplay = () => { clearTimeout(guard); guard = setTimeout(finish, ((isFinite(a.duration) && a.duration > 0 ? a.duration : 7) * 1000) + 5000); };
    a.onended = finish; a.onerror = finish;
    a.play().catch(finish);
  }).catch(fallback);
}

async function alexSpeakBilingual(enText, esText, token, onEnd, onStart) {
  const mySeq = ++_alexCallSeq; // si se llama stopAlex (cierre del panel), esta reproducción se corta
  // onEnd se llama UNA sola vez. Watchdog: libera el flujo aunque un audio de la
  // secuencia se cuelgue, para que la práctica no quede trabada en "speaking".
  let done = false, guard = null;
  const finish = () => { if (done) return; done = true; if (guard) clearTimeout(guard); if (onEnd && mySeq === _alexCallSeq) onEnd(); };
  guard = setTimeout(finish, 14000);
  // onStart avisa cuando el primer audio EMPIEZA a sonar (no cuando se pide)
  let started = false;
  const fireStart = () => { if (started) return; started = true; if (onStart && mySeq === _alexCallSeq) onStart(); };

  if (window._alexListening) { finish(); return; }
  if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
  window.speechSynthesis && window.speechSynthesis.cancel();

  const fallback = () => {
    if (!window.speechSynthesis) { finish(); return; }
    const u = new SpeechSynthesisUtterance(enText);
    u.lang='en-US'; u.rate=0.72; u.pitch=1.0; u.volume=1;
    u.onstart = fireStart;
    u.onend = finish; u.onerror = finish;
    window.speechSynthesis.speak(u);
  };

  if (!token) { fallback(); return; }

  try {
    // Usa el audio precargado/cacheado si existe (arranque instantáneo); si no, lo pide.
    // En cuanto el inglés está listo, Mr. Alex habla; el español se resuelve en paralelo.
    const pEn = ttsBlob(enText, 'en', token);
    const pEs = ttsBlob(esText, 'es', token);

    const blobEn = await pEn;
    if (mySeq !== _alexCallSeq) { finish(); return; }   // se cerró el panel mientras cargaba
    if (!blobEn) { fallback(); return; }
    const urlEn = URL.createObjectURL(blobEn);

    // Reproduce una URL y llama a next() al terminar (respetando stop / que el usuario hable)
    const playOne = (url, next) => {
      if (mySeq !== _alexCallSeq || window._alexListening) { finish(); return; }
      const audio = new Audio(url);
      _currentAudio = audio;
      audio.onplay = () => {
        fireStart();
        // watchdog rodante: se renueva con cada audio de la secuencia para no cortar a mitad
        const durMs = (isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 8) * 1000;
        if (guard) clearTimeout(guard); guard = setTimeout(finish, durMs + 8000);
      };
      audio.onended = next;
      audio.onerror = next;
      audio.play().catch(next); // si un audio falla, sigue con el resto
    };

    // EN (apenas listo) → pausa → ES → pausa → EN otra vez.
    // Blindaje: si el clip EN falla al arrancar, se reintenta UNA vez antes de seguir —
    // así la enseñanza NUNCA empieza en español (ej: números que sonaban "en español").
    const playEnPrimero = (next) => {
      if (mySeq !== _alexCallSeq || window._alexListening) { finish(); return; }
      const audio = new Audio(urlEn);
      _currentAudio = audio;
      let reintento = false;
      audio.onplay = () => {
        fireStart();
        const durMs = (isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 8) * 1000;
        if (guard) clearTimeout(guard); guard = setTimeout(finish, durMs + 8000);
      };
      audio.onended = next;
      audio.onerror = () => { if (!reintento) { reintento = true; setTimeout(()=>{ try { audio.currentTime = 0; audio.play().catch(next); } catch(e){ next(); } }, 250); } else next(); };
      audio.play().catch(() => { if (!reintento) { reintento = true; setTimeout(()=>audio.play().catch(next), 300); } else next(); });
    };
    playEnPrimero(async () => {
      if (mySeq !== _alexCallSeq) { finish(); return; }
      const blobEs = await pEs;                          // normalmente ya está listo
      if (mySeq !== _alexCallSeq) { finish(); return; }
      const urlEs = blobEs ? URL.createObjectURL(blobEs) : null;
      const replayEn = () => setTimeout(() => playOne(urlEn, finish), 700);
      if (urlEs) setTimeout(() => playOne(urlEs, replayEn), 600);
      else replayEn();                                   // si el español falló, solo repite el inglés
    });

  } catch { fallback(); }
}

// Cache de audio para no repetir llamadas
const _ttsCache = {};
let _currentAudio = null;
let _alexCallSeq = 0; // identifica cada reproducción; stopAlex lo cambia para cortar lo que esté sonando

// Detiene TODA la voz de Mr. Alex: el audio actual, las secuencias en curso y la voz del navegador
function stopAlex() {
  _alexCallSeq++;
  if (_currentAudio) { try { _currentAudio.pause(); _currentAudio.currentTime = 0; } catch(e){} _currentAudio = null; }
  window.speechSynthesis && window.speechSynthesis.cancel();
  window.responsiveVoice && window.responsiveVoice.cancel();
}

function alexSpeak(text, rate, onEnd, lang, onStart) {
  const mySeq = ++_alexCallSeq; // si se llama stopAlex (cierre del panel), esta reproducción se corta
  // onEnd se llama UNA sola vez. Watchdog: si el audio nunca dispara su evento
  // de fin (bug de Web Speech, blob inválido o red lenta), el flujo se libera igual
  // para que la práctica del aula no se quede trabada esperando para siempre.
  let done = false, guard = null;
  const finish = () => { if (done) return; done = true; if (guard) clearTimeout(guard); if (onEnd && mySeq === _alexCallSeq) onEnd(); };
  guard = setTimeout(finish, 9000);
  // onStart avisa cuando el audio EMPIEZA a sonar de verdad (no cuando se pide),
  // para que el orbe muestre "hablando" solo al oírse, no antes.
  let started = false;
  const fireStart = () => { if (started) return; started = true; if (onStart && mySeq === _alexCallSeq) onStart(); };

  if (window._alexListening) { finish(); return; }

  // Cancelar audio previo
  if (_currentAudio) { _currentAudio.pause(); _currentAudio.currentTime = 0; _currentAudio = null; }
  window.speechSynthesis && window.speechSynthesis.cancel();
  window.responsiveVoice && window.responsiveVoice.cancel();

  const speakWS = () => {
    if (!window.speechSynthesis) { finish(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'es' ? 'es-ES' : 'en-US'; u.rate=rate || 0.80; u.pitch=1.0; u.volume=1;
    u.onstart = () => { fireStart(); clearTimeout(guard); guard = setTimeout(finish, Math.max(9000, text.length * 130)); };
    u.onend = finish; u.onerror = finish;
    window.speechSynthesis.speak(u);
  };

  const playUrl = (url) => {
    if (window._alexListening || mySeq !== _alexCallSeq) { finish(); return; } // cerró el panel / se pidió detener
    const audio = new Audio(url);
    audio.playbackRate = rate || 0.95;
    _currentAudio = audio;
    // El watchdog se recalcula al EMPEZAR a sonar, según la duración real del audio:
    // antes contaba 9s desde la petición y cortaba frases largas a la mitad.
    audio.onplay = () => {
      fireStart();
      const durMs = (isFinite(audio.duration) && audio.duration > 0 ? audio.duration : Math.max(3, text.length * 0.09)) * 1000 / (audio.playbackRate || 1);
      clearTimeout(guard); guard = setTimeout(finish, durMs + 5000);
    };
    audio.onended = finish;
    audio.onerror = finish;
    audio.play().catch(finish);
  };

  const token = window._alexToken || '';
  if (!token) { speakWS(); return; }   // sin token: voz del navegador

  // Español va a su propio endpoint para NO mezclar idiomas en un mismo audio
  const endpoint = lang === 'es' ? '/api/tts/speak-es' : '/api/tts/speak';

  // Usar cache si existe (la clave incluye idioma para no cruzar audios)
  const cacheKey = (lang === 'es' ? 'es:' : 'en:') + text.substring(0,50);
  if (_ttsCache[cacheKey]) { playUrl(_ttsCache[cacheKey]); return; }

  // Llamar al backend de TTS (con fallback a la voz del navegador si falla)
  const pedirTTS = () => fetch(API+endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ text }),
  })
  .then(r => { if (!r.ok) throw new Error('TTS error'); return r.blob(); })
  .then(blob => { const url = URL.createObjectURL(blob); _ttsCache[cacheKey] = url; playUrl(url); })
  .catch(speakWS);

  // Si este audio fue PRECARGADO con ttsBlob (repaso/práctica), suena AL INSTANTE sin re-descargar.
  // (Antes alexSpeak ignoraba esa precarga y volvía a pedir el audio: esa era la demora.)
  const blobKey = (lang === 'es' ? 'es:' : 'en:') + text;
  if (_ttsBlobCache[blobKey]) {
    _ttsBlobCache[blobKey]
      .then(b => { if (mySeq !== _alexCallSeq) { finish(); return; } if (b) { const url = URL.createObjectURL(b); _ttsCache[cacheKey] = url; playUrl(url); } else pedirTTS(); })
      .catch(pedirTTS);
    return;
  }
  pedirTTS();
}

function MrAlexOrb({ size, state }) {
  size = size || 160;
  state = state || 'idle';
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const phRef = useRef(0);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    if (state === 'idle') return;
    const slow = state === 'thinking' || state === 'listening';
    const spd = slow ? 0.035 : 0.11;
    const r = cvs.width / 2;
    const draw = () => {
      ctx.clearRect(0,0,cvs.width,cvs.height);
      ctx.save(); ctx.beginPath(); ctx.arc(r,r,r,0,Math.PI*2); ctx.clip();
      for (let i=0;i<32;i++) {
        const a=(i/32)*Math.PI*2;
        const h=slow?(3+Math.abs(Math.sin(phRef.current*2.5+i))*8):(5+Math.abs(Math.sin(phRef.current*3.5+i*1.3))*20);
        const ox=r+Math.cos(a)*(r*.52), oy=r+Math.sin(a)*(r*.52);
        ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+Math.cos(a)*h, oy+Math.sin(a)*h);
        ctx.strokeStyle=slow?'#06b6d4':'#6366f1'; ctx.lineWidth=2.5; ctx.lineCap='round'; ctx.stroke();
      }
      for (let j=0;j<18;j++) {
        const a=(j/18)*Math.PI*2;
        const h=slow?3:(3+Math.abs(Math.sin(phRef.current*5+j*2))*12);
        const ox=r+Math.cos(a)*(r*.27), oy=r+Math.sin(a)*(r*.27);
        ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+Math.cos(a)*h, oy+Math.sin(a)*h);
        ctx.strokeStyle='#8b5cf6'; ctx.lineWidth=2; ctx.lineCap='round'; ctx.stroke();
      }
      ctx.restore(); phRef.current+=spd;
      rafRef.current=requestAnimationFrame(draw);
    };
    for(let i=0; i<1; i++) { draw(); }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [state]);

  const inset=Math.round(size*.24);
  const coreSize=size-inset*2;
  return (
    <div style={{position:'relative',width:size,height:size}}>
      {[0,Math.round(size*.086),Math.round(size*.172)].map((ins,i)=>(
        <div key={i} style={{
          position:'absolute',top:ins,left:ins,right:ins,bottom:ins,
          borderRadius:'50%',border:'2.5px solid transparent',pointerEvents:'none',
          ...(i===0?{borderTopColor:'#6366f1',borderRightColor:'#6366f1',animation:'maRot 3s linear infinite'}
            :i===1?{borderLeftColor:'#06b6d4',borderBottomColor:'#06b6d4',animation:'maRot 5s linear infinite reverse'}
            :{borderTopColor:'#8b5cf6',borderRightColor:'#8b5cf6',animation:'maRot 8s linear infinite'})
        }}/>
      ))}
      <div style={{
        position:'absolute',top:inset,left:inset,right:inset,bottom:inset,
        borderRadius:'50%',background:'#020617',
        border:'1.5px solid rgba(99,102,241,.55)',
        boxShadow:'0 0 35px rgba(99,102,241,.22)',
        display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'
      }}>
        <canvas ref={canvasRef} width={coreSize} height={coreSize}
          style={{position:'absolute',inset:0,width:'100%',height:'100%',borderRadius:'50%',
            opacity:state==='idle'?0:1,transition:'opacity .4s'}}/>
        <span style={{fontSize:size*.22,position:'relative',zIndex:2,
          opacity:state==='idle'?1:0,transition:'opacity .3s'}}>🎓</span>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <div onClick={onClick}
      onMouseEnter={e=>e.currentTarget.style.background=danger?'rgba(239,68,68,.1)':'rgba(139,92,246,.12)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
      style={{display:'flex',alignItems:'center',gap:10,padding:'10px',borderRadius:10,cursor:'pointer',transition:'background .15s'}}>
      <span style={{fontSize:'.98rem'}}>{icon}</span>
      <span style={{fontSize:'.84rem',fontWeight:600,color:danger?'#f87171':'#e2e8f0'}}>{label}</span>
    </div>
  );
}

/* ── Rutinas temáticas del Repaso: cada tema tiene su escena de conversación con Mr. Alex ──
   (el de comida es "Hora de comer"; los demás siguen la misma idea, cada uno con su ambiente) */
const RUTINAS_REPASO = [
  // (el orden importa: patrones específicos antes que los generales)
  { re:/salud y|s[ií]ntoma|health|medicin|estilo de vida/i, emoji:'🏥', titulo:'En el doctor', qs:['How do you feel today?','You are sick: tell the doctor one symptom.','Give me one health tip in English!'] },
  { re:/greeting|saludo|despedid/i,     emoji:'👋', titulo:'Rutina de saludos',   qs:['Good morning! How do you greet me?','A friend is leaving. Say goodbye to him!','It is night time. Greet me!'] },
  { re:/verb_tobe|to be/i,              emoji:'🤖', titulo:'Yo soy, tú eres',     qs:['Talk about yourself: say a sentence with "I am".','Talk about a friend: say a sentence with "he is" or "she is".','Now say a sentence with "we are" or "you are".'] },
  { re:/phrasal/i,                      emoji:'🧲', titulo:'Phrasal power',       qs:['Use a phrasal verb about your morning!','Say a phrasal verb and its meaning!','One more phrasal verb in a sentence!'] },
  { re:/pasado|\bpast\b/i,              emoji:'⏪', titulo:'Viaje al pasado',     qs:['What did you do yesterday? Use the past!','Where did you go last weekend?','Tell me one more thing you did!'] },
  { re:/condicional|subjuntivo/i,       emoji:'🔮', titulo:'Y si…',               qs:['Complete: if I had a million dollars…','What would you do with more free time?','Make one more sentence with "if"!'] },
  { re:/number|n[uú]mer/i,              emoji:'🔢', titulo:'Rutina de números',   qs:['How old are you? Answer with a number in English.','Count! Say a number you like.','Say one more number, a big one!'] },
  { re:/color/i,                        emoji:'🎨', titulo:'Mundo de colores',    qs:['What color do you see right now?','What is your favorite color?','Tell me one more color in English!'] },
  { re:/family|famili/i,                emoji:'👨‍👩‍👧', titulo:'Mi familia',      qs:['Who lives with you? Say one family member.','Say another family member you love.','Who is the oldest in your family? Use a family word.'] },
  { re:/food|comida|bebida|drink|restaurante/i, emoji:'🍽️', titulo:'Hora de comer', qs:["Good morning! What do you want for breakfast?","It's lunch time! What do you eat for lunch?","Good evening! What's for dinner tonight?"] },
  { re:/body|cuerpo/i,                  emoji:'🧍', titulo:'Rutina del cuerpo',   qs:['Touch your head! Now say a body part in English.','What do you use to walk? Say it in English.','Tell me one more body part!'] },
  { re:/rutina diaria|daily/i,          emoji:'🌅', titulo:'Mi día a día',        qs:['What do you do in the morning?','What do you do after lunch?','Tell me one thing you do at night!'] },
  { re:/compra|shopping/i,              emoji:'🛍️', titulo:'De compras',          qs:['You are in a store: what do you want to buy?','Ask the price of something!','Say one more shopping word!'] },
  { re:/hobbie|tiempo libre|deporte|sport/i, emoji:'⚽', titulo:'Tu tiempo libre', qs:['What do you do in your free time?','What sport or hobby do you like?','Tell me one more activity you enjoy!'] },
  { re:/emocion|sentimiento|animo/i,    emoji:'💛', titulo:'Cómo te sientes',     qs:['How do you feel right now?','What makes you happy?','Say one more emotion in English!'] },
  { re:/animal/i,                       emoji:'🐾', titulo:'Safari de animales',  qs:['What is your favorite animal?','Say an animal that lives in a house.','Now tell me a BIG animal!'] },
  { re:/ambiente|natur|sostenib|desastre/i, emoji:'🌿', titulo:'Planeta verde',   qs:['Say something you see in nature.','How can we help the planet? One idea!','Tell me one more nature word!'] },
  { re:/object|hogar|casa|home|vivienda/i, emoji:'🏠', titulo:'Tour por tu casa', qs:['Look around! Say one thing in your house.','What do you use to sleep? Say it in English.','Tell me one more thing from your home!'] },
  { re:/viaje|vacacion|turismo/i,       emoji:'✈️', titulo:'Aventura de viaje',   qs:['Where do you want to travel?','What do you pack in your suitcase?','Tell me one more travel word!'] },
  { re:/medios|critica|publicidad/i,    emoji:'📺', titulo:'En los medios',       qs:['What news did you see today?','Do you trust advertising? Tell me!','Say one more media word!'] },
  { re:/tecnolog|internet/i,            emoji:'💻', titulo:'Mundo digital',       qs:['What technology do you use every day?','What do you do on the internet?','Say one more tech word!'] },
  { re:/opinion|debate|argument/i,      emoji:'🗣️', titulo:'Tu opinión cuenta',   qs:['Give me your opinion: is English easy?','Do you agree or disagree? Tell me why!','Convince me of something in one sentence!'] },
  { re:/dinero|finanza|econom/i,        emoji:'💰', titulo:'Hablemos de dinero',  qs:['What do you save money for?','What was the last thing you bought?','Say one more money word!'] },
  { re:/negocio|business|laboral/i,     emoji:'💼', titulo:'Modo profesional',    qs:['Describe your dream job!','You are in a meeting: introduce yourself!','Say one more business word!'] },
  { re:/presentacion|discurso|negociacion|persuasion|retoric|diplomacia|eufemismo/i, emoji:'🎤', titulo:'Voz de líder', qs:['Start a presentation: greet your audience!','Convince me with a strong argument!','Close your speech with power!'] },
  { re:/job|profesi|trabajo|carrera/i,  emoji:'👷', titulo:'¿Qué quieres ser?',   qs:['What do you want to be? Say a job in English.','Who teaches at school? Say the job.','Tell me one more profession!'] },
  { re:/narrar|historia|literari|literatur|arte/i, emoji:'📖', titulo:'Cuenta la historia', qs:['Start a story: "one day…"','What happened next? Continue!','Give your story an ending!'] },
  { re:/crimen|justicia|derecho|legal|politic|burocrat/i, emoji:'⚖️', titulo:'Ley y orden', qs:['What is one law everyone knows?','What happens if you break a rule?','Say one more legal word!'] },
  { re:/ciencia|investigacion|psicolog|filosof|etica/i, emoji:'🔬', titulo:'Mente curiosa', qs:['Ask a big question about life!','What science topic interests you?','Share one deep idea in English!'] },
  { re:/escritura|academic|correspondencia|formal/i, emoji:'✍️', titulo:'Pluma experta', qs:['Start a formal letter: "dear…"','Say one formal sentence out loud!','Say one more formal expression!'] },
  { re:/sociedad|urbana|global|cultura|tradicion|intercultural|relacion|social/i, emoji:'🌍', titulo:'Mundo y sociedad', qs:['What tradition do you love?','Describe your community in one sentence!','Say one more culture word!'] },
  { re:/modismo|idiom|expresi|refran|proverbio|humor|juego|binomio|coloquial|nativo|matiz|sutil|falsos|britanic|american|espontane|habla/i, emoji:'🎭', titulo:'Como un nativo', qs:['Use an expression like a native!','Say something funny in English!','Teach me one more expression!'] },
  { re:/pronunciaci/i,                  emoji:'🔊', titulo:'Reto de sonidos',     qs:['Say a difficult word in English!','Repeat it slowly, then fast!','One more hard word, you can do it!'] },
  { re:/vocabulario|precision|maestria|dominio/i, emoji:'🏆', titulo:'Dominio total', qs:['Use an advanced word in a sentence!','Say something with total precision!','One more master-level word!'] },
  { re:/verb/i,                         emoji:'⚡', titulo:'Verbos en acción',    qs:['What do you do every day? Use a verb!','What am I doing right now? Guess with a verb!','Tell me one more action in English!'] },
  { re:/adjective|adjetiv|descri|personalidad|caracter/i, emoji:'✨', titulo:'Describe tu mundo', qs:['Describe your house with one word!','How are you today? Use an adjective.','Say one more describing word, an opposite!'] },
  { re:/preposition|preposici/i,        emoji:'📍', titulo:'¿Dónde está?',        qs:['Where is your phone? Use a position word.','Where is the sky? Answer in English!','Say one more position word!'] },
  { re:/grammar|gramatic|estructur|voz pasiva|conector|colocacion|reporte|formacion|comparativ|superlativ|continuo|indirecto|deduccion/i, emoji:'🧩', titulo:'Arma la frase', qs:['Make a sentence with "I have".','Ask me a question: "do you…?"','Say a sentence with "there is" or "there are".'] },
  { re:/days_months|d[ií]as|mes|month|day|week/i, emoji:'📅', titulo:'Tu calendario', qs:['What day is today?','What is your favorite month?','Say one more day or month in English!'] },
  { re:/\btime\b|la hora|reloj|clock/i, emoji:'⏰', titulo:'¿Qué hora es?',       qs:['What time do you wake up?','What time do you eat dinner?','Say one more time expression!'] },
  { re:/weather|clima/i,                emoji:'🌦️', titulo:'El clima de hoy',     qs:['How is the weather today?','What weather do you like?','Tell me one more weather word!'] },
  { re:/clothes|ropa/i,                 emoji:'👕', titulo:'Elige tu ropa',       qs:['What are you wearing today? Say one piece.','What do you wear when it is cold?','Tell me one more piece of clothing!'] },
  { re:/school|escuela|educacion|estudio|aprendiz/i, emoji:'🎒', titulo:'En la escuela', qs:['What do you take to school? Say one thing.','What do you use to write?','Tell me one more school word!'] },
  { re:/place|lugar|ciudad|city/i,      emoji:'🏙️', titulo:'Por la ciudad',       qs:['Where do you buy food? Say the place.','Where do you go when you are sick?','Tell me one more place in the city!'] },
  { re:/transport|direccion/i,          emoji:'🚗', titulo:'De viaje',            qs:['How do you go to school or work?','Say a transport that flies!','Tell me one more way to travel!'] },
  { re:/phrase|frase/i,                 emoji:'💬', titulo:'Frases mágicas',      qs:['Someone helps you. What do you say?','You need help. Ask politely in English!','Say one more useful phrase!'] },
];
function getRutina(t) {
  const key = ((t && t.id) || '') + ' ' + ((t && t.name) || '');
  const hit = RUTINAS_REPASO.find(r => r.re.test(key));
  return hit || { emoji:'🎬', titulo:'Rutina de conversación', qs:['Tell me one word you learned in this topic.','Great! Use another word from this topic in a sentence.','Say one more thing you remember!'] };
}


/* ── ✨ Repaso de los temas aprendidos ──
   SIN conversación: Mr. Alex ENSEÑA cada ejemplo visto (de la BD) → el alumno lo repite →
   él valida según el nivel. Nunca se queda callado: tras enseñar queda escuchando solo,
   y los audios repetidos van cacheados para responder rápido. */
function RepasoAlex({ token, temas, onClose, autoTema, titulo, nivel, nombre }) {
  const NIVEL_IDX = { A1:0, A2:1, B1:2, B2:3, C1:4, C2:5 };
  const nivelIdx = NIVEL_IDX[nivel] ?? 0;          // A1-A2: palabra clave · B1-B2: media oración · C1-C2: casi completa
  const [tema, setTema]           = useState(null);
  const [idx, setIdx]             = useState(0);
  const [reto, setReto]           = useState(null);   // {word, frase, fraseEs}
  const [orb, setOrb]             = useState('idle');
  const [bubble, setBubble]       = useState('');
  const [bType, setBType]         = useState('');
  const [listening, setListening] = useState(false);
  const [fails, setFails]         = useState(0);
  const [fin, setFin]             = useState(false);
  const failsRef = useRef(0);   // intentos fallidos de la palabra ACTUAL (ref: sin closures viejos)
  useEffect(()=>{ if (token) window._alexToken = token; },[token]);   // asegura la voz de Mr. Alex en el repaso
  useEffect(()=>()=>{ stopAlex(); window._alexListening=false; },[]);
  const cerrar = () => { stopAlex(); window._alexListening=false; onClose(); };
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  const cargarReto = async (t, i, conIntro) => {
    const w = t.words[i];
    failsRef.current = 0;
    setReto(null); setFails(0); setBType(''); setOrb('thinking');
    setBubble('📖 Palabra ' + (i+1) + ' de ' + t.words.length + ' — preparando…');
    const tok = window._alexToken || token;
    // El MISMO ejemplo que vio al aprender (EjemploPalabra); FraseReto solo de respaldo
    const pEj = fetch(API+'/api/practice/ejemplo',{method:'POST',headers:authH(tok),body:JSON.stringify({en:w.en,es:w.es})}).then(r=>r.ok?r.json():null).catch(()=>null);
    const pFr = fetch(API+'/api/practice/frase',{method:'POST',headers:authH(tok),body:JSON.stringify({en:w.en,es:w.es})}).then(r=>r.ok?r.json():null).catch(()=>null);
    const [ej, fr] = await Promise.all([pEj, pFr]);
    let frase = (ej && ej.frase) ? String(ej.frase) : null;
    let fraseEs = (ej && ej.fraseEs) ? ej.fraseEs : '';
    if (!frase && fr && fr.prompt && Array.isArray(fr.opts) && typeof fr.ans === 'number') {
      frase = cap(String(fr.prompt).replace(/_+/g, fr.opts[fr.ans] || w.en)); fraseEs = fr.promptEs || '';
    }
    if (!frase) { frase = w.en; fraseEs = w.es; }
    // r lleva el tema y el índice REALES: el avance nunca depende de estado congelado (fix del bucle "me la repite")
    const nP = (nombre || '').trim() || 'campeón';
    const abre = ['¡Perfecto, ' + nP + '!', '¡Muy bien, ' + nP + '!', '¡Excelente, ' + nP + '!'][i % 3];
    const explic = (ej && ej.explicacion) ? String(ej.explicacion) : '';
    const praise = abre + ' Dijiste: ' + (fraseEs || w.es) + '.' + (explic ? ' ' + explic : '') + ' ¡Sigamos!';
    const r = { word:w, frase, fraseEs, explic, abre, praise, t, i };
    setReto(r);
    ttsBlob(praise, 'es', tok);                        // felicitación en español lista ANTES de que hable
    ttsBlob(w.en, 'en', tok); ttsBlob(w.es, 'es', tok);           // palabra + significado
    ttsBlob('Repeat after me: ' + frase, 'en', tok);   // precarga: enseñanza de esta palabra…
    ttsBlob('Perfect! You said: ' + frase, 'en', tok); // …la felicitación con lo que dijo…
    ttsBlob(w.en, 'slow', tok);                        // …su corrección lenta…
    const nx = t.words[i+1]; if (nx) { ttsBlob(nx.en, 'en', tok); ttsBlob(nx.es, 'es', tok); }   // …y adelanta la siguiente
    ensenar(r, conIntro);
  };
  // Mr. Alex enseña COMPLETO: palabra (EN) → significado (ES) → palabra otra vez → oración de ejemplo. Y queda escuchando.
  const ensenar = (r, conIntro) => {
    const dila = () => {
      setBubble('🗣️ ' + r.word.en + ' = ' + r.word.es + ' — "' + r.frase + '"' + (r.fraseEs ? ' (' + r.fraseEs + ')' : ''));
      alexSpeakBilingual(r.word.en, r.word.es, window._alexToken || token, ()=>{
        alexSpeak('Repeat after me: ' + r.frase, 0.88, ()=>{ setBubble('🎤 Repítela tú: "' + r.frase + '"'); setBType(''); hablarCon(r); }, null, ()=>setOrb('speaking'));
      }, ()=>setOrb('speaking'));
    };
    if (conIntro) alexSpeak('Veamos qué aprendiste! Te recuerdo cada palabra con su significado y su ejemplo, y tú lo repites. Escucha!', 0.98, dila, 'es', ()=>setOrb('speaking'));
    else dila();
  };
  const empezarTema = (t) => {
    if (!t.completo) return;
    setTema(t); setIdx(0); setFin(false);
    // Precarga TODAS las frases fijas de Mr. Alex (correcciones, ánimos, silencio) para que responda sin demora
    const tok = window._alexToken || token;
    const n0 = (nombre || '').trim(); const nP = n0 || 'campeón';
    [
      'Veamos qué aprendiste! Te recuerdo cada palabra con su significado y su ejemplo, y tú lo repites. Escucha!',
      'Así no. Escucha e intenta más suave, como yo. Tú puedes.',
      'Casi. Vas muy bien, tranquilo. Escucha despacio y repite suave, como yo.',
      'No te rindas, ya casi lo tienes. Escucha una vez más, despacio, y repite conmigo.',
      (n0 ? n0 + ', no' : 'No') + ' te escuché. Tranquilo, intentemos de nuevo. Escucha.',
      'Bien la palabra, ' + nP + '. Ahora dila completa. Escucha y repite conmigo.',
    ].forEach(x => ttsBlob(x, 'es', tok));
    ttsBlob('Perfect!', 'en', tok);
    cargarReto(t, 0, true);
  };
  const terminar = (t) => {
    setFin(true); setOrb('speaking'); setBType('ok');
    setBubble('🏆 ¡Repaso completado! Pronunciaste los ejemplos de las ' + t.words.length + ' palabras de "' + t.name + '".');
    alexSpeak('Felicitaciones! Completaste el repaso del tema ' + t.name + '. Excelente trabajo!', 0.98, ()=>setOrb('idle'), 'es', ()=>setOrb('speaking'));
  };
  const avanzar = (t, i) => {
    const next = i + 1;
    if (next < t.words.length) { setIdx(next); cargarReto(t, next, false); }
    else { setIdx(next); terminar(t); }
  };
  const saltar = () => { if (!tema || fin) return; stopAlex(); window._alexListening=false; if (reto && reto.t) avanzar(reto.t, reto.i); else avanzar(tema, idx); };
  useEffect(()=>{ if (autoTema) empezarTema(autoTema); },[]);   // "Todos los temas": entra directo sin lista

  // Validación según el aula — usa r.t / r.i REALES (nunca estado congelado de React)
  const procesarCon = (r, alts) => {
    if (!r || !r.t) return;
    const w = r.word, frase = r.frase;
    const partes = clean(frase).split(/\s+/).filter(x => x.length > 2);
    const ratio = (a) => { if (!partes.length) return 1; const tx = ' ' + clean(a) + ' '; return partes.filter(x => tx.includes(x)).length / partes.length; };
    const best = alts.reduce((m, a) => Math.max(m, ratio(a)), 0);
    const wordHit = alts.some(a => isMatch(a, w.en));
    // ACEPTA generoso: decir bien la palabra clave cuenta en TODOS los niveles
    // (el reconocedor de voz es ruidoso; el tutor enseña, NO bloquea). También
    // acepta la oración casi completa aunque la palabra se transcriba distinto.
    // Se evalúa TODA la oración: mayoría de la oración dicha = correcto;
    // solo la palabra clave = re-enseña la oración completa (y a la 3ª acepta para no trabar)
    const umbral = nivelIdx >= 4 ? 0.65 : 0.55;
    const fraseOk = best >= umbral || (wordHit && best >= 0.45);
    const soloPalabra = wordHit && !fraseOk;
    const n = (nombre || '').trim() || 'campeón';
    if (fraseOk || (soloPalabra && failsRef.current >= 2)) {
      failsRef.current = 0;
      // SIEMPRE felicita con el nombre y explica TODA la oración que acaba de pronunciar
      const abre = r.abre || ('¡Perfecto, ' + n + '!');
      const pr = r.praise || (abre + ' Dijiste: ' + (r.fraseEs || w.es) + '.' + (r.explic ? ' ' + r.explic : '') + ' ¡Sigamos!');
      setBType('ok'); setBubble('🎉 ' + abre + ' "' + frase + '" = ' + (r.fraseEs || w.es) + (r.explic ? ' · 📘 ' + r.explic : ''));
      setOrb('speaking');
      // Le repite en inglés TODO lo que acaba de decir, y luego se lo explica en español
      alexSpeak('Perfect! You said: ' + frase, 0.9, ()=>{
        alexSpeak(pr, 0.98, ()=>avanzar(r.t, r.i), 'es', ()=>setOrb('speaking'));
      }, null, ()=>setOrb('speaking'));
    } else if (soloPalabra) {
      // Dijo bien la palabra pero NO toda la oración → vuelve y le enseña la oración completa
      const f = ++failsRef.current; setFails(f); setBType('err');
      setBubble('🙌 ¡Bien la palabra, ' + n + '! Ahora TODA la oración: "' + frase + '"' + (r.fraseEs ? ' — ' + r.fraseEs : ''));
      alexSpeak('Bien la palabra, ' + n + '. Ahora dila completa. Escucha y repite conmigo.', 0.98, ()=>{
        alexSpeak(frase, 0.85, ()=>{ setBubble('🎤 La oración completa: "' + frase + '"'); setBType(''); hablarCon(r); }, null, ()=>setOrb('speaking'));
      }, 'es', ()=>setOrb('speaking'));
    } else {
      // ENSEÑA paso a paso y da ánimos: mensaje según el intento → palabra DESPACIO → oración normal → escucha otra vez
      const f = ++failsRef.current; setFails(f); setBType('err');
      setBubble('🙅 Así no. Escucha cómo se dice y repite conmigo: ' + w.en + ' — "' + frase + '"');
      const animo = f >= 3 ? 'No te rindas, ya casi lo tienes. Escucha una vez más, despacio, y repite conmigo.'
                : f === 2 ? 'Casi. Vas muy bien, tranquilo. Escucha despacio y repite suave, como yo.'
                : 'Así no. Escucha e intenta más suave, como yo. Tú puedes.';
      alexSpeak(animo, 0.98, ()=>{
        setBubble('🐢 ' + w.en + ' — despacio…');
        alexSpeakSlow(w.en, token, ()=>{
          setBubble('🔊 "' + frase + '" — ahora normal');
          alexSpeak(frase, 0.85, ()=>{ setBubble('🎤 Ahora tú, con calma: "' + frase + '"'); setBType(''); hablarCon(r); }, null, ()=>setOrb('speaking'));
        });
      }, 'es', ()=>setOrb('speaking'));
    }
  };

  // Escucha automática (con botón 🎤 de respaldo)
  const hablarCon = (r) => {
    if (fin || !r) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setBubble('Usa Chrome para el reconocimiento de voz.'); setBType('err'); setOrb('idle'); return; }
    stopAlex(); window._alexListening = true;
    const rec = new SR();
    rec.lang='en-US'; rec.interimResults=false; rec.maxAlternatives=5;
    let timer=null, got=false;
    rec.onstart = () => { setListening(true); setOrb('listening'); timer=setTimeout(()=>{ try{rec.stop();}catch(e){} },10000); };
    rec.onend   = () => { window._alexListening=false; setListening(false); if(timer)clearTimeout(timer); if(!got) setOrb('idle'); };
    rec.onerror = (e) => {
      window._alexListening=false; setListening(false); setOrb('idle');
      if (e.error==='no-speech') {
        // Silencio del estudiante: lo llama por su nombre, lo anima y le REPITE la enseñanza
        const n = (nombre || '').trim();
        setBType('err'); setBubble('🔇 ' + (n ? n + ', no' : 'No') + ' te escuché. Tranquilo, intentemos de nuevo: "' + r.frase + '"');
        alexSpeak((n ? n + ', no' : 'No') + ' te escuché. Tranquilo, intentemos de nuevo. Escucha.', 0.96, ()=>{
          alexSpeak('Repeat after me: ' + r.frase, 0.88, ()=>{ setBubble('🎤 Repítela tú: "' + r.frase + '"'); setBType(''); hablarCon(r); }, null, ()=>setOrb('speaking'));
        }, 'es', ()=>setOrb('speaking'));
      } else if (e.error==='not-allowed') { setBType('err'); setBubble('🎤 Permite el micrófono en tu navegador y toca el botón.'); }
      else { setBType('err'); setBubble('🎤 Toca el botón 🎤 para responder.'); }
    };
    rec.onresult = (e) => {
      got = true;
      window._alexListening = false;   // resultado recibido: Mr. Alex puede responder AL INSTANTE (sin este reset, su respuesta se saltaba)
      try { rec.stop(); } catch (err) {}
      setOrb('thinking');
      procesarCon(r, Array.from(e.results[0]).map(x=>x.transcript));
    };
    try { rec.start(); } catch(err) { window._alexListening=false; setListening(false); setOrb('idle'); setBubble('🎤 Toca el botón 🎤 para responder.'); }
  };

  const desbloqueados = temas.filter(t=>t.completo).length;
  return (
    <div style={{position:'fixed',inset:0,zIndex:9500,background:'rgba(2,6,23,.88)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:12,fontFamily:"'Poppins',sans-serif"}}>
      <div style={{width:'100%',maxWidth:560,maxHeight:'92vh',overflowY:'auto',background:'#0a0f1e',border:'1px solid rgba(99,102,241,.3)',borderRadius:20,padding:'1.3rem',boxSizing:'border-box',boxShadow:'0 0 60px rgba(99,102,241,.25)',position:'relative'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span style={{fontSize:'.8rem',fontWeight:700,color:'#6366f1',letterSpacing:'.08em'}}>MR. ALEX</span>
            <span style={{background:'rgba(139,92,246,.15)',color:'#c4b5fd',padding:'2px 8px',borderRadius:50,fontSize:'.62rem',fontWeight:700}}>{titulo || (tema ? (getRutina(tema).emoji + ' ' + getRutina(tema).titulo) : '🧠 Repaso de los temas aprendidos')}</span>
            {tema && !fin && <span style={{background:'rgba(16,185,129,.15)',color:'#34d399',padding:'2px 8px',borderRadius:50,fontSize:'.62rem',fontWeight:700}}>{Math.min(idx+1, tema.words.length)}/{tema.words.length}</span>}
          </div>
          <button onClick={cerrar} style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.25)',color:'#ef4444',width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:12}}>✕</button>
        </div>

        {temas.length === 0 ? (
          <div style={{textAlign:'center',padding:'1.6rem .4rem'}}>
            <div style={{fontSize:'2.4rem'}}>⏳</div>
            <div style={{color:'#e2e8f0',fontWeight:800,fontSize:'1rem',margin:'10px 0 6px'}}>Cargando tus temas…</div>
            <div style={{color:'#94a3b8',fontSize:'.82rem',lineHeight:1.6}}>Si no aparecen, cierra y vuelve a abrir el repaso.</div>
            <button onClick={cerrar} style={{marginTop:16,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',padding:'11px 22px',borderRadius:12,fontWeight:700,fontSize:'.85rem',cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Entendido</button>
          </div>
        ) : !tema ? (
          <>
            {desbloqueados === 0 && (
              <div style={{display:'flex',alignItems:'center',gap:10,background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.3)',borderRadius:12,padding:'10px 13px',marginBottom:12}}>
                <span style={{fontSize:'1.2rem'}}>🔒</span>
                <div style={{color:'#fbbf24',fontSize:'.74rem',lineHeight:1.5,fontWeight:600}}>Completa tu primer tema con Mr. Alex para desbloquear su repaso aquí.</div>
              </div>
            )}
            <div style={{color:'#94a3b8',fontSize:'.8rem',lineHeight:1.6,marginBottom:14}}>Repasas <b style={{color:'#c4b5fd'}}>solo lo que ya aprendiste</b>: Mr. Alex te <b style={{color:'#c4b5fd'}}>enseña cada ejemplo que viste</b> y tú lo <b style={{color:'#c4b5fd'}}>pronuncias</b>. Él te dice si es correcto.</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {temas.map(t=>(
                <button key={t.id} onClick={()=>empezarTema(t)} disabled={!t.completo}
                  style={{display:'flex',alignItems:'center',gap:11,background:t.completo?'rgba(255,255,255,.04)':'rgba(255,255,255,.02)',border:'1.5px solid '+(t.completo?'rgba(16,185,129,.3)':'rgba(255,255,255,.06)'),borderRadius:14,padding:'11px 13px',cursor:t.completo?'pointer':'not-allowed',fontFamily:"'Poppins',sans-serif",textAlign:'left',transition:'border-color .15s',opacity:t.completo?1:.5}}
                  onMouseEnter={e=>{ if(t.completo) e.currentTarget.style.borderColor='rgba(139,92,246,.65)'; }}
                  onMouseLeave={e=>{ if(t.completo) e.currentTarget.style.borderColor='rgba(16,185,129,.3)'; }}>
                  <span style={{fontSize:'1.4rem'}}>{t.icon}</span>
                  <span style={{flex:1}}>
                    <span style={{display:'block',color:t.completo?'#f1f5f9':'#94a3b8',fontWeight:700,fontSize:'.85rem'}}>{t.name}</span>
                    <span style={{display:'block',color:t.completo?'#34d399':'#64748b',fontSize:'.68rem',marginTop:1}}>{t.completo ? (getRutina(t).emoji + ' ' + getRutina(t).titulo + ' · ' + t.words.length + ' palabras') : ('🔒 Completa este tema para desbloquear su repaso')}</span>
                  </span>
                  <span style={{color:'#475569'}}>{t.completo?'›':'🔒'}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{width:'100%',background:'#1e293b',height:7,borderRadius:8,overflow:'hidden',marginBottom:12}}>
              <div style={{width:(fin?100:Math.round((idx/tema.words.length)*100))+'%',height:'100%',background:'linear-gradient(90deg,#6366f1,#06b6d4,#10b981)',transition:'width .4s ease'}}/>
            </div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:12}}>
              <MrAlexOrb size={110} state={orb}/>
              <div style={{fontSize:'.62rem',color:'#64748b',marginTop:6}}>{orb==='idle'?'listo':orb==='listening'?'escuchando...':orb==='speaking'?'hablando...':'procesando...'}</div>
              <div style={{background:bType==='ok'?'rgba(16,185,129,.1)':bType==='err'?'rgba(239,68,68,.1)':'rgba(99,102,241,.08)',border:'1px solid '+(bType==='ok'?'#10b981':bType==='err'?'#ef4444':'rgba(99,102,241,.25)'),borderRadius:14,padding:'10px 14px',fontSize:'.8rem',color:bType==='ok'?'#34d399':bType==='err'?'#f87171':'#e2e8f0',maxWidth:420,textAlign:'center',marginTop:10,lineHeight:1.5}}>{bubble}</div>
            </div>
            {!fin && reto && (
              <div style={{background:'#020617',border:'1px solid rgba(16,185,129,.35)',borderRadius:14,padding:'0.9rem',textAlign:'center',marginBottom:12}}>
                <div style={{fontSize:'1rem',fontWeight:800,color:'#6ee7b7',lineHeight:1.5}}>🗣️ {reto.frase}</div>
                {reto.fraseEs && <div style={{fontSize:'.72rem',color:'#94a3b8',marginTop:4}}>{reto.fraseEs}</div>}
              </div>
            )}
            {fin ? (
              <div style={{display:'flex',gap:8}}>
                {!autoTema && <button onClick={()=>{ setTema(null); setReto(null); setBubble(''); setBType(''); setOrb('idle'); }} style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.14)',color:'#e2e8f0',padding:'12px',borderRadius:12,fontWeight:700,fontSize:'.82rem',cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Otro tema 🧠</button>}
                <button onClick={cerrar} style={{flex:1,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',padding:'12px',borderRadius:12,fontWeight:700,fontSize:'.82rem',cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Terminar 🏆</button>
              </div>
            ) : (
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>hablarCon(reto)} disabled={listening || !reto}
                  style={{flex:2,background:(listening||!reto)?'#334155':'linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)',color:'#fff',border:'none',padding:'13px',borderRadius:12,fontWeight:700,fontSize:'.88rem',cursor:(listening||!reto)?'default':'pointer',fontFamily:"'Poppins',sans-serif",boxShadow:(listening||!reto)?'none':'0 0 16px rgba(139,92,246,.4)'}}>
                  {listening?'🎙️ Escuchando…':'🎤 Pronunciar'}
                </button>
                <button onClick={saltar} style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.14)',color:'#94a3b8',padding:'13px',borderRadius:12,fontWeight:600,fontSize:'.78rem',cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Saltar ⏭</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── 🌟 "Todos los temas": juego rápido y divertido sobre TODO lo aprendido del nivel ──
   3 tipos de ronda que rotan: ✅❌ falso/verdadero, 🧩 completa la oración (retos de la BD)
   y 🖼️ emoji+significado → elige la palabra. 10 rondas al azar, racha, puntaje y repetir. */
function TodosQuiz({ token, words, nivel, nombre, onClose }) {
  const [rounds, setRounds]   = useState([]);
  const [idx, setIdx]         = useState(0);
  const [fb, setFb]           = useState(null);    // {ok, txt} feedback de la ronda
  const [score, setScore]     = useState(0);
  const [streak, setStreak]   = useState(0);
  const [best, setBest]       = useState(0);
  const [fin, setFin]         = useState(false);
  const [cargando, setCargando] = useState(true);
  const N = 10;
  useEffect(()=>{ if (token) window._alexToken = token; },[token]);
  useEffect(()=>()=>{ stopAlex(); window._alexListening=false; },[]);
  const cerrar = () => { stopAlex(); onClose(); };
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  const armar = async () => {
    setCargando(true); setFin(false); setIdx(0); setScore(0); setStreak(0); setBest(0); setFb(null);
    const pool = [...words].sort(()=>Math.random()-.5).slice(0, Math.min(N, words.length));
    const tok = window._alexToken || token;
    const rs = await Promise.all(pool.map(async (w, i) => {
      const tipo = ['vf','opt','word'][i % 3];
      ttsBlob(w.en, 'en', tok);   // pronunciación lista para el momento de la respuesta
      if (tipo === 'vf') {
        const verdadero = Math.random() < 0.5;
        let mostrado = w.es;
        if (!verdadero) {
          const otras = words.filter(x => x.en !== w.en && x.es !== w.es);
          mostrado = otras.length ? otras[Math.floor(Math.random()*otras.length)].es : w.es + ' (no)';
        }
        return { tipo, w, mostrado, correcta: verdadero };
      }
      if (tipo === 'opt') {
        try {
          const r = await fetch(API+'/api/practice/frase',{method:'POST',headers:authH(tok),body:JSON.stringify({en:w.en,es:w.es})});
          const fr = r.ok ? await r.json() : null;
          if (fr && fr.prompt && /_{2,}/.test(fr.prompt) && Array.isArray(fr.opts) && fr.opts.length === 3 && typeof fr.ans === 'number') {
            return { tipo, w, prompt: fr.prompt, promptEs: fr.promptEs || '', opts: fr.opts, ans: fr.ans };
          }
        } catch(e) {}
      }
      const distr = words.filter(x => x.en !== w.en).sort(()=>Math.random()-.5).slice(0,2).map(x=>x.en);
      const opts = [w.en, ...distr].sort(()=>Math.random()-.5);
      return { tipo:'word', w, opts, ans: opts.indexOf(w.en) };
    }));
    setRounds(rs); setCargando(false);
  };
  useEffect(()=>{ armar(); },[]);

  const responder = (esCorrecta) => {
    if (fb || fin) return;
    const r = rounds[idx];
    stopAlex();
    if (esCorrecta) { setScore(s=>s+1); setStreak(s=>{ const n=s+1; setBest(b=>Math.max(b,n)); return n; }); }
    else setStreak(0);
    setFb({ ok: esCorrecta, txt: esCorrecta ? '✅ ¡Correcto!' : ('❌ Era: ' + (r.tipo==='vf' ? (r.correcta?'Verdadero':'Falso') + ' — "' + r.w.en + '" = ' + r.w.es : r.tipo==='opt' ? cap(String(r.prompt).replace(/_+/g, r.opts[r.ans])) : r.w.en + ' = ' + r.w.es)) });
    alexSpeak(r.w.en, 0.9);   // pronuncia la palabra (precargada) — se aprende hasta jugando
    setTimeout(()=>{
      setFb(null);
      if (idx + 1 < rounds.length) setIdx(idx + 1);
      else {
        setFin(true);
        const nP = (nombre||'').trim() || 'campeón';
        alexSpeak('¡' + nP + ', terminaste! ' + 'Acertaste ' + (esCorrecta?score+1:score) + ' de ' + rounds.length + '. ¡Buen repaso!', 0.98, null, 'es');
      }
    }, esCorrecta ? 1100 : 2100);
  };

  const r = rounds[idx];
  const btn = (extra) => Object.assign({ background:'rgba(255,255,255,.05)', border:'1.5px solid rgba(255,255,255,.14)', color:'#e2e8f0', borderRadius:12, padding:'13px 14px', fontWeight:700, fontSize:'.9rem', cursor:'pointer', fontFamily:"'Poppins',sans-serif", textAlign:'center', transition:'border-color .15s' }, extra||{});
  return (
    <div style={{position:'fixed',inset:0,zIndex:9500,background:'rgba(2,6,23,.88)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:12,fontFamily:"'Poppins',sans-serif"}}>
      <div style={{width:'100%',maxWidth:560,maxHeight:'92vh',overflowY:'auto',background:'#0a0f1e',border:'1px solid rgba(245,158,11,.35)',borderRadius:20,padding:'1.3rem',boxSizing:'border-box',boxShadow:'0 0 60px rgba(245,158,11,.18)',position:'relative'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span style={{fontSize:'.8rem',fontWeight:700,color:'#f59e0b',letterSpacing:'.08em'}}>MR. ALEX</span>
            <span style={{background:'rgba(245,158,11,.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:50,fontSize:'.62rem',fontWeight:700}}>🌟 Todos los temas · {nivel}</span>
            {!fin && !cargando && <span style={{background:'rgba(16,185,129,.15)',color:'#34d399',padding:'2px 8px',borderRadius:50,fontSize:'.62rem',fontWeight:700}}>Ronda {Math.min(idx+1, rounds.length)}/{rounds.length}</span>}
            {streak >= 2 && !fin && <span style={{background:'rgba(239,68,68,.15)',color:'#f87171',padding:'2px 8px',borderRadius:50,fontSize:'.62rem',fontWeight:800}}>🔥 Racha {streak}</span>}
          </div>
          <button onClick={cerrar} style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.25)',color:'#ef4444',width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:12}}>✕</button>
        </div>

        {cargando ? (
          <div style={{textAlign:'center',padding:'2.2rem 0'}}>
            <div style={{fontSize:'2.2rem'}}>🎲</div>
            <div style={{color:'#94a3b8',fontSize:'.85rem',marginTop:8}}>Armando tu juego con todo lo aprendido…</div>
          </div>
        ) : fin ? (
          <div style={{textAlign:'center',padding:'1.2rem 0'}}>
            <div style={{fontSize:'2.8rem'}}>{score >= rounds.length*0.8 ? '🏆' : score >= rounds.length*0.5 ? '🌟' : '💪'}</div>
            <div style={{color:'#f1f5f9',fontWeight:900,fontSize:'1.3rem',margin:'8px 0 4px'}}>{score}/{rounds.length} correctas</div>
            <div style={{color:'#94a3b8',fontSize:'.82rem'}}>Mejor racha: 🔥 {best} · Nivel {nivel}</div>
            <div style={{display:'flex',gap:8,marginTop:18}}>
              <button onClick={armar} style={{flex:1,background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#fff',border:'none',padding:'13px',borderRadius:12,fontWeight:800,fontSize:'.88rem',cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>🎲 Jugar otra vez</button>
              <button onClick={cerrar} style={{flex:1,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.14)',color:'#e2e8f0',padding:'13px',borderRadius:12,fontWeight:700,fontSize:'.88rem',cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Terminar</button>
            </div>
          </div>
        ) : r ? (
          <>
            <div style={{display:'flex',gap:4,marginBottom:14}}>
              {rounds.map((_,i)=>(<div key={i} style={{flex:1,height:5,borderRadius:5,background: i<idx ? '#34d399' : i===idx ? 'linear-gradient(90deg,#f59e0b,#d946ef)' : 'rgba(255,255,255,.12)'}}/>))}
            </div>
            <div style={{textAlign:'center',marginBottom:12}}>
              <div style={{fontSize:'3rem',lineHeight:1,marginBottom:6}}>{r.w.icon || '⭐'}</div>
              {r.tipo === 'vf' && (<>
                <div style={{fontSize:'.68rem',color:'#f59e0b',fontWeight:800,letterSpacing:'.06em',marginBottom:6}}>¿VERDADERO O FALSO?</div>
                <div style={{fontSize:'1.05rem',fontWeight:800,color:'#f1f5f9',lineHeight:1.5}}>"{r.w.en}" significa "{r.mostrado}"</div>
              </>)}
              {r.tipo === 'opt' && (<>
                <div style={{fontSize:'.68rem',color:'#f59e0b',fontWeight:800,letterSpacing:'.06em',marginBottom:6}}>COMPLETA LA ORACIÓN</div>
                <div style={{fontSize:'1.05rem',fontWeight:800,color:'#f1f5f9',lineHeight:1.5}}>{r.prompt}</div>
                {r.promptEs && <div style={{fontSize:'.72rem',color:'#94a3b8',marginTop:4}}>{r.promptEs}</div>}
              </>)}
              {r.tipo === 'word' && (<>
                <div style={{fontSize:'.68rem',color:'#f59e0b',fontWeight:800,letterSpacing:'.06em',marginBottom:6}}>¿CÓMO SE DICE EN INGLÉS?</div>
                <div style={{fontSize:'1.15rem',fontWeight:800,color:'#f1f5f9'}}>"{r.w.es}"</div>
              </>)}
            </div>
            {fb ? (
              <div style={{background:fb.ok?'rgba(16,185,129,.12)':'rgba(239,68,68,.12)',border:'1px solid '+(fb.ok?'rgba(16,185,129,.4)':'rgba(239,68,68,.4)'),borderRadius:12,padding:'14px',textAlign:'center',color:fb.ok?'#34d399':'#f87171',fontWeight:800,fontSize:'.92rem'}}>{fb.txt}</div>
            ) : r.tipo === 'vf' ? (
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>responder(r.correcta === true)} style={btn({flex:1,borderColor:'rgba(16,185,129,.4)'})} onMouseEnter={e=>e.currentTarget.style.borderColor='#34d399'} onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(16,185,129,.4)'}>✅ Verdadero</button>
                <button onClick={()=>responder(r.correcta === false)} style={btn({flex:1,borderColor:'rgba(239,68,68,.4)'})} onMouseEnter={e=>e.currentTarget.style.borderColor='#f87171'} onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(239,68,68,.4)'}>❌ Falso</button>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {r.opts.map((o,i)=>(
                  <button key={i} onClick={()=>responder(i === r.ans)} style={btn({textAlign:'left'})}
                    onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(245,158,11,.7)'} onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.14)'}>
                    {String.fromCharCode(65+i)}. {o}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function Home({ onEmpezar, user, onLogout, onAdmin }) {
  const [cursosOpen, setCursosOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [showPerfil, setShowPerfil] = useState(false);
  // Buzón de sugerencias → llega a hola@nexlum.co
  const [sug, setSug]           = useState({ nombre:'', email:'', mensaje:'' });
  const [sugState, setSugState] = useState('');   // ''|'sending'|'sent'
  const [sugErr, setSugErr]     = useState('');
  const enviarSugerencia = async () => {
    if ((sug.mensaje || '').trim().length < 5) { setSugErr('Escribe tu sugerencia (mínimo 5 caracteres).'); return; }
    setSugErr(''); setSugState('sending');
    try {
      const r = await fetch(API + '/api/sugerencias', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(sug) });
      const d = await r.json().catch(()=>({}));
      if (r.ok) setSugState('sent');
      else { setSugState(''); setSugErr(d.msg || 'No se pudo enviar. Intenta de nuevo.'); }
    } catch { setSugState(''); setSugErr('Error de conexión. Intenta de nuevo.'); }
  };
  const NIVEL_INFO = { A1:['Principiante','#10b981'], A2:['Elemental','#06b6d4'], B1:['Intermedio','#6366f1'], B2:['Intermedio alto','#8b5cf6'], C1:['Avanzado','#d946ef'], C2:['Maestría','#f59e0b'] };
  const iniciales = (n) => (n||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const canvasRef = useRef(null);
  useEffect(()=>{
    const cvs = canvasRef.current; if(!cvs) return;
    const ctx = cvs.getContext('2d'); let raf;
    const resize=()=>{cvs.width=window.innerWidth;cvs.height=window.innerHeight;};
    resize(); window.addEventListener('resize',resize);
    const pts=Array.from({length:60},()=>({
      x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,
      sx:(Math.random()-.5)*.5,sy:(Math.random()-.5)*.5,
      size:Math.random()*2+.5,op:Math.random()*.5+.1,
      color:['#6366f1','#06b6d4','#f59e0b','#8b5cf6'][Math.floor(Math.random()*4)]
    }));
    const draw=()=>{
      ctx.clearRect(0,0,cvs.width,cvs.height);
      pts.forEach(p=>{
        p.x+=p.sx;p.y+=p.sy;
        if(p.x>cvs.width)p.x=0;if(p.x<0)p.x=cvs.width;
        if(p.y>cvs.height)p.y=0;if(p.y<0)p.y=cvs.height;
        ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
        ctx.fillStyle=p.color;ctx.globalAlpha=p.op;ctx.fill();ctx.globalAlpha=1;
      });
      pts.forEach((a,i)=>pts.slice(i+1).forEach(b=>{
        const d=Math.hypot(a.x-b.x,a.y-b.y);
        if(d<100){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
          ctx.strokeStyle='rgba(99,102,241,'+(0.1*(1-d/100))+')';ctx.lineWidth=.5;ctx.stroke();}
      }));
      raf=requestAnimationFrame(draw);
    };
    draw();
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);};
  },[]);

  return (
    <div style={{background:'#020617',minHeight:'100vh',fontFamily:"'Poppins',sans-serif",color:'#e2e8f0',overflowX:'hidden'}}>
      <style>{KF}</style>
      <canvas ref={canvasRef} style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}/>
      <nav style={{position:'fixed',top:0,left:0,width:'100%',zIndex:1000,height:62,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 2rem',background:'rgba(10,14,26,.45)',backdropFilter:'blur(22px) saturate(1.4)',WebkitBackdropFilter:'blur(22px) saturate(1.4)',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:36,height:36,background:'linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem'}}>🎓</div>
          <span style={{fontWeight:700,fontSize:'1.15rem',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>AulaQuest</span>
        </div>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          <span onMouseEnter={e=>{e.currentTarget.style.background='rgba(139,92,246,.12)';e.currentTarget.style.color='#c4b5fd';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#94a3b8';}} style={{color:'#94a3b8',padding:'.45rem .95rem',borderRadius:9,fontSize:'.88rem',cursor:'pointer',fontWeight:600,transition:'all .2s'}}>Inicio</span>
          <div style={{position:'relative'}}>
            <span onClick={()=>setCursosOpen(o=>!o)} style={{color: cursosOpen ? '#a5b4fc' : '#94a3b8',padding:'.45rem .85rem',borderRadius:8,fontSize:'.88rem',cursor:'pointer',fontWeight:500,display:'flex',alignItems:'center',gap:5,background: cursosOpen ? 'rgba(99,102,241,.1)' : 'transparent',transition:'all .2s'}}>
              📚 Cursos <span style={{fontSize:'.65rem',opacity:.7}}>{cursosOpen?'▲':'▼'}</span>
            </span>
            {cursosOpen && (
              <div style={{position:'absolute',top:'calc(100% + 10px)',left:'50%',transform:'translateX(-50%)',background:'rgba(13,17,28,.97)',backdropFilter:'blur(22px) saturate(1.4)',WebkitBackdropFilter:'blur(22px) saturate(1.4)',border:'1px solid rgba(139,92,246,.3)',borderRadius:16,padding:'10px',minWidth:320,zIndex:2000,boxShadow:'0 24px 60px rgba(0,0,0,.7), 0 0 0 1px rgba(139,92,246,.08)'}}>
                <div style={{fontSize:'.72rem',color:'#475569',fontWeight:600,letterSpacing:'.1em',padding:'4px 8px 8px',textTransform:'uppercase'}}>Marco Europeo de Referencia</div>
                {[
                  {lvl:'A1',name:'Principiante',desc:'Palabras básicas y saludos',color:'#10b981',topics:'15 temas · 200+ palabras'},
                  {lvl:'A2',name:'Elemental',desc:'Frases cotidianas simples',color:'#06b6d4',topics:'18 temas · 350+ palabras'},
                  {lvl:'B1',name:'Intermedio',desc:'Conversación básica fluida',color:'#6366f1',topics:'22 temas · 600+ palabras'},
                  {lvl:'B2',name:'Intermedio alto',desc:'Temas complejos con soltura',color:'#8b5cf6',topics:'25 temas · 900+ palabras'},
                  {lvl:'C1',name:'Avanzado',desc:'Expresión precisa y fluida',color:'#d946ef',topics:'28 temas · 1400+ palabras'},
                  {lvl:'C2',name:'Maestría',desc:'Dominio total del idioma',color:'#f59e0b',topics:'30 temas · 2000+ palabras'},
                ].map(({lvl,name,desc,color,topics})=>{
                  const isCurrentLevel = user?.englishLevel===lvl;
                  return (
                  <div key={lvl} style={{display:'flex',alignItems:'center',gap:12,padding:'10px',borderRadius:10,cursor:'pointer',transition:'all .15s',background: isCurrentLevel ? 'rgba(99,102,241,.12)' : 'transparent',border: isCurrentLevel ? '1px solid rgba(99,102,241,.3)' : '1px solid transparent',marginBottom:2}}
                    onMouseEnter={e=>{ if(!isCurrentLevel) e.currentTarget.style.background='rgba(255,255,255,.04)'; }}
                    onMouseLeave={e=>{ if(!isCurrentLevel) e.currentTarget.style.background='transparent'; }}>
                    <div style={{width:36,height:36,borderRadius:10,background:`${color}22`,border:`1px solid ${color}55`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <span style={{fontSize:'.8rem',fontWeight:800,color:color}}>{lvl}</span>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <span style={{color:'#e2e8f0',fontSize:'.85rem',fontWeight:600}}>{name}</span>
                        {isCurrentLevel && <span style={{background:'rgba(99,102,241,.25)',color:'#a5b4fc',fontSize:'.62rem',fontWeight:700,padding:'2px 7px',borderRadius:50,letterSpacing:'.05em'}}>TU NIVEL</span>}
                      </div>
                      <div style={{color:'#64748b',fontSize:'.72rem',marginTop:1}}>{desc}</div>
                    </div>
                    <div style={{fontSize:'.65rem',color:'#475569',whiteSpace:'nowrap'}}>{topics}</div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
        {user ? (
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button onClick={onEmpezar} style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',padding:'.5rem 1.2rem',borderRadius:8,fontWeight:600,fontSize:'.88rem',cursor:'pointer',boxShadow:'0 3px 12px rgba(99,102,241,.3)'}}>Ir al aula</button>
            <div style={{position:'relative'}}>
              <div onClick={()=>setUserMenu(o=>!o)}
                onMouseEnter={e=>{ if(!userMenu) e.currentTarget.style.background='rgba(255,255,255,.06)'; }}
                onMouseLeave={e=>{ if(!userMenu) e.currentTarget.style.background='rgba(255,255,255,.03)'; }}
                style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',padding:'4px 12px 4px 4px',borderRadius:50,border:'1px solid '+(userMenu?'rgba(139,92,246,.5)':'rgba(139,92,246,.22)'),background:userMenu?'rgba(139,92,246,.14)':'rgba(255,255,255,.03)',transition:'all .2s'}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'.72rem',color:'#fff'}}>{iniciales(user.name)}</div>
                <span style={{fontSize:'.82rem',color:'#e2e8f0',fontWeight:600,maxWidth:110,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name}</span>
                <span style={{fontSize:'.58rem',color:'#a5b4fc'}}>{userMenu?'▲':'▼'}</span>
              </div>
              {userMenu && <div onClick={()=>setUserMenu(false)} style={{position:'fixed',inset:0,zIndex:1999}}/>}
              {userMenu && (()=>{ const [ln,lc]=NIVEL_INFO[user.englishLevel]||['','#6366f1']; const esAdmin=user.role==='admin'; return (
                <div style={{position:'absolute',top:'calc(100% + 12px)',right:0,minWidth:264,background:'rgba(13,17,28,.97)',backdropFilter:'blur(22px) saturate(1.4)',WebkitBackdropFilter:'blur(22px) saturate(1.4)',border:'1px solid rgba(139,92,246,.3)',borderRadius:16,padding:10,zIndex:2000,boxShadow:'0 24px 60px rgba(0,0,0,.7), 0 0 0 1px rgba(139,92,246,.08)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:11,padding:'6px 8px 12px'}}>
                    <div style={{width:46,height:46,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'1rem',color:'#fff',flexShrink:0}}>{iniciales(user.name)}</div>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:'.92rem',fontWeight:700,color:'#e2e8f0',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user.name}</div>
                      <div style={{fontSize:'.68rem',color:'#64748b',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user.email}</div>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:9,background:lc+'18',border:'1px solid '+lc+'44',borderRadius:11,padding:'8px 11px',marginBottom:8}}>
                    <span style={{fontSize:'1rem'}}>{esAdmin?'🛡️':'🎓'}</span>
                    <div><div style={{fontSize:'.64rem',color:'#64748b'}}>{esAdmin?'Rol':'Tu aula'}</div><div style={{fontSize:'.82rem',fontWeight:700,color:lc}}>{esAdmin?'Administrador':(user.englishLevel+' — '+ln)}</div></div>
                  </div>
                  {esAdmin
                    ? <MenuItem icon="🛡️" label="Panel de administrador" onClick={()=>{ setUserMenu(false); onAdmin&&onAdmin(); }}/>
                    : <MenuItem icon="👤" label="Ver mi perfil" onClick={()=>{ setUserMenu(false); setShowPerfil(true); }}/>}
                  <MenuItem icon="🚀" label="Ir al aula" onClick={()=>{ setUserMenu(false); onEmpezar(); }}/>
                  <div style={{height:1,background:'rgba(255,255,255,.07)',margin:'6px 6px'}}/>
                  <MenuItem icon="🚪" label="Cerrar sesión" danger onClick={()=>{ setUserMenu(false); onLogout(); }}/>
                </div>
              );})()}
            </div>
          </div>
        ) : (
          <button onClick={onEmpezar} style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',padding:'.5rem 1.2rem',borderRadius:8,fontWeight:600,fontSize:'.88rem',cursor:'pointer',boxShadow:'0 3px 12px rgba(99,102,241,.35)'}}>
            🚀 Empezar
          </button>
        )}
      </nav>

      {showPerfil && user && (()=>{ const [ln,lc]=NIVEL_INFO[user.englishLevel]||['','#6366f1']; return (
        <div onClick={()=>setShowPerfil(false)} style={{position:'fixed',inset:0,zIndex:3000,background:'rgba(2,6,23,.8)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:420,background:'linear-gradient(180deg,rgba(20,24,40,.98),rgba(13,17,28,.98))',border:'1px solid rgba(139,92,246,.3)',borderRadius:22,padding:'1.6rem',boxShadow:'0 30px 80px rgba(0,0,0,.7)',position:'relative'}}>
            <button onClick={()=>setShowPerfil(false)} style={{position:'absolute',top:14,right:14,background:'none',border:'none',color:'#64748b',fontSize:'1.1rem',cursor:'pointer'}}>✕</button>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',marginBottom:16}}>
              <div style={{width:76,height:76,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'1.7rem',color:'#fff',boxShadow:'0 8px 24px rgba(139,92,246,.4)'}}>{iniciales(user.name)}</div>
              <div style={{fontSize:'1.2rem',fontWeight:800,color:'#f1f5f9',marginTop:12}}>{user.name}</div>
              <div style={{fontSize:'.8rem',color:'#64748b'}}>{user.email}</div>
              <div style={{marginTop:8,display:'inline-flex',alignItems:'center',gap:6,background:lc+'1e',border:'1px solid '+lc+'55',color:lc,fontSize:'.72rem',fontWeight:700,padding:'4px 12px',borderRadius:50}}>🎓 Aula {user.englishLevel} — {ln}</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              {[['⭐',(user.experiencePoints||0)+' XP','Experiencia'],['🗣️',(user.wordsCorrect||0),'Palabras correctas'],['🏆',(user.nivelesAprobados||[]).length,'Niveles aprobados'],['📅',user.createdAt?new Date(user.createdAt).toLocaleDateString('es-CO',{month:'short',year:'numeric'}):'—','Miembro desde']].map(([ic,val,lbl])=>(
                <div key={lbl} style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(139,92,246,.15)',borderRadius:12,padding:'12px'}}>
                  <div style={{fontSize:'1.1rem'}}>{ic}</div>
                  <div style={{fontSize:'1.05rem',fontWeight:800,color:'#e2e8f0',marginTop:2}}>{val}</div>
                  <div style={{fontSize:'.64rem',color:'#64748b'}}>{lbl}</div>
                </div>
              ))}
            </div>
            <button onClick={()=>{ setShowPerfil(false); onEmpezar(); }} style={{width:'100%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',padding:'12px',borderRadius:12,fontWeight:700,fontSize:'.9rem',cursor:'pointer'}}>🚀 Ir a mi aula</button>
          </div>
        </div>
      );})()}

      <section style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'8rem 2rem 4rem',position:'relative',zIndex:1}}>
        <div style={{position:'absolute',top:'-50%',left:'-20%',width:800,height:800,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',opacity:.07,borderRadius:'50%',filter:'blur(100px)',animation:'pulse-glow 6s ease-in-out infinite'}}/>
        <div className="aq-2col" style={{maxWidth:1200,width:'100%',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4rem',alignItems:'center'}}>          
          <div style={{animation:'fadeInUp .8s ease'}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:'.5rem',background:'rgba(99,102,241,.15)',border:'1px solid rgba(99,102,241,.3)',padding:'.4rem 1rem',borderRadius:50,fontSize:'.85rem',color:'#6366f1',marginBottom:'1.5rem'}}>
              ⚙️ Aula Virtual Estilo Juego
            </div>
            <h1 style={{fontSize:'3.2rem',fontWeight:900,lineHeight:1.1,marginBottom:'1.5rem'}}>
              Aprende, Juega y{' '}
              <span style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                Sube de Nivel
              </span>{' '}con tu Avatar
            </h1>
            <p style={{fontSize:'1.05rem',color:'#94a3b8',marginBottom:'1.2rem',lineHeight:1.7}}>
              Transforma tu aprendizaje en una aventura epica. Practica ingles con Mr. Alex, completa misiones y sube de A1 a C2.
            </p>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:'2rem',padding:'.85rem 1.1rem',borderRadius:14,background:'linear-gradient(135deg,rgba(99,102,241,.12),rgba(217,70,239,.08))',border:'1px solid rgba(99,102,241,.25)'}}>
              <span style={{fontSize:'1.3rem'}}>⚡</span>
              <p style={{margin:0,fontSize:'.86rem',color:'#cbd5e1',lineHeight:1.6}}>
                Una creación de <strong style={{background:'linear-gradient(135deg,#818cf8,#d946ef)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',fontWeight:800}}>NexLum</strong> — ingeniería de software y automatización con IA de primer nivel. Diseñamos AulaQuest para que aprender inglés se sienta como jugar.
              </p>
            </div>
            <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
              <button onClick={()=>document.getElementById('avatares-sec')?.scrollIntoView({behavior:'smooth'})} style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',padding:'1rem 2rem',borderRadius:12,fontWeight:600,fontSize:'1rem',cursor:'pointer',boxShadow:'0 0 30px rgba(99,102,241,.4)'}}>
                👀 Ver Avatares
              </button>
            </div>
            <div style={{display:'flex',gap:'2.5rem',marginTop:'3rem',paddingTop:'2rem',borderTop:'1px solid rgba(99,102,241,.15)'}}>
              {[['50+','Cursos'],['12K+','Estudiantes'],['200+','Misiones']].map(([n,l])=>(
                <div key={l}>
                  <div style={{fontSize:'2rem',fontWeight:800,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{n}</div>
                  <div style={{fontSize:'.85rem',color:'#94a3b8'}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'1rem',position:'relative',zIndex:1}}>
            <MrAlexOrb size={240} state="idle"/>
            <div style={{textAlign:'center'}}>
              <div style={{fontWeight:700,fontSize:'1rem',color:'#e2e8f0',letterSpacing:'.08em'}}>MR. ALEX</div>
              <div style={{fontSize:'.75rem',color:'#94a3b8'}}>tutor de ingles · en linea</div>
            </div>
            <div style={{display:'flex',gap:'.7rem',flexWrap:'wrap',justifyContent:'center',marginTop:'.5rem'}}>
              {[['🗄️','MongoDB'],['⚡','XP real'],['🎤','Voz IA']].map(([ic,txt])=>(
                <div key={txt} style={{background:'rgba(30,41,59,.8)',border:'1px solid rgba(99,102,241,.2)',borderRadius:10,padding:'.5rem .9rem',fontSize:'.72rem',color:'#94a3b8',display:'flex',alignItems:'center',gap:'.4rem',animation:'float 4s ease-in-out infinite'}}>
                  {ic} {txt}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="avatares-sec" style={{padding:'4.5rem 2rem',position:'relative',zIndex:1}}>
        <div style={{textAlign:'center',marginBottom:'2.8rem'}}>
          <span style={{background:'rgba(139,92,246,.15)',color:'#a78bfa',padding:'.4rem 1rem',borderRadius:50,fontSize:'.85rem',fontWeight:600}}>Nuestros avatares</span>
          <h2 style={{fontSize:'2.2rem',fontWeight:800,margin:'1rem 0 .5rem',color:'#f1f5f9'}}>Conoce a tus entrevistadores IA</h2>
          <p style={{color:'#94a3b8',fontSize:'1rem',maxWidth:600,margin:'0 auto'}}>Practica inglés con cualquiera de ellos. Cada uno te entrevista en tiempo real con voz.</p>
        </div>
        <div style={{display:'flex',gap:'1.6rem',flexWrap:'wrap',justifyContent:'center',maxWidth:1100,margin:'0 auto'}}>
          {[
            {nombre:'Mr. Alex', rol:'Tutor de inglés', grad:'linear-gradient(135deg,#6366f1,#8b5cf6)', accent:'99,102,241', emoji:'🎓'},
            {nombre:'AI Teacher', rol:'Entrevistador · Gemini', grad:'linear-gradient(135deg,#3b82f6,#8b5cf6,#f43f5e)', accent:'59,130,246', emoji:'🌊'},
            {nombre:'NEXA', rol:'Asistente IA · 3D', grad:'linear-gradient(135deg,#6fe0ff,#3aa8e8,#b07aff)', accent:'58,168,232', emoji:'🤖'},
            {nombre:'Michael', rol:'HR Coach · 3D', grad:'linear-gradient(135deg,#d9a07c,#9ec4ee,#35495e)', accent:'158,196,238', emoji:'👨‍🏫'},
          ].map((a,i)=>(
            <div key={a.nombre}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-10px) scale(1.03)';e.currentTarget.style.boxShadow=`0 24px 50px rgba(${a.accent},.45)`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0) scale(1)';e.currentTarget.style.boxShadow='0 12px 30px rgba(0,0,0,.45)';}}
              style={{flex:'1 1 220px',maxWidth:250,background:'rgba(15,23,42,.6)',border:`1px solid rgba(${a.accent},.28)`,borderRadius:20,padding:'1.8rem 1.4rem',textAlign:'center',boxShadow:'0 12px 30px rgba(0,0,0,.45)',transition:'transform .3s ease, box-shadow .3s ease',animation:`float 4s ease-in-out infinite`,animationDelay:`${i*0.4}s`}}>
              <div style={{width:120,height:120,margin:'0 auto 1.1rem',borderRadius:'50%',background:a.grad,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',boxShadow:`0 0 30px rgba(${a.accent},.45)`}}>
                <span style={{fontSize:'3rem',filter:'drop-shadow(0 4px 10px rgba(0,0,0,.5))'}}>{a.emoji}</span>
                <div style={{position:'absolute',inset:-4,borderRadius:'50%',border:`1px solid rgba(${a.accent},.4)`,animation:'float 5s ease-in-out infinite'}}/>
              </div>
              <div style={{fontWeight:800,fontSize:'1.15rem',color:'#f1f5f9',marginBottom:4}}>{a.nombre}</div>
              <div style={{fontSize:'.8rem',color:'#94a3b8',marginBottom:'1.1rem'}}>{a.rol}</div>
              {user?.role==='admin' ? (
                <button onClick={onEmpezar} style={{width:'100%',background:`rgba(${a.accent},.16)`,color:'#e2e8f0',border:`1px solid rgba(${a.accent},.35)`,padding:'.6rem 0',borderRadius:10,fontWeight:700,fontSize:'.82rem',cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>
                  Practicar →
                </button>
              ) : (
                <div style={{width:'100%',background:'rgba(100,116,139,.1)',color:'#64748b',border:'1px solid rgba(100,116,139,.2)',padding:'.6rem 0',borderRadius:10,fontWeight:600,fontSize:'.78rem',textAlign:'center'}}>
                  🔒 Disponible en el aula
                </div>
              )}
            </div>
          ))}
        </div>
      </section>


      <section style={{padding:'5rem 2rem',position:'relative',zIndex:1}}>
        <div style={{textAlign:'center',marginBottom:'3rem'}}>
          <span style={{background:'rgba(6,182,212,.15)',color:'#06b6d4',padding:'.4rem 1rem',borderRadius:50,fontSize:'.85rem',fontWeight:600}}>Caracteristicas</span>
          <h2 style={{fontSize:'2.2rem',fontWeight:800,margin:'1rem 0 .5rem'}}>Tu Aula Virtual Gamificada</h2>
        </div>
        <div style={{maxWidth:1100,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'1.5rem'}}>
          {[
            ['🎤','Voz en tiempo real','Practica pronunciacion con Mr. Alex y recibe feedback inmediato.'],
            ['🏆','Sistema de XP','Gana experiencia por cada palabra correcta y sube de nivel.'],
            ['📚','A1 hasta C2','Todo el vocabulario del Marco Europeo organizado por nivel.'],
            ['📊','Progreso Real','Estadisticas sincronizadas con MongoDB en tiempo real.'],
            ['🎮','Gamificado','Retos, rachas y estrellas que hacen el aprendizaje divertido.'],
            ['👥','Multi-alumno','El admin puede ver el progreso de todos los estudiantes.'],
          ].map(([icon,title,desc])=>(
            <div key={title} style={{background:'#1e293b',border:'1px solid rgba(99,102,241,.1)',borderRadius:16,padding:'2rem',transition:'all .3s'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-6px)';e.currentTarget.style.borderColor='rgba(99,102,241,.35)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.borderColor='rgba(99,102,241,.1)';}}>
              <div style={{fontSize:'2rem',marginBottom:'1rem'}}>{icon}</div>
              <h3 style={{fontSize:'1.1rem',fontWeight:700,marginBottom:'.5rem'}}>{title}</h3>
              <p style={{color:'#94a3b8',fontSize:'.9rem',lineHeight:1.6}}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Buzón de sugerencias (llega a hola@nexlum.co) ── */}
      <section style={{padding:'3rem 2rem 3.5rem',position:'relative',zIndex:1}}>
        {(()=>{ const inp = { flex:'1 1 200px', background:'#0a0e1a', border:'1px solid rgba(139,92,246,.25)', borderRadius:10, color:'#e2e8f0', padding:'11px 12px', fontSize:'.85rem', outline:'none', fontFamily:"'Poppins',sans-serif", boxSizing:'border-box' }; return (
        <div style={{maxWidth:640,margin:'0 auto',background:'linear-gradient(180deg,rgba(24,29,49,.85),rgba(13,17,28,.9))',border:'1px solid rgba(139,92,246,.25)',borderRadius:22,padding:'2rem',boxShadow:'0 20px 60px rgba(0,0,0,.4)'}}>
          <div style={{textAlign:'center',marginBottom:'1.2rem'}}>
            <div style={{fontSize:'2rem'}}>📮</div>
            <h3 style={{margin:'6px 0 4px',fontSize:'1.25rem',fontWeight:800,background:'linear-gradient(135deg,#818cf8,#c4b5fd)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Buzón de sugerencias</h3>
            <p style={{color:'#94a3b8',fontSize:'.85rem',margin:0}}>Cuéntanos qué mejorarías de AulaQuest. Tu mensaje llega directo a nuestro equipo.</p>
          </div>
          {sugState==='sent' ? (
            <div style={{textAlign:'center',padding:'1rem 0'}}>
              <div style={{fontSize:'2rem'}}>✅</div>
              <p style={{color:'#34d399',fontWeight:700,margin:'8px 0 4px'}}>¡Gracias! Recibimos tu sugerencia.</p>
              <p style={{color:'#94a3b8',fontSize:'.8rem',margin:0}}>Nuestro equipo la leerá con atención.</p>
            </div>
          ) : (
            <>
              <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:10}}>
                <input value={sug.nombre} onChange={e=>setSug({...sug,nombre:e.target.value})} placeholder="Tu nombre (opcional)" maxLength={80} style={inp}/>
                <input value={sug.email} onChange={e=>setSug({...sug,email:e.target.value})} placeholder="Tu correo (opcional)" maxLength={120} style={inp}/>
              </div>
              <textarea value={sug.mensaje} onChange={e=>setSug({...sug,mensaje:e.target.value})} placeholder="Escribe aquí tu sugerencia…" rows={4} maxLength={2000} style={{...inp,width:'100%',resize:'vertical',minHeight:110}}/>
              {sugErr && <div style={{color:'#f87171',fontSize:'.78rem',fontWeight:600,margin:'8px 0 0'}}>{sugErr}</div>}
              <button onClick={enviarSugerencia} disabled={sugState==='sending'}
                style={{marginTop:12,width:'100%',background:sugState==='sending'?'#334155':'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',padding:'13px',borderRadius:12,fontWeight:700,fontSize:'.92rem',cursor:sugState==='sending'?'default':'pointer',fontFamily:"'Poppins',sans-serif",boxShadow:'0 4px 18px rgba(99,102,241,.3)'}}>
                {sugState==='sending' ? 'Enviando…' : '📨 Enviar sugerencia'}
              </button>
            </>
          )}
        </div>
        ); })()}
      </section>

      <footer style={{borderTop:'1px solid rgba(99,102,241,.15)',background:'linear-gradient(180deg,rgba(13,17,28,.4),rgba(9,11,21,.9))',padding:'3.5rem 2rem 2rem',position:'relative',zIndex:1}}>
        <div style={{maxWidth:1100,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'2.2rem',marginBottom:'2.5rem'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:'1rem'}}>
              <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',boxShadow:'0 0 16px rgba(99,102,241,.4)'}}>🎓</div>
              <span style={{fontWeight:800,fontSize:'1.15rem',background:'linear-gradient(135deg,#818cf8,#c4b5fd)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>AulaQuest</span>
            </div>
            <p style={{color:'#94a3b8',fontSize:'.85rem',lineHeight:1.7,margin:'0 0 1rem'}}>
              Tu aula virtual gamificada para aprender inglés. Practica con tutores IA por voz, completa misiones y sube del nivel A1 al C2 a tu ritmo, desde cualquier dispositivo.
            </p>
            <p style={{color:'#7c8aa0',fontSize:'.8rem',lineHeight:1.7,margin:0,paddingTop:'.9rem',borderTop:'1px solid rgba(99,102,241,.1)'}}>
              Desarrollada por <strong style={{background:'linear-gradient(135deg,#818cf8,#d946ef)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',fontWeight:800}}>NexLum</strong>, empresa de software y automatización con inteligencia artificial. Convertimos ideas en productos digitales potentes, intuitivos y a la vanguardia.
            </p>
          </div>

          <div>
            <h4 style={{color:'#e2e8f0',fontSize:'.95rem',fontWeight:700,marginBottom:'1rem'}}>Somos NexLum</h4>
            <p style={{color:'#94a3b8',fontSize:'.82rem',lineHeight:1.7,margin:'0 0 .8rem'}}>
              Una casa de desarrollo de software y automatización IA. Creamos AulaQuest con un objetivo claro: que aprender inglés sea divertido, adictivo y efectivo mientras estudias.
            </p>
            {['💻 Desarrollo de software a la medida','🤖 Automatización con IA','🚀 Productos digitales de alto impacto'].map(x=>(
              <div key={x} style={{color:'#94a3b8',fontSize:'.82rem',marginBottom:'.5rem'}}>{x}</div>
            ))}
          </div>

          <div>
            <h4 style={{color:'#e2e8f0',fontSize:'.95rem',fontWeight:700,marginBottom:'1rem'}}>Qué puedes hacer</h4>
            {['🎤 Practicar pronunciación con voz IA','📚 6 niveles (A1–C2) con vocabulario por tema','🎮 Minijuegos en cada nivel','💼 Entrevistas de trabajo con IA en tiempo real'].map(x=>(
              <div key={x} style={{color:'#94a3b8',fontSize:'.82rem',marginBottom:'.55rem'}}>{x}</div>
            ))}
          </div>

          <div>
            <h4 style={{color:'#e2e8f0',fontSize:'.95rem',fontWeight:700,marginBottom:'1rem'}}>Tu progreso</h4>
            {['⚡ XP real por cada respuesta correcta','📊 Estadísticas guardadas en MongoDB','🏆 Exámenes para avanzar de nivel','👥 Panel de administración para docentes'].map(x=>(
              <div key={x} style={{color:'#94a3b8',fontSize:'.82rem',marginBottom:'.55rem'}}>{x}</div>
            ))}
          </div>

          <div>
            <h4 style={{color:'#e2e8f0',fontSize:'.95rem',fontWeight:700,marginBottom:'1rem'}}>Aula virtual</h4>
            <p style={{color:'#94a3b8',fontSize:'.82rem',lineHeight:1.7,margin:'0 0 1rem'}}>
              Aprende desde casa, sin horarios. Un entorno seguro y divertido para estudiantes de todas las edades.
            </p>
            <div style={{display:'flex',gap:'.6rem',flexWrap:'wrap'}}>
              {['🗄️ MongoDB','🎤 Voz IA','⚡ XP real'].map(t=>(
                <span key={t} style={{background:'rgba(99,102,241,.12)',border:'1px solid rgba(99,102,241,.25)',borderRadius:8,padding:'.35rem .7rem',fontSize:'.72rem',color:'#a5b4fc'}}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{borderTop:'1px solid rgba(99,102,241,.1)',paddingTop:'1.5rem',textAlign:'center',color:'#475569',fontSize:'.8rem'}}>
          © {new Date().getFullYear()} AulaQuest by NexLum — Aula Virtual de Inglés. Software & Automatización IA. Hecho con 💜 para que aprender sea una aventura. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}


// ─── QUIZ ESCALABLE — carga desde backend, funciona para cualquier nivel ───
function LevelQuiz({ nivel, token, onBack, onPass, onUserUpdate }) {
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [quizData,  setQuizData]  = useState(null);
  const [step,      setStep]      = useState(0);
  const [selected,  setSelected]  = useState(null);
  const [answers,   setAnswers]   = useState([]);
  const [phase,     setPhase]     = useState('quiz');
  const [result,    setResult]    = useState(null);
  const [submitting,setSubmitting]= useState(false);

  useEffect(() => {
    const nivelClean = (nivel||'').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
    fetch(API + '/api/quiz/' + nivelClean, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(d => { if (d.msg) setError(d.msg); else setQuizData(d); setLoading(false); })
      .catch(() => { setError('No se pudo cargar el examen.'); setLoading(false); });
  }, [nivel]);

  const q   = quizData?.preguntas?.[step];
  const total = quizData?.totalPregs || 10;
  const pct   = Math.round((step / total) * 100);

  const choose = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    setTimeout(() => {
      const newAnswers = [...answers, idx];
      setAnswers(newAnswers);
      if (step + 1 < total) {
        setStep(step + 1);
        setSelected(null);
      } else {
        // Enviar al backend con IDs para evitar bugs de shuffle
        setSubmitting(true);
        const preguntasIds = quizData.preguntas.map(q => q._id);
        const nivelClean3 = (nivel||'').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
        fetch(API + '/api/quiz/' + nivelClean3 + '/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ preguntasIds, respuestas: newAnswers })
        })
          .then(r => r.json())
          .then(d => { setResult(d); if (d.passed && d.user) onUserUpdate(d.user); setPhase('result'); setSubmitting(false); })
          .catch(() => { setError('Error al enviar resultados.'); setSubmitting(false); });
      }
    }, 900);
  };

  const retry = () => { setStep(0); setSelected(null); setAnswers([]); setPhase('quiz');
    const nivelClean2 = (nivel||'').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
    fetch(API + '/api/quiz/' + nivelClean2, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json()).then(d => { setQuizData(d); }); };

  if (loading) return (
    <div style={{background:'#020617',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Poppins',sans-serif"}}>
      <style>{KF}</style>
      <div style={{textAlign:'center'}}>
        <div style={{width:60,height:60,border:'3px solid rgba(99,102,241,.2)',borderTop:'3px solid #6366f1',borderRadius:'50%',animation:'maRot 1s linear infinite',margin:'0 auto 1rem'}}/>
        <p style={{color:'#64748b'}}>Cargando examen...</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{background:'#020617',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Poppins',sans-serif",color:'#e2e8f0'}}>
      <style>{KF}</style>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'3rem',marginBottom:'1rem'}}>⚠️</div>
        <p style={{color:'#ef4444',marginBottom:'1rem'}}>{error}</p>
        <button onClick={onBack} style={{background:'#6366f1',color:'#fff',border:'none',padding:'10px 24px',borderRadius:10,cursor:'pointer',fontWeight:600}}>Volver</button>
      </div>
    </div>
  );

  if (phase === 'result' && result) {
    const passed = result.passed;
    return (
      <div style={{background:'#020617',minHeight:'100vh',fontFamily:"'Poppins',sans-serif",color:'#e2e8f0',display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
        <style>{KF}</style>
        <div style={{maxWidth:540,width:'100%'}}>
          <div style={{textAlign:'center',marginBottom:'2rem'}}>
            <div style={{fontSize:'5rem',marginBottom:'1rem',animation:'float 3s ease-in-out infinite'}}>{passed ? '🏆' : '💪'}</div>
            <h2 style={{fontSize:'2rem',fontWeight:900,marginBottom:'.5rem',background: passed ? 'linear-gradient(135deg,#10b981,#06b6d4)' : 'linear-gradient(135deg,#ef4444,#f59e0b)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              {passed ? '¡Felicitaciones!' : 'Casi lo logras'}
            </h2>
            <p style={{color:'#94a3b8',fontSize:'1rem'}}>
              {passed
                ? `¡Pasaste con ${result.correctas}/${result.total} (${result.pct}%)! Ahora eres nivel ${quizData.nivelTarget} 🎉`
                : `Obtuviste ${result.correctas}/${result.total} (${result.pct}%). Necesitas ${result.minScore}/${result.total} para avanzar.`}
            </p>
          </div>

          <div style={{display:'flex',justifyContent:'center',gap:8,marginBottom:'2rem',flexWrap:'wrap'}}>
            {result.detalle.map((d, i) => (
              <div key={i} title={d.pregunta} style={{width:38,height:38,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',background: d.ok ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)',border:`1px solid ${d.ok ? '#10b981' : '#ef4444'}`}}>
                {d.ok ? '✓' : '✗'}
              </div>
            ))}
          </div>

          <div style={{background:'#0d1117',border:'1px solid rgba(99,102,241,.2)',borderRadius:16,padding:'1.5rem',marginBottom:'1.5rem'}}>
            {[
              ['Correctas', result.correctas + ' / ' + result.total, '#10b981'],
              ['Incorrectas', (result.total - result.correctas) + ' / ' + result.total, '#ef4444'],
              ['Porcentaje', result.pct + '%', result.passed ? '#10b981' : '#f59e0b'],
              ['Mínimo para pasar', result.minScore + '/10 (70%)', '#6366f1'],
            ].map(([label, val, color]) => (
              <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
                <span style={{color:'#64748b',fontSize:'.85rem'}}>{label}</span>
                <span style={{color,fontWeight:700,fontSize:'.9rem'}}>{val}</span>
              </div>
            ))}
          </div>

          {!passed && (
            <div style={{background:'rgba(239,68,68,.05)',border:'1px solid rgba(239,68,68,.15)',borderRadius:12,padding:'1rem',marginBottom:'1.5rem'}}>
              <p style={{color:'#94a3b8',fontSize:'.82rem',margin:'0 0 8px',fontWeight:600}}>Respuestas incorrectas:</p>
              {result.detalle.filter(d => !d.ok).map((d, i) => (
                <div key={i} style={{marginBottom:8}}>
                  <p style={{color:'#cbd5e1',fontSize:'.78rem',margin:'0 0 2px'}}>{d.pregunta}</p>
                  <p style={{color:'#ef4444',fontSize:'.75rem',margin:0}}>Tu respuesta: {d.tuRespuesta} &nbsp;→&nbsp; <span style={{color:'#10b981'}}>Correcta: {d.correcta}</span></p>
                </div>
              ))}
            </div>
          )}

          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            {passed ? (
              <button onClick={onPass} style={{background:'linear-gradient(135deg,#10b981,#06b6d4)',color:'#fff',border:'none',padding:'14px 28px',borderRadius:12,fontWeight:700,fontSize:'1rem',cursor:'pointer',boxShadow:'0 0 30px rgba(16,185,129,.35)'}}>
                🚀 Ir al nivel {quizData.nivelTarget}
              </button>
            ) : (
              <button onClick={retry} style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',padding:'14px 28px',borderRadius:12,fontWeight:700,fontSize:'1rem',cursor:'pointer'}}>
                🔄 Intentar de nuevo
              </button>
            )}
            <button onClick={onBack} style={{background:'transparent',color:'#94a3b8',border:'1px solid rgba(99,102,241,.25)',padding:'14px 28px',borderRadius:12,fontWeight:600,fontSize:'1rem',cursor:'pointer'}}>
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submitting) return (
    <div style={{background:'#020617',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Poppins',sans-serif"}}>
      <style>{KF}</style>
      <div style={{textAlign:'center'}}>
        <div style={{width:60,height:60,border:'3px solid rgba(99,102,241,.2)',borderTop:'3px solid #6366f1',borderRadius:'50%',animation:'maRot 1s linear infinite',margin:'0 auto 1rem'}}/>
        <p style={{color:'#64748b'}}>Calculando resultados...</p>
      </div>
    </div>
  );

  const TIPO_BADGE = { vocab:'📖 Vocabulario', grammar:'✏️ Gramática', listening:'👂 Comprensión', fill:'📝 Completar' };

  return (
    <div style={{background:'#020617',minHeight:'100vh',fontFamily:"'Poppins',sans-serif",color:'#e2e8f0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
      <style>{KF}</style>
      <div style={{maxWidth:600,width:'100%'}}>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'2rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:42,height:42,borderRadius:12,background:'rgba(16,185,129,.15)',border:'1px solid rgba(16,185,129,.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{fontSize:'.85rem',fontWeight:900,color:'#10b981'}}>{nivel}</span>
            </div>
            <div>
              <div style={{fontSize:'.88rem',fontWeight:700,color:'#e2e8f0'}}>{quizData.titulo}</div>
              <div style={{fontSize:'.72rem',color:'#64748b'}}>{quizData.descripcion}</div>
            </div>
          </div>
          <button onClick={onBack} style={{background:'transparent',color:'#475569',border:'1px solid rgba(99,102,241,.15)',padding:'6px 14px',borderRadius:8,cursor:'pointer',fontSize:'.8rem'}}>✕ Salir</button>
        </div>

        <div style={{marginBottom:'2rem'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
            <span style={{fontSize:'.78rem',color:'#64748b'}}>Pregunta {step + 1} de {total}</span>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {q?.tipo && <span style={{background:'rgba(99,102,241,.1)',color:'#a5b4fc',fontSize:'.68rem',padding:'3px 8px',borderRadius:50,fontWeight:600}}>{TIPO_BADGE[q.tipo]}</span>}
              <span style={{fontSize:'.78rem',color:'#6366f1',fontWeight:700}}>{pct}%</span>
            </div>
          </div>
          <div style={{height:6,background:'rgba(99,102,241,.15)',borderRadius:10,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#6366f1,#8b5cf6)',borderRadius:10,transition:'width .4s ease'}}/>
          </div>
          <div style={{display:'flex',gap:4,marginTop:8}}>
            {Array.from({length:total}).map((_,i) => (
              <div key={i} style={{flex:1,height:3,borderRadius:3,background: i < step ? '#6366f1' : i === step ? '#8b5cf6' : 'rgba(99,102,241,.15)',transition:'all .3s'}}/>
            ))}
          </div>
        </div>

        <div style={{background:'#0d1117',border:'1px solid rgba(99,102,241,.25)',borderRadius:20,padding:'2rem',marginBottom:'1.5rem',minHeight:90,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 40px rgba(99,102,241,.08)'}}>
          <p style={{fontSize:'1.1rem',fontWeight:600,textAlign:'center',margin:0,lineHeight:1.5,color:'#f1f5f9'}}>{q?.q}</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {q?.opts.map((opt, idx) => {
            let bg = '#0d1117', border = 'rgba(99,102,241,.2)', color = '#e2e8f0';
            if (selected !== null) {
              if (idx === q.ans) { bg = 'rgba(16,185,129,.15)'; border = '#10b981'; color = '#10b981'; }
              else if (idx === selected && idx !== q.ans) { bg = 'rgba(239,68,68,.15)'; border = '#ef4444'; color = '#ef4444'; }
            }
            return (
              <button key={idx} onClick={() => choose(idx)} style={{background:bg,border:`1px solid ${border}`,borderRadius:14,padding:'16px',color,fontSize:'.9rem',fontWeight:600,cursor:selected===null?'pointer':'default',transition:'all .25s',textAlign:'left',fontFamily:"'Poppins',sans-serif",lineHeight:1.4}}
                onMouseEnter={e=>{ if(selected===null) e.currentTarget.style.background='rgba(99,102,241,.1)'; }}
                onMouseLeave={e=>{ if(selected===null) e.currentTarget.style.background=bg; }}>
                <span style={{display:'inline-block',width:22,height:22,borderRadius:6,background:'rgba(99,102,241,.15)',color:'#6366f1',fontSize:'.72rem',fontWeight:700,textAlign:'center',lineHeight:'22px',marginRight:8,flexShrink:0}}>{String.fromCharCode(65+idx)}</span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}




// ─── ENTREVISTA DE TRABAJO CON IA ────────────────────────────────────────────

const INTERVIEWERS_CFG = {
  sara:    { id:'sara',    name:'Sara Mitchell',  role:'HR Director · People & Talent',   badge:'Formal',  accent:'#38bdf8', accentD:'#0ea5e9', img:'/avatars/sara.jpg'    },
  michael: { id:'michael', name:'Michael Torres', role:'Senior Tech Lead · Engineering',  badge:'Tech',    accent:'#a78bfa', accentD:'#7c3aed', img:'/avatars/michael.jpg' },
  diana:   { id:'diana',   name:'Diana Lee',      role:'Product Manager · Strategy',      badge:'Casual',  accent:'#f472b6', accentD:'#ec4899', img:'/avatars/diana.jpg'   },
  carlos:  { id:'carlos',  name:'Carlos Rivera',  role:'Business Development · Sales',    badge:'Classic', accent:'#34d399', accentD:'#10b981', img:'/avatars/carlos.jpg'  },
  emily:   { id:'emily',   name:'Emily Chen',     role:'UX Researcher · Design Lead',     badge:'Modern',  accent:'#fb7185', accentD:'#f43f5e', img:'/avatars/emily.jpg'   },
};

function InterviewAvatar({ interviewerId='sara', speaking=false, emotion='neutral', size=200 }) {
  const cfg = INTERVIEWERS_CFG[interviewerId] || INTERVIEWERS_CFG.sara;
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!speaking) { setFrame(0); return; }
    const iv = setInterval(() => setFrame(f => f+1), 110);
    return () => clearInterval(iv);
  }, [speaking]);
  const mouthOpen = speaking ? Math.abs(Math.sin(frame * 0.75)) : 0;
  return (
    <div style={{position:'relative', width:size, height:size, flexShrink:0}}>
      {speaking && [0,1,2].map(r => (
        <div key={r} style={{
          position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)',
          width: size + r*20 + mouthOpen*10,
          height: size + r*20 + mouthOpen*10,
          borderRadius:'50%',
          border: `1.5px solid ${cfg.accent}${Math.floor((0.4-r*0.12)*255).toString(16).padStart(2,'0')}`,
          pointerEvents:'none',
        }}/>
      ))}
      <img src={cfg.img} alt={cfg.name} style={{
        width:size, height:size, borderRadius:'50%',
        objectFit:'cover', objectPosition:'center top',
        border: `2.5px solid ${cfg.accent}${speaking ? 'ff' : '60'}`,
        display:'block',
      }}/>
      {speaking && (
        <div style={{
          position:'absolute',
          bottom: Math.round(size*0.16),
          left:'50%', transform:'translateX(-50%)',
          width: Math.round(size*0.22 + mouthOpen*size*0.07),
          height: Math.round(size*0.05 + mouthOpen*size*0.09),
          borderRadius:'50%',
          background:'rgba(0,0,0,.75)',
          pointerEvents:'none',
        }}/>
      )}
    </div>
  );
}

function InterviewerCard({ cfg, selected, onSelect }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setFrame(f => f+1), 700);
    return () => clearInterval(iv);
  }, []);
  const talking = selected && Math.sin(frame * 0.9) > 0.4;
  return (
    <div onClick={()=>onSelect(cfg.id)} style={{
      cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6,
      padding:'10px 8px', borderRadius:14,
      border: selected ? `2px solid ${cfg.accent}` : '2px solid transparent',
      background: selected ? cfg.accent+'18' : 'rgba(255,255,255,.04)',
      transition:'all .2s', minWidth:100, position:'relative',
    }}>
      <div style={{position:'relative'}}>
        <img src={cfg.img} alt={cfg.name} style={{
          width:80, height:80, borderRadius:'50%',
          objectFit:'cover', objectPosition:'center top',
          border: `2px solid ${selected ? cfg.accent : 'rgba(255,255,255,.15)'}`,
          display:'block',
        }}/>
        {selected && <div style={{position:'absolute',bottom:0,right:0,width:20,height:20,borderRadius:'50%',background:cfg.accent,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#fff',fontWeight:700}}>✓</div>}
        {talking && <div style={{position:'absolute',bottom:6,left:'50%',transform:'translateX(-50%)',display:'flex',gap:2,alignItems:'flex-end'}}>
          {[0,1,2].map(i=><div key={i} style={{width:4,height:4+Math.round(Math.abs(Math.sin(frame*1.2+i))*4),borderRadius:2,background:cfg.accent}}/>)}
        </div>}
      </div>
      <div style={{fontSize:'.72rem',fontWeight:700,color:'#e2e8f0',textAlign:'center'}}>{cfg.name.split(' ')[0]}</div>
      <div style={{fontSize:'.6rem',color:'#64748b',textAlign:'center',background:'rgba(255,255,255,.06)',padding:'2px 8px',borderRadius:20}}>{cfg.badge}</div>
    </div>
  );
}


function JobInterview({ token, user, onBack }) {
  const N8N_URL = API+'/api/interview/message';
  const [jobTitle,  setJobTitle]  = useState('Software Developer');
  const [level,     setLevel]     = useState('mid');
  const [phase,     setPhase]     = useState('setup');
  const [interviewerId, setInterviewerId] = useState('sara');   // setup | interview | result
  const [history,   setHistory]   = useState([]);
  const [speaking,  setSpeaking]  = useState(false);
  const [listening, setListening] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [feedback,  setFeedback]  = useState('');
  const [lastMsg,   setLastMsg]   = useState('');
  const [score,     setScore]     = useState(null);
  const [qCount,    setQCount]    = useState(0);
  const [transcript,setTranscript]= useState('');
  const [emotion,   setEmotion]   = useState('neutral');
  const audioRef = useRef(null);
  const recRef   = useRef(null);

  const playAudio = (base64, onEnd) => {
    if (!base64) { if(onEnd) onEnd(); return; }
    const blob = new Blob([Uint8Array.from(atob(base64), c=>c.charCodeAt(0))], {type:'audio/mpeg'});
    const url  = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    setSpeaking(true);
    audio.onended = () => { setSpeaking(false); if(onEnd) onEnd(); };
    audio.play().catch(()=>{ setSpeaking(false); if(onEnd) onEnd(); });
  };

  const sendMessage = async (userMessage, isFirst=false) => {
    setLoading(true); setEmotion('serious');
    const newHistory = isFirst ? [] : [...history, {role:'user', content: userMessage}];
    try {
      const r = await fetch(N8N_URL, {
        method: 'POST',
        headers: {'Content-Type':'application/json', Authorization:'Bearer '+(window._alexToken||token)},
        body: JSON.stringify({ message: userMessage, history: newHistory, jobTitle, level }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || 'Error');
      const aiHistory = [...newHistory, {role:'assistant', content: d.interviewer}];
      setHistory(aiHistory);
      setFeedback(d.feedback || '');
      setLastMsg(d.interviewer || '');
      if (d.score) { setScore(d.score); setPhase('result'); }
      else setQCount(q => q+1);
      setEmotion('neutral');
      setLoading(false);
      playAudio(d.audio, ()=>{ if(!d.score) startListen(); });
    } catch(e) {
      setLoading(false); setEmotion('neutral');
      setFeedback('Error conectando con el entrevistador. Verifica que n8n esté corriendo.');
    }
  };

  const startInterview = () => {
    setPhase('interview');
    setHistory([]); setQCount(0); setScore(null);
    sendMessage('', true);
  };

  const startListen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setFeedback('Usa Chrome para el reconocimiento de voz.'); return; }
    const rec = new SR(); recRef.current = rec;
    rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onstart  = () => { setListening(true); setTranscript(''); };
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setListening(false);
      sendMessage(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend   = () => setListening(false);
    rec.start();
  };

  const stopListen = () => { recRef.current?.stop(); setListening(false); };

  const S = { bg:'#020617', font:"'Poppins',sans-serif", color:'#e2e8f0' };

  // SETUP
  const selCfg = INTERVIEWERS_CFG[interviewerId] || INTERVIEWERS_CFG.sara;
  if (phase === 'setup') return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg,#0a0e1a 0%,#0f172a 50%,#0a0e1a 100%)', fontFamily:"'Poppins',sans-serif", display:'flex', flexDirection:'column', overflow:'hidden'}}>
      <div style={{padding:'1.2rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,.06)'}}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <div style={{width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16}}>🎯</div>
          <div>
            <div style={{fontSize:'.78rem', fontWeight:700, color:'#e2e8f0', letterSpacing:'.08em'}}>AULAQUEST</div>
            <div style={{fontSize:'.62rem', color:'#6366f1'}}>Interview Challenge</div>
          </div>
        </div>
        <button onClick={onBack} style={{background:'transparent', color:'#475569', border:'1px solid rgba(255,255,255,.1)', padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:'.75rem', fontFamily:"'Poppins',sans-serif"}}>← Volver</button>
      </div>
      <div style={{flex:1, display:'grid', gridTemplateColumns:'1fr 400px', overflow:'hidden'}}>
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem', borderRight:'1px solid rgba(255,255,255,.05)'}}>
          <div style={{position:'relative', marginBottom:'1.5rem'}}>
            <InterviewAvatar interviewerId={interviewerId} speaking={false} size={220}/>
            <div style={{position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', background:selCfg.accent, color:'#fff', fontSize:'.6rem', fontWeight:700, padding:'3px 12px', borderRadius:20, whiteSpace:'nowrap', letterSpacing:'.06em'}}>
              {selCfg.badge.toUpperCase()}
            </div>
          </div>
          <div style={{textAlign:'center', marginBottom:'1.5rem'}}>
            <div style={{fontSize:'1.4rem', fontWeight:800, color:'#f1f5f9'}}>{selCfg.name}</div>
            <div style={{fontSize:'.75rem', color:selCfg.accent, marginTop:4}}>{selCfg.role}</div>
          </div>
          <div style={{background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:'1.2rem', width:'100%', maxWidth:320}}>
            <div style={{fontSize:'.65rem', color:'#64748b', fontWeight:700, letterSpacing:'.08em', marginBottom:12}}>PERFORMANCE METRICS</div>
            {[['Vocabulary Range','88%',88],['Grammar Accuracy','92%',92],['Pronunciation & Flow','85%',85]].map(([label,pct,val])=>(
              <div key={label} style={{marginBottom:10}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'.72rem', color:'#94a3b8', marginBottom:4}}>
                  <span>{label}</span><span style={{color:selCfg.accent, fontWeight:700}}>{pct}</span>
                </div>
                <div style={{height:5, borderRadius:3, background:'rgba(255,255,255,.08)'}}>
                  <div style={{height:'100%', borderRadius:3, width:`${val}%`, background:`linear-gradient(90deg,${selCfg.accentD},${selCfg.accent})`}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:'flex', flexDirection:'column', padding:'2rem', overflowY:'auto'}}>
          <div style={{marginBottom:'1.5rem'}}>
            <div style={{fontSize:'1.1rem', fontWeight:800, color:'#f1f5f9', marginBottom:4}}>Choose your interviewer</div>
            <div style={{fontSize:'.75rem', color:'#475569'}}>Selecciona con quién practicarás hoy</div>
          </div>
          <div style={{display:'flex', gap:8, marginBottom:'1.5rem', flexWrap:'wrap'}}>
            {Object.values(INTERVIEWERS_CFG).map(cfg=>(
              <InterviewerCard key={cfg.id} cfg={cfg} selected={interviewerId===cfg.id} onSelect={setInterviewerId}/>
            ))}
          </div>
          <div style={{height:'1px', background:'rgba(255,255,255,.06)', marginBottom:'1.5rem'}}/>
          <div style={{marginBottom:'1rem'}}>
            <label style={{fontSize:'.72rem', color:'#64748b', fontWeight:700, letterSpacing:'.06em', display:'block', marginBottom:8}}>PUESTO AL QUE APLICAS</label>
            <select value={jobTitle} onChange={e=>setJobTitle(e.target.value)} style={{width:'100%', background:'#1e293b', border:'1px solid rgba(255,255,255,.1)', borderRadius:10, padding:'10px 12px', color:'#e2e8f0', fontSize:'.85rem', fontFamily:"'Poppins',sans-serif", outline:'none'}}>
              {['Software Developer','Frontend Developer','Backend Developer','Full Stack Developer','Data Analyst','Product Manager','UX Designer','DevOps Engineer','QA Engineer','Project Manager'].map(j=>(
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>
          <div style={{marginBottom:'1.5rem'}}>
            <label style={{fontSize:'.72rem', color:'#64748b', fontWeight:700, letterSpacing:'.06em', display:'block', marginBottom:8}}>NIVEL DE EXPERIENCIA</label>
            <div style={{display:'flex', gap:8}}>
              {[['junior','Junior','0-2 yrs'],['mid','Mid','2-5 yrs'],['senior','Senior','5+ yrs']].map(([v,l,s])=>(
                <button key={v} onClick={()=>setLevel(v)} style={{flex:1, padding:'10px 6px', borderRadius:10, border:`1px solid ${level===v?selCfg.accent:'rgba(255,255,255,.08)'}`, background:level===v?selCfg.accent+'22':'transparent', color:level===v?selCfg.accent:'#64748b', fontSize:'.72rem', cursor:'pointer', fontFamily:"'Poppins',sans-serif", transition:'all .2s'}}>
                  <div style={{fontWeight:700}}>{l}</div>
                  <div style={{fontSize:'.6rem', opacity:.7}}>{s}</div>
                </button>
              ))}
            </div>
          </div>
          <div style={{background:'rgba(99,102,241,.08)', border:'1px solid rgba(99,102,241,.2)', borderRadius:10, padding:'10px 14px', marginBottom:'1rem', display:'flex', alignItems:'center', gap:10}}>
            <div style={{background:'#6366f1', color:'#fff', fontSize:'.65rem', fontWeight:800, padding:'4px 10px', borderRadius:20}}>C1 LEVEL</div>
            <div style={{fontSize:'.72rem', color:'#94a3b8'}}>Advanced corporate communication</div>
          </div>
          <div style={{background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:10, padding:'10px 14px', marginBottom:'1.5rem'}}>
            <div style={{fontSize:'.65rem', color:'#64748b', fontWeight:700, letterSpacing:'.06em', marginBottom:6}}>CÓMO FUNCIONA</div>
            <p style={{fontSize:'.72rem', color:'#64748b', margin:0, lineHeight:1.6}}>
              {selCfg.name.split(' ')[0]} te hará <strong style={{color:'#94a3b8'}}>5 preguntas</strong> en inglés. Responde con el micrófono. Al final recibirás un score y retroalimentación detallada.
            </p>
          </div>
          <button onClick={startInterview} style={{width:'100%', background:`linear-gradient(135deg,${selCfg.accentD},${selCfg.accent})`, color:'#fff', border:'none', padding:'14px', borderRadius:12, fontWeight:700, fontSize:'1rem', cursor:'pointer', fontFamily:"'Poppins',sans-serif", letterSpacing:'.03em'}}>
            Start Interview with {selCfg.name.split(' ')[0]} →
          </button>
        </div>
      </div>
    </div>
  );

  // RESULT
  if (phase === 'result') return (
    <div style={{...S, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem'}}>
      <div style={{maxWidth:520, width:'100%', textAlign:'center'}}>
        <div style={{fontSize:'4rem', marginBottom:'1rem'}}>🏆</div>
        <h2 style={{fontSize:'2rem', fontWeight:900, marginBottom:'.5rem', background:'linear-gradient(135deg,#10b981,#06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>
          Entrevista completada
        </h2>
        <div style={{background:'#0f172a', border:'1px solid rgba(16,185,129,.2)', borderRadius:16, padding:'2rem', marginBottom:'1.5rem'}}>
          <div style={{fontSize:'3rem', fontWeight:900, color:'#10b981', marginBottom:4}}>{score}</div>
          <div style={{fontSize:'.9rem', color:'#64748b', marginBottom:'1.5rem'}}>Puntaje final</div>
          {lastMsg && <p style={{color:'#94a3b8', fontSize:'.85rem', lineHeight:1.7, textAlign:'left', margin:0}}>{lastMsg}</p>}
        </div>
        <div style={{display:'flex', gap:12, justifyContent:'center'}}>
          <button onClick={()=>{ setPhase('setup'); setHistory([]); setScore(null); setQCount(0); }}
            style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', padding:'12px 28px', borderRadius:12, fontWeight:700, cursor:'pointer'}}>
            🔄 Nueva entrevista
          </button>
          <button onClick={onBack} style={{background:'transparent', color:'#64748b', border:'1px solid rgba(99,102,241,.2)', padding:'12px 20px', borderRadius:12, cursor:'pointer', fontFamily:"'Poppins',sans-serif"}}>
            Volver al aula
          </button>
        </div>
      </div>
    </div>
  );

  // INTERVIEW
  return (
    <div style={{...S, minHeight:'100vh', display:'grid', gridTemplateColumns:'1fr 1fr', gap:0}}>

      {/* PANEL IZQUIERDO — Avatar */}
      <div style={{background:'linear-gradient(180deg,#0a0f1e,#020617)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem', borderRight:'1px solid rgba(99,102,241,.15)'}}>
        <div style={{marginBottom:'1rem', position:'relative'}}>
          <InterviewAvatar interviewerId={interviewerId} speaking={speaking} emotion={emotion} size={200}/>
          {speaking && (
            <div style={{position:'absolute', bottom:-8, left:'50%', transform:'translateX(-50%)', background:'#6366f1', color:'#fff', fontSize:'.65rem', fontWeight:700, padding:'3px 10px', borderRadius:50, whiteSpace:'nowrap'}}>
              HABLANDO
            </div>
          )}
          {listening && (
            <div style={{position:'absolute', bottom:-8, left:'50%', transform:'translateX(-50%)', background:'#10b981', color:'#fff', fontSize:'.65rem', fontWeight:700, padding:'3px 10px', borderRadius:50, whiteSpace:'nowrap'}}>
              ESCUCHANDO
            </div>
          )}
        </div>
        <div style={{textAlign:'center', marginBottom:'2rem'}}>
          <div style={{fontSize:'.9rem', fontWeight:700, color:'#e2e8f0', letterSpacing:'.05em'}}>{(INTERVIEWERS_CFG[interviewerId]||INTERVIEWERS_CFG.sara).name.toUpperCase()}</div>
          <div style={{fontSize:'.72rem', color:(INTERVIEWERS_CFG[interviewerId]||INTERVIEWERS_CFG.sara).accent}}>{(INTERVIEWERS_CFG[interviewerId]||INTERVIEWERS_CFG.sara).role.split('·')[0].trim()} · {jobTitle}</div>
        </div>

        {/* Pregunta actual */}
        {lastMsg && (
          <div style={{background:'rgba(99,102,241,.08)', border:'1px solid rgba(99,102,241,.2)', borderRadius:12, padding:'1rem', maxWidth:280, textAlign:'center'}}>
            <p style={{color:'#cbd5e1', fontSize:'.82rem', margin:0, lineHeight:1.6, fontStyle:'italic'}}>"{lastMsg}"</p>
          </div>
        )}

        {loading && (
          <div style={{display:'flex', alignItems:'center', gap:8, marginTop:'1rem'}}>
            <div style={{width:8, height:8, borderRadius:'50%', background:'#6366f1', animation:'pulse 1s infinite'}}/>
            <div style={{width:8, height:8, borderRadius:'50%', background:'#6366f1', animation:'pulse 1s infinite .2s'}}/>
            <div style={{width:8, height:8, borderRadius:'50%', background:'#6366f1', animation:'pulse 1s infinite .4s'}}/>
          </div>
        )}
      </div>

      {/* PANEL DERECHO — Controles */}
      <div style={{display:'flex', flexDirection:'column', padding:'2rem', background:'#020617'}}>
        
        {/* Header */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
          <div>
            <div style={{fontSize:'.72rem', color:'#64748b', marginBottom:2}}>Progreso</div>
            <div style={{display:'flex', gap:6}}>
              {Array.from({length:5}).map((_,i)=>(
                <div key={i} style={{width:28, height:6, borderRadius:3, background:i < qCount ? '#6366f1' : 'rgba(99,102,241,.15)'}}/>
              ))}
            </div>
          </div>
          <div style={{fontSize:'.75rem', color:'#475569'}}>Pregunta {Math.min(qCount, 5)} / 5</div>
          <button onClick={()=>{ audioRef.current?.pause(); onBack(); }}
            style={{background:'transparent', color:'#ef4444', border:'1px solid rgba(239,68,68,.3)', padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:'.75rem', fontFamily:"'Poppins',sans-serif"}}>
            Salir
          </button>
        </div>

        {/* Feedback */}
        {feedback && (
          <div style={{background:'rgba(99,102,241,.06)', border:'1px solid rgba(99,102,241,.15)', borderRadius:12, padding:'1rem', marginBottom:'1rem'}}>
            <div style={{fontSize:'.7rem', fontWeight:700, color:'#6366f1', marginBottom:4, letterSpacing:'.05em'}}>FEEDBACK DE TU INGLÉS</div>
            <p style={{color:'#94a3b8', fontSize:'.82rem', margin:0, lineHeight:1.6}}>{feedback}</p>
          </div>
        )}

        {/* Historial */}
        <div style={{flex:1, overflowY:'auto', marginBottom:'1rem'}}>
          {history.map((h,i)=>(
            <div key={i} style={{marginBottom:'1rem', display:'flex', justifyContent:h.role==='user'?'flex-end':'flex-start'}}>
              <div style={{maxWidth:'80%', background:h.role==='user'?'rgba(99,102,241,.15)':'rgba(30,41,59,.8)', border:`1px solid ${h.role==='user'?'rgba(99,102,241,.3)':'rgba(255,255,255,.06)'}`, borderRadius:h.role==='user'?'12px 12px 0 12px':'12px 12px 12px 0', padding:'10px 14px'}}>
                <p style={{color:'#e2e8f0', fontSize:'.82rem', margin:0, lineHeight:1.6}}>{h.content}</p>
                <div style={{fontSize:'.65rem', color:'#475569', marginTop:4}}>{h.role==='user'?'Tú':(INTERVIEWERS_CFG[interviewerId]||INTERVIEWERS_CFG.sara).name}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Transcripción */}
        {transcript && (
          <div style={{background:'rgba(16,185,129,.05)', border:'1px solid rgba(16,185,129,.2)', borderRadius:8, padding:'8px 12px', marginBottom:'1rem'}}>
            <p style={{color:'#10b981', fontSize:'.78rem', margin:0}}>🎤 "{transcript}"</p>
          </div>
        )}

        {/* Botón micrófono */}
        <div style={{display:'flex', justifyContent:'center'}}>
          {listening ? (
            <button onClick={stopListen}
              style={{width:72, height:72, borderRadius:'50%', background:'rgba(239,68,68,.15)', border:'2px solid #ef4444', color:'#ef4444', fontSize:'1.8rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', animation:'pulse 1s infinite'}}>
              ⏹
            </button>
          ) : (
            <button onClick={startListen} disabled={loading || speaking}
              style={{width:72, height:72, borderRadius:'50%', background:loading||speaking?'rgba(99,102,241,.1)':'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'#fff', fontSize:'1.8rem', cursor:loading||speaking?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:loading||speaking?'none':'0 0 30px rgba(99,102,241,.4)', opacity:loading||speaking?0.5:1}}>
              🎤
            </button>
          )}
        </div>
        <p style={{textAlign:'center', fontSize:'.72rem', color:'#475569', marginTop:8}}>
          {loading ? 'Alex está respondiendo...' : speaking ? 'Escucha a Alex...' : listening ? 'Habla ahora en inglés' : 'Presiona para responder'}
        </p>
      </div>
    </div>
  );
}


// ===== PANEL DE ADMINISTRADOR (solo visible para role === 'admin') =====
function AdminPanel({ token, user, onBack, onVerNivel }) {
  const [tab, setTab]       = useState('resumen');   // 'resumen' | 'niveles'
  const [stats, setStats]   = useState(null);
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]       = useState('');

  // Vista por nivel
  const [nivelSel, setNivelSel]   = useState(null);   // 'A1'...'C2' | null
  const [nivelData, setNivelData] = useState(null);
  const [nivelLoad, setNivelLoad] = useState(false);
  const [nivelErr, setNivelErr]   = useState('');
  const [alumnoOpen, setAlumnoOpen] = useState(null); // _id del alumno expandido
  const [detalle, setDetalle]       = useState({});    // cache: _id -> detalle completo
  const [detLoad, setDetLoad]       = useState(null);  // _id que se esta cargando
  const [editId, setEditId]         = useState(null);  // _id en edicion
  const [editForm, setEditForm]     = useState({ name:'', email:'', englishLevel:'A1' });
  const [accionMsg, setAccionMsg]   = useState('');    // mensaje de exito/error de accion
  const [accionBusy, setAccionBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);  // _id a confirmar borrado

  const recargarTodo = () => {
    const h = { Authorization: 'Bearer ' + token };
    Promise.all([
      fetch(API + '/api/admin/stats', { headers: h }).then(r=>r.json()),
      fetch(API + '/api/admin/users', { headers: h }).then(r=>r.json()),
    ]).then(([s,u])=>{ setStats(s); setUsers(u.users||[]); }).catch(()=>{});
    if (nivelSel) abrirNivel(nivelSel);
  };

  const guardarEdicion = (id) => {
    setAccionBusy(true); setAccionMsg('');
    fetch(API + '/api/admin/student/' + id, {
      method:'PUT',
      headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+token },
      body: JSON.stringify(editForm)
    })
      .then(r=>r.json().then(d=>({ok:r.ok,d})))
      .then(({ok,d})=>{
        setAccionBusy(false);
        if (!ok) { setAccionMsg('❌ ' + (d.msg||'No se pudo guardar')); return; }
        setAccionMsg('✅ ' + (d.msg||'Cambios guardados'));
        setEditId(null);
        setDetalle(prev=>{ const c={...prev}; delete c[id]; return c; });
        recargarTodo();
      })
      .catch(()=>{ setAccionBusy(false); setAccionMsg('❌ Error de conexion'); });
  };

  // 💎 Acceso total (alumno que pagó): sin límite diario, sin prueba, energía ilimitada
  const toggleAcceso = (id, valor) => {
    setAccionBusy(true); setAccionMsg('');
    fetch(API + '/api/admin/student/' + id, {
      method:'PUT',
      headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+token },
      body: JSON.stringify({ isPremium: valor })
    })
      .then(r=>r.json().then(d=>({ok:r.ok,d})))
      .then(({ok,d})=>{
        setAccionBusy(false);
        if (!ok) { setAccionMsg('❌ ' + (d.msg||'No se pudo')); return; }
        setAccionMsg(valor ? '💎 ACCESO TOTAL activado para este alumno' : '✅ Acceso total desactivado (vuelve a versión gratuita)');
        setDetalle(prev=>({ ...prev, [id]: { ...(prev[id]||{}), isPremium: valor } }));
      })
      .catch(()=>{ setAccionBusy(false); setAccionMsg('❌ Error de conexion'); });
  };

  const toggleEntrevista = (id, valor) => {
    setAccionBusy(true); setAccionMsg('');
    fetch(API + '/api/admin/student/' + id, {
      method:'PUT',
      headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+token },
      body: JSON.stringify({ interviewUnlocked: valor })
    })
      .then(r=>r.json().then(d=>({ok:r.ok,d})))
      .then(({ok,d})=>{
        setAccionBusy(false);
        if (!ok) { setAccionMsg('❌ ' + (d.msg||'No se pudo')); return; }
        setAccionMsg('✅ Entrevistas ' + (valor?'DESBLOQUEADAS':'bloqueadas') + ' para este alumno');
        setDetalle(prev=>({ ...prev, [id]: { ...(prev[id]||{}), interviewUnlocked: valor } }));
      })
      .catch(()=>{ setAccionBusy(false); setAccionMsg('❌ Error de conexion'); });
  };

  const eliminarAlumno = (id) => {
    setAccionBusy(true); setAccionMsg('');
    fetch(API + '/api/admin/student/' + id, {
      method:'DELETE',
      headers:{ Authorization:'Bearer '+token }
    })
      .then(r=>r.json().then(d=>({ok:r.ok,d})))
      .then(({ok,d})=>{
        setAccionBusy(false);
        setConfirmDel(null);
        if (!ok) { setAccionMsg('❌ ' + (d.msg||'No se pudo eliminar')); return; }
        setAccionMsg('✅ ' + (d.msg||'Alumno eliminado'));
        setAlumnoOpen(null);
        recargarTodo();
      })
      .catch(()=>{ setAccionBusy(false); setAccionMsg('❌ Error de conexion'); });
  };

  const abrirAlumno = (id) => {
    if (alumnoOpen === id) { setAlumnoOpen(null); return; }
    setAlumnoOpen(id);
    if (detalle[id]) return; // ya en cache
    setDetLoad(id);
    fetch(API + '/api/admin/student/' + id, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setDetalle(prev => ({ ...prev, [id]: d })); setDetLoad(null); })
      .catch(() => { setDetLoad(null); });
  };

  const fmtFecha = (f) => {
    if (!f) return 'Nunca';
    try { return new Date(f).toLocaleString('es-CO', { dateStyle:'medium', timeStyle:'short' }); }
    catch { return String(f); }
  };

  const NIVELES = ['A1','A2','B1','B2','C1','C2'];
  const card = { background:'#0f172a', border:'1px solid rgba(99,102,241,.2)', borderRadius:14, padding:'1rem 1.2rem' };

  useEffect(() => {
    let activo = true;
    const h = { Authorization: 'Bearer ' + token };
    Promise.all([
      fetch(API + '/api/admin/stats', { headers: h }).then(r => r.ok ? r.json() : Promise.reject(r.status)),
      fetch(API + '/api/admin/users', { headers: h }).then(r => r.ok ? r.json() : Promise.reject(r.status)),
    ])
      .then(([s, u]) => {
        if (!activo) return;
        setStats(s);
        setUsers(u.users || []);
        setLoading(false);
      })
      .catch((code) => {
        if (!activo) return;
        setErr(code === 403 ? 'Acceso restringido: solo administradores.' : 'No se pudo cargar el panel.');
        setLoading(false);
      });
    return () => { activo = false; };
  }, [token]);

  const abrirNivel = (nivel) => {
    setNivelSel(nivel);
    setNivelData(null);
    setNivelErr('');
    setAlumnoOpen(null);
    setNivelLoad(true);
    fetch(API + '/api/admin/level/' + nivel, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { setNivelData(d); setNivelLoad(false); })
      .catch(() => { setNivelErr('No se pudo cargar el nivel ' + nivel); setNivelLoad(false); });
  };

  const barra = (pct, color) => (
    <div style={{height:6,background:'rgba(99,102,241,.1)',borderRadius:6,overflow:'hidden',flex:1}}>
      <div style={{height:'100%',width:pct+'%',background:color||'linear-gradient(90deg,#6366f1,#06b6d4)',borderRadius:6,transition:'width .4s'}}/>
    </div>
  );

  return (
    <div style={{background:'#020617',minHeight:'100vh',fontFamily:"'Poppins',sans-serif",color:'#e2e8f0'}}>
      <style>{KF}</style>
      <div style={{background:'rgba(9,11,21,0.97)',height:54,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 1.5rem',borderBottom:'1px solid rgba(99,102,241,0.12)',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:30,height:30,background:'linear-gradient(135deg,#f59e0b,#ef4444)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.85rem'}}>🛡️</div>
          <span style={{fontWeight:800,fontSize:'.95rem',color:'#f1f5f9'}}>Panel de Administrador</span>
          <span style={{background:'rgba(245,158,11,.15)',color:'#f59e0b',fontSize:'.6rem',fontWeight:700,padding:'2px 8px',borderRadius:50,border:'1px solid rgba(245,158,11,.3)'}}>ADMIN</span>
        </div>
        <button onClick={onBack} style={{background:'transparent',border:'1px solid rgba(99,102,241,.3)',color:'#a5b4fc',padding:'5px 14px',borderRadius:8,cursor:'pointer',fontSize:'.78rem',fontWeight:600}}>← Volver</button>
      </div>

      <div style={{padding:'1.4rem 1.5rem',maxWidth:1100,margin:'0 auto'}}>
        {loading && <div style={{textAlign:'center',color:'#64748b',padding:'3rem'}}>Cargando datos…</div>}
        {err && <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',color:'#fca5a5',borderRadius:12,padding:14,textAlign:'center'}}>{err}</div>}

        {!loading && !err && stats && (
          <>
            <h1 style={{fontSize:'1.3rem',fontWeight:900,marginBottom:4}}>Hola, {(user?.name||'Admin').split(' ')[0]} 👋</h1>
            <p style={{color:'#64748b',fontSize:'.8rem',marginBottom:'1.2rem'}}>Encargado de AulaQuest. Puedes ver la informacion de todos los alumnos y el avance de cada nivel.</p>

            {/* Tabs */}
            <div style={{display:'flex',gap:8,marginBottom:'1.4rem'}}>
              {[{k:'resumen',l:'📊 Resumen general'},{k:'niveles',l:'📚 Por nivel'}].map(t=>(
                <button key={t.k} onClick={()=>setTab(t.k)}
                  style={{background:tab===t.k?'rgba(99,102,241,.18)':'transparent',border:'1px solid '+(tab===t.k?'rgba(99,102,241,.5)':'rgba(99,102,241,.15)'),color:tab===t.k?'#a5b4fc':'#64748b',padding:'8px 16px',borderRadius:10,cursor:'pointer',fontSize:'.8rem',fontWeight:700,fontFamily:"'Poppins',sans-serif"}}>
                  {t.l}
                </button>
              ))}
            </div>

            {/* ================= RESUMEN GENERAL ================= */}
            {tab==='resumen' && (
              <>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:'1.4rem'}}>
                  {[
                    {l:'Usuarios totales', v:stats.totalUsuarios, c:'#6366f1', i:'👥'},
                    {l:'Alumnos',          v:stats.totalAlumnos,  c:'#10b981', i:'🎓'},
                    {l:'Administradores',  v:stats.totalAdmins,   c:'#f59e0b', i:'🛡️'},
                    {l:'XP acumulado',     v:stats.xpTotal,       c:'#06b6d4', i:'⚡'},
                    {l:'Palabras correctas', v:stats.palabrasTotal, c:'#d946ef', i:'🗣️'},
                  ].map((k,i)=>(
                    <div key={i} style={{...card,display:'flex',flexDirection:'column',gap:4}}>
                      <span style={{fontSize:'1.2rem'}}>{k.i}</span>
                      <span style={{fontSize:'1.5rem',fontWeight:900,color:k.c}}>{k.v}</span>
                      <span style={{fontSize:'.7rem',color:'#64748b'}}>{k.l}</span>
                    </div>
                  ))}
                </div>

                <div style={{...card,marginBottom:'1.4rem'}}>
                  <div style={{fontSize:'.85rem',fontWeight:700,marginBottom:12}}>Usuarios por nivel</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {NIVELES.map(n=>(
                      <div key={n} style={{flex:'1 1 90px',background:'rgba(99,102,241,.06)',border:'1px solid rgba(99,102,241,.15)',borderRadius:10,padding:'10px',textAlign:'center'}}>
                        <div style={{fontSize:'.7rem',color:'#a5b4fc',fontWeight:700}}>{n}</div>
                        <div style={{fontSize:'1.3rem',fontWeight:900,color:'#e2e8f0'}}>{stats.porNivel?.[n]||0}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{...card,padding:0,overflow:'hidden'}}>
                  <div style={{padding:'1rem 1.2rem',fontSize:'.85rem',fontWeight:700,borderBottom:'1px solid rgba(99,102,241,.12)'}}>
                    Todos los usuarios ({users.length})
                  </div>
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:'.78rem'}}>
                      <thead>
                        <tr style={{color:'#64748b',textAlign:'left'}}>
                          <th style={{padding:'10px 12px',fontWeight:600}}>Nombre</th>
                          <th style={{padding:'10px 12px',fontWeight:600}}>Email</th>
                          <th style={{padding:'10px 12px',fontWeight:600}}>Rol</th>
                          <th style={{padding:'10px 12px',fontWeight:600}}>Nivel</th>
                          <th style={{padding:'10px 12px',fontWeight:600,textAlign:'right'}}>XP</th>
                          <th style={{padding:'10px 12px',fontWeight:600,textAlign:'right'}}>Palabras</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u=>(
                          <tr key={u._id} style={{borderTop:'1px solid rgba(99,102,241,.08)'}}>
                            <td style={{padding:'10px 12px',fontWeight:600,color:'#e2e8f0'}}>{u.name}</td>
                            <td style={{padding:'10px 12px',color:'#94a3b8'}}>{u.email}</td>
                            <td style={{padding:'10px 12px'}}>
                              <span style={{fontSize:'.66rem',fontWeight:700,padding:'2px 8px',borderRadius:50,background:u.role==='admin'?'rgba(245,158,11,.15)':'rgba(99,102,241,.12)',color:u.role==='admin'?'#f59e0b':'#a5b4fc'}}>
                                {u.role==='admin'?'ADMIN':'alumno'}
                              </span>
                            </td>
                            <td style={{padding:'10px 12px',color:'#10b981',fontWeight:600}}>{u.englishLevel}</td>
                            <td style={{padding:'10px 12px',textAlign:'right',color:'#06b6d4',fontWeight:700}}>{u.experiencePoints||0}</td>
                            <td style={{padding:'10px 12px',textAlign:'right',color:'#94a3b8'}}>{u.wordsCorrect||0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ================= POR NIVEL ================= */}
            {tab==='niveles' && (
              <>
                <div style={{fontSize:'.8rem',color:'#64748b',marginBottom:10}}>Selecciona un nivel para ver los alumnos que estan ahi y como van:</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(90px,1fr))',gap:10,marginBottom:'1.4rem'}}>
                  {NIVELES.map(n=>(
                    <button key={n} onClick={()=>abrirNivel(n)}
                      style={{background:nivelSel===n?'rgba(99,102,241,.2)':'#0f172a',border:'1px solid '+(nivelSel===n?'rgba(99,102,241,.6)':'rgba(99,102,241,.15)'),borderRadius:12,padding:'16px 8px',cursor:'pointer',transition:'all .2s'}}>
                      <div style={{fontSize:'1.3rem',fontWeight:900,color:nivelSel===n?'#a5b4fc':'#e2e8f0'}}>{n}</div>
                      <div style={{fontSize:'.62rem',color:'#64748b',marginTop:2}}>{stats.porNivel?.[n]||0} alumnos</div>
                    </button>
                  ))}
                </div>

                {nivelLoad && <div style={{textAlign:'center',color:'#64748b',padding:'2rem'}}>Cargando nivel {nivelSel}…</div>}
                {nivelErr && <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',color:'#fca5a5',borderRadius:12,padding:14,textAlign:'center'}}>{nivelErr}</div>}

                {!nivelLoad && nivelData && (
                  <>
                    <button onClick={()=>onVerNivel && onVerNivel(nivelData.nivel)}
                      style={{width:'100%',marginBottom:'1.2rem',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',padding:'12px',borderRadius:12,fontWeight:700,fontSize:'.85rem',cursor:'pointer',fontFamily:"'Poppins',sans-serif",boxShadow:'0 4px 15px rgba(99,102,241,.3)'}}>
                      👁️ Entrar al aula de {nivelData.nivel} (ver temas y minijuego)
                    </button>
                    <div style={{display:'flex',gap:12,marginBottom:'1.2rem',flexWrap:'wrap'}}>
                      <div style={{...card,flex:'1 1 120px',textAlign:'center'}}>
                        <div style={{fontSize:'1.6rem',fontWeight:900,color:'#6366f1'}}>{nivelData.totalAlumnos}</div>
                        <div style={{fontSize:'.7rem',color:'#64748b'}}>Alumnos en {nivelData.nivel}</div>
                      </div>
                      <div style={{...card,flex:'1 1 120px',textAlign:'center'}}>
                        <div style={{fontSize:'1.6rem',fontWeight:900,color:'#10b981'}}>{nivelData.totalTemas}</div>
                        <div style={{fontSize:'.7rem',color:'#64748b'}}>Temas del nivel</div>
                      </div>
                      <div style={{...card,flex:'1 1 120px',textAlign:'center'}}>
                        <div style={{fontSize:'1.6rem',fontWeight:900,color:'#d946ef'}}>{nivelData.totalPalabrasNivel}</div>
                        <div style={{fontSize:'.7rem',color:'#64748b'}}>Palabras del nivel</div>
                      </div>
                    </div>

                    {nivelData.alumnos.length === 0 && (
                      <div style={{...card,textAlign:'center',color:'#64748b'}}>No hay alumnos en el nivel {nivelData.nivel}.</div>
                    )}

                    {nivelData.alumnos.map(a=>{
                      const abierto = alumnoOpen === a._id;
                      return (
                        <div key={a._id} style={{...card,marginBottom:10,padding:0,overflow:'hidden'}}>
                          <div onClick={()=>abrirAlumno(a._id)}
                            style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',cursor:'pointer'}}>
                            <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.8rem',fontWeight:700,color:'#fff',flexShrink:0}}>
                              {(a.name||'?').substring(0,2).toUpperCase()}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:'.85rem',fontWeight:700,color:'#e2e8f0'}}>{a.name} {a.aprobado && <span style={{fontSize:'.6rem',color:'#10b981',background:'rgba(16,185,129,.15)',padding:'1px 6px',borderRadius:50,marginLeft:4}}>APROBADO</span>}</div>
                              <div style={{fontSize:'.68rem',color:'#64748b'}}>{a.email}</div>
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:8,minWidth:160}}>
                              {barra(a.progresoGeneral)}
                              <span style={{fontSize:'.72rem',fontWeight:700,color:'#a5b4fc',width:38,textAlign:'right'}}>{a.progresoGeneral}%</span>
                            </div>
                            <div style={{fontSize:'.7rem',color:'#64748b',width:70,textAlign:'right'}}>{a.temasCompletos}/{nivelData.totalTemas} temas</div>
                            <span style={{color:'#475569',fontSize:'.8rem'}}>{abierto?'▲':'▼'}</span>
                          </div>

                          {abierto && (
                            <div style={{borderTop:'1px solid rgba(99,102,241,.1)',padding:'14px 16px',background:'rgba(2,6,23,.4)'}}>
                              {detLoad===a._id && <div style={{textAlign:'center',color:'#64748b',padding:'1rem',fontSize:'.78rem'}}>Cargando aula del estudiante…</div>}
                              {detalle[a._id] && (()=> {
                                const d = detalle[a._id];
                                return (
                                  <>
                                    {/* Acciones de admin: editar / eliminar */}
                                    <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
                                      {accionMsg && <span style={{fontSize:'.7rem',color:accionMsg.startsWith('✅')?'#34d399':'#f87171',marginRight:'auto'}}>{accionMsg}</span>}
                                      {editId!==a._id && confirmDel!==a._id && (<>
                                        <button onClick={()=>{ setEditId(a._id); setAccionMsg(''); setEditForm({ name:d.name, email:d.email, englishLevel:d.englishLevel }); }}
                                          style={{background:'rgba(99,102,241,.15)',border:'1px solid rgba(99,102,241,.4)',color:'#a5b4fc',padding:'5px 12px',borderRadius:8,cursor:'pointer',fontSize:'.72rem',fontWeight:700,fontFamily:"'Poppins',sans-serif"}}>✏️ Editar</button>
                                        <button onClick={()=>{ setConfirmDel(a._id); setAccionMsg(''); }}
                                          style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.4)',color:'#fca5a5',padding:'5px 12px',borderRadius:8,cursor:'pointer',fontSize:'.72rem',fontWeight:700,fontFamily:"'Poppins',sans-serif"}}>🗑️ Eliminar</button>
                                      </>)}
                                    </div>

                                    {/* Confirmacion de borrado */}
                                    {confirmDel===a._id && (
                                      <div style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.3)',borderRadius:10,padding:'12px 14px',marginBottom:14}}>
                                        <div style={{fontSize:'.78rem',color:'#fca5a5',marginBottom:10}}>¿Seguro que quieres eliminar a <b>{d.name}</b>? Esta accion no se puede deshacer.</div>
                                        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                                          <button onClick={()=>setConfirmDel(null)} disabled={accionBusy}
                                            style={{background:'transparent',border:'1px solid rgba(99,102,241,.3)',color:'#94a3b8',padding:'6px 14px',borderRadius:8,cursor:'pointer',fontSize:'.72rem',fontWeight:600,fontFamily:"'Poppins',sans-serif"}}>Cancelar</button>
                                          <button onClick={()=>eliminarAlumno(a._id)} disabled={accionBusy}
                                            style={{background:'#dc2626',border:'none',color:'#fff',padding:'6px 14px',borderRadius:8,cursor:accionBusy?'wait':'pointer',fontSize:'.72rem',fontWeight:700,fontFamily:"'Poppins',sans-serif"}}>{accionBusy?'Eliminando…':'Si, eliminar'}</button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Formulario de edicion */}
                                    {editId===a._id && (
                                      <div style={{background:'rgba(99,102,241,.06)',border:'1px solid rgba(99,102,241,.25)',borderRadius:10,padding:'12px 14px',marginBottom:14}}>
                                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                                          <div>
                                            <label style={{fontSize:'.65rem',color:'#94a3b8',display:'block',marginBottom:4}}>Nombre</label>
                                            <input value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})}
                                              style={{width:'100%',padding:'8px 10px',background:'#0f172a',border:'1px solid rgba(99,102,241,.2)',borderRadius:8,color:'#e2e8f0',fontSize:'.78rem',boxSizing:'border-box',fontFamily:"'Poppins',sans-serif",outline:'none'}}/>
                                          </div>
                                          <div>
                                            <label style={{fontSize:'.65rem',color:'#94a3b8',display:'block',marginBottom:4}}>Nivel</label>
                                            <select value={editForm.englishLevel} onChange={e=>setEditForm({...editForm,englishLevel:e.target.value})}
                                              style={{width:'100%',padding:'8px 10px',background:'#0f172a',border:'1px solid rgba(99,102,241,.2)',borderRadius:8,color:'#e2e8f0',fontSize:'.78rem',boxSizing:'border-box',fontFamily:"'Poppins',sans-serif",outline:'none'}}>
                                              {['A1','A2','B1','B2','C1','C2'].map(l=><option key={l} value={l}>{l}</option>)}
                                            </select>
                                          </div>
                                        </div>
                                        <div style={{marginBottom:10}}>
                                          <label style={{fontSize:'.65rem',color:'#94a3b8',display:'block',marginBottom:4}}>Correo</label>
                                          <input value={editForm.email} onChange={e=>setEditForm({...editForm,email:e.target.value})}
                                            style={{width:'100%',padding:'8px 10px',background:'#0f172a',border:'1px solid rgba(99,102,241,.2)',borderRadius:8,color:'#e2e8f0',fontSize:'.78rem',boxSizing:'border-box',fontFamily:"'Poppins',sans-serif",outline:'none'}}/>
                                        </div>
                                        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                                          <button onClick={()=>{ setEditId(null); setAccionMsg(''); }} disabled={accionBusy}
                                            style={{background:'transparent',border:'1px solid rgba(99,102,241,.3)',color:'#94a3b8',padding:'6px 14px',borderRadius:8,cursor:'pointer',fontSize:'.72rem',fontWeight:600,fontFamily:"'Poppins',sans-serif"}}>Cancelar</button>
                                          <button onClick={()=>guardarEdicion(a._id)} disabled={accionBusy}
                                            style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',color:'#fff',padding:'6px 16px',borderRadius:8,cursor:accionBusy?'wait':'pointer',fontSize:'.72rem',fontWeight:700,fontFamily:"'Poppins',sans-serif"}}>{accionBusy?'Guardando…':'Guardar'}</button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Tarjetas de actividad / aula */}
                                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:8,marginBottom:14}}>
                                      {[
                                        {l:'Nivel actual', v:d.englishLevel, c:'#10b981'},
                                        {l:'XP total',     v:d.experiencePoints, c:'#06b6d4'},
                                        {l:'Palabras ok',  v:d.wordsCorrect, c:'#d946ef'},
                                        {l:'Veces practicó', v:d.practiceCount, c:'#f59e0b'},
                                      ].map((k,i)=>(
                                        <div key={i} style={{background:'rgba(99,102,241,.06)',border:'1px solid rgba(99,102,241,.15)',borderRadius:10,padding:'8px 10px',textAlign:'center'}}>
                                          <div style={{fontSize:'1.1rem',fontWeight:900,color:k.c}}>{k.v}</div>
                                          <div style={{fontSize:'.6rem',color:'#64748b'}}>{k.l}</div>
                                        </div>
                                      ))}
                                    </div>
                                    <div style={{display:'flex',gap:16,flexWrap:'wrap',fontSize:'.68rem',color:'#94a3b8',marginBottom:14}}>
                                      <span>📅 Miembro desde: {fmtFecha(d.createdAt)}</span>
                                      <span>🕒 Ultima actividad: {fmtFecha(d.lastActive)}</span>
                                      <span>{d.emailVerified ? '✅ Correo confirmado' : '⚠️ Correo sin confirmar'}</span>
                                      <span>🏅 Niveles aprobados: {d.nivelesAprobados.length ? d.nivelesAprobados.join(', ') : 'ninguno'}</span>
                                    </div>

                                    {/* 💎 Acceso total (pago) — el admin desbloquea cuando el alumno paga */}
                                    <div style={{display:'flex',alignItems:'center',gap:10,background:d.isPremium?'rgba(245,158,11,.08)':'rgba(255,255,255,.03)',border:'1px solid '+(d.isPremium?'rgba(245,158,11,.4)':'rgba(255,255,255,.1)'),borderRadius:10,padding:'10px 12px',marginBottom:10,flexWrap:'wrap'}}>
                                      <span style={{fontSize:'1.05rem'}}>💎</span>
                                      <div style={{flex:1,minWidth:160}}>
                                        <div style={{fontSize:'.72rem',fontWeight:700,color:'#e2e8f0'}}>Acceso total (alumno que pagó)</div>
                                        <div style={{fontSize:'.62rem',color:d.isPremium?'#fbbf24':'#94a3b8'}}>
                                          {d.isPremium ? '💎 ACTIVO — sin límite diario, sin vencimiento y energía ilimitada' : '🔒 Versión gratuita — 1 tema/día y prueba de 10 días'}
                                        </div>
                                      </div>
                                      <button onClick={()=>toggleAcceso(d._id, !d.isPremium)} disabled={accionBusy}
                                        style={{background:d.isPremium?'rgba(239,68,68,.12)':'linear-gradient(135deg,#f59e0b,#d97706)',color:d.isPremium?'#f87171':'#fff',border:d.isPremium?'1px solid rgba(239,68,68,.3)':'none',borderRadius:8,padding:'8px 16px',fontSize:'.68rem',fontWeight:700,cursor:accionBusy?'wait':'pointer',fontFamily:"'Poppins',sans-serif",whiteSpace:'nowrap'}}>
                                        {d.isPremium ? 'Quitar acceso' : '💎 Activar (pagó)'}
                                      </button>
                                    </div>

                                    {/* Acceso a Entrevistas con IA */}
                                    <div style={{display:'flex',alignItems:'center',gap:10,background:'rgba(99,102,241,.06)',border:'1px solid rgba(99,102,241,.18)',borderRadius:10,padding:'10px 12px',marginBottom:14,flexWrap:'wrap'}}>
                                      <span style={{fontSize:'1.05rem'}}>💼</span>
                                      <div style={{flex:1,minWidth:160}}>
                                        <div style={{fontSize:'.72rem',fontWeight:700,color:'#e2e8f0'}}>Entrevistas con IA</div>
                                        <div style={{fontSize:'.62rem',color:d.interviewUnlocked?'#34d399':'#f87171'}}>
                                          {d.interviewUnlocked ? '✅ Desbloqueadas' : '🔒 Bloqueadas'}
                                          {(d.interviewRequestedAt && !d.interviewUnlocked) ? ' · solicitó el '+fmtFecha(d.interviewRequestedAt) : ''}
                                        </div>
                                      </div>
                                      <button onClick={()=>toggleEntrevista(d._id, !d.interviewUnlocked)} disabled={accionBusy}
                                        style={{background:d.interviewUnlocked?'rgba(239,68,68,.12)':'linear-gradient(135deg,#6366f1,#8b5cf6)',color:d.interviewUnlocked?'#f87171':'#fff',border:d.interviewUnlocked?'1px solid rgba(239,68,68,.3)':'none',borderRadius:8,padding:'8px 16px',fontSize:'.68rem',fontWeight:700,cursor:accionBusy?'wait':'pointer',fontFamily:"'Poppins',sans-serif",whiteSpace:'nowrap'}}>
                                        {d.interviewUnlocked ? 'Bloquear' : 'Desbloquear'}
                                      </button>
                                    </div>

                                    {/* Aula: progreso por cada nivel */}
                                    <div style={{fontSize:'.7rem',fontWeight:700,color:'#64748b',marginBottom:10}}>SU AULA — PROGRESO POR NIVEL</div>
                                    {d.niveles.map(nv=>(
                                      <div key={nv.nivel} style={{marginBottom:12,background:nv.esActual?'rgba(99,102,241,.06)':'transparent',border:'1px solid '+(nv.esActual?'rgba(99,102,241,.25)':'rgba(99,102,241,.1)'),borderRadius:10,padding:'10px 12px'}}>
                                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                                          <span style={{fontSize:'.8rem',fontWeight:800,color:nv.aprobado?'#10b981':nv.esActual?'#a5b4fc':'#e2e8f0'}}>{nv.nivel}</span>
                                          {nv.esActual && <span style={{fontSize:'.55rem',color:'#a5b4fc',background:'rgba(99,102,241,.15)',padding:'1px 6px',borderRadius:50}}>ACTUAL</span>}
                                          {nv.aprobado && <span style={{fontSize:'.55rem',color:'#10b981',background:'rgba(16,185,129,.15)',padding:'1px 6px',borderRadius:50}}>APROBADO</span>}
                                          {barra(nv.progreso, nv.aprobado?'#10b981':'linear-gradient(90deg,#6366f1,#06b6d4)')}
                                          <span style={{fontSize:'.68rem',fontWeight:700,color:'#94a3b8',width:36,textAlign:'right'}}>{nv.progreso}%</span>
                                          <span style={{fontSize:'.62rem',color:'#64748b',width:66,textAlign:'right'}}>{nv.temasCompletos}/{nv.totalTemas} temas</span>
                                        </div>
                                        <div style={{display:'grid',gap:5,paddingLeft:4}}>
                                          {nv.temas.map(t=>(
                                            <div key={t.id} style={{display:'flex',alignItems:'center',gap:8}}>
                                              <span style={{fontSize:'.85rem',width:18,textAlign:'center'}}>{t.icono||'📘'}</span>
                                              <span style={{fontSize:'.7rem',color:t.completo?'#10b981':'#cbd5e1',width:120,fontWeight:t.completo?700:400}}>{t.titulo}</span>
                                              {barra(t.pct, t.completo?'#10b981':'linear-gradient(90deg,#6366f1,#8b5cf6)')}
                                              <span style={{fontSize:'.62rem',color:'#64748b',width:48,textAlign:'right'}}>{t.completadas}/{t.total}</span>
                                              {t.completo && <span style={{color:'#10b981',fontSize:'.7rem'}}>✓</span>}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CrisisRoomGame({ onBack }) {
  const CRISES = [
    "An advanced AI satellite network has locked down all maritime trade routes in the Atlantic, demanding global digital disarmament.",
    "Scientists accidentally ignite an underground atmospheric reaction that causes it to rain carbonated sugary soda across all European agricultural sectors.",
    "A rogue nation claims to have successfully cloned 5 major world leaders, asserting that the current presidents are all deepfakes.",
    "Global internet servers completely collapse for 2 hours, wiping out all cloud data regarding personal financial records and debts.",
  ];
  const RULES = [
    "Must heavily inject advanced subjunctive mood & past regrets (e.g., 'It is of paramount importance that every nation act...', 'We should have foreseen...').",
    "Must use at least three highly advanced C2 level vocabulary pieces (e.g., 'unprecedented, paramount, cataclysmic, transient, paradigm shift').",
    "Must execute your argument utilizing advanced parallel structures and rhythmic triadic prose (Rule of Three).",
    "Must deliver the entire rebuttal using a tone of heavy irony and elegant understatement without breaking character.",
  ];
  const pick = arr => arr[Math.floor(Math.random()*arr.length)];

  const [data, setData] = useState({ crisis:'Despliega la matriz de simulación de crisis global...', rule:'-' });
  const [timeLeft, setTimeLeft] = useState(150);
  const [running, setRunning]   = useState(false);
  const intervalRef = useRef(null);

  const stop = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  useEffect(()=>()=>stop(), []);

  const trigger = () => {
    setData({ crisis: pick(CRISES), rule: pick(RULES) });
    resetTimer();
  };
  const startTimer = () => {
    stop(); setRunning(true);
    intervalRef.current = setInterval(()=>{
      setTimeLeft(prev => { if (prev <= 1) { stop(); setRunning(false); return 0; } return prev - 1; });
    }, 1000);
  };
  const resetTimer = () => { stop(); setRunning(false); setTimeLeft(150); };

  const mm = String(Math.floor(timeLeft/60)).padStart(2,'0');
  const ss = String(timeLeft%60).padStart(2,'0');
  const timerLabel = (timeLeft===0 && !running) ? 'DEBATE FLOOR OPEN!' : `${mm}:${ss}`;

  const CRI='#f43f5e', EME='#10b981';
  const card = { background:'#111a2e', borderRadius:16, padding:35, border:'1px solid #1e293b', boxShadow:'0 25px 50px -12px rgba(0,0,0,.6)' };
  const box  = (green)=>({ background:'#090d16', padding:22, borderRadius:10, borderLeft:`6px solid ${green?EME:CRI}` });
  const lbl  = { display:'block', fontSize:'.8rem', color:'#64748b', fontWeight:'bold', textTransform:'uppercase', marginBottom:8 };
  const btn  = { background:'linear-gradient(135deg,#f43f5e,#be123c)', color:'#fff', border:'none', padding:16, fontSize:'1.1rem', fontWeight:'bold', borderRadius:8, cursor:'pointer', width:'100%', boxShadow:'0 4px 14px rgba(244,63,94,.4)' };

  return (
    <div style={{background:'#090d16',minHeight:'100vh',color:'#f8fafc',fontFamily:"'Segoe UI',system-ui,sans-serif",padding:25}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <button onClick={onBack} style={{background:'transparent',border:'1px solid rgba(244,63,94,.5)',color:CRI,padding:'7px 16px',borderRadius:8,cursor:'pointer',fontWeight:600,marginBottom:18}}>← Volver al aula</button>
        <header style={{textAlign:'center',marginBottom:30}}>
          <h1 style={{color:CRI,fontSize:'2.8rem',margin:0,fontWeight:900,letterSpacing:'-1px'}}>The Geopolitical Crisis Room</h1>
          <p style={{color:'#64748b',fontSize:'1.1rem'}}>Level C2 • Diplomatic Nuance, Absolute Eloquence & Masterful Rhetoric under Threat</p>
        </header>

        <div style={{display:'grid',gridTemplateColumns:'1.3fr 1fr',gap:30}}>
          <div style={card}>
            <h3 style={{color:CRI,borderBottom:'2px solid #1e293b',paddingBottom:12,marginTop:0,textTransform:'uppercase',letterSpacing:1,display:'flex',justifyContent:'space-between',fontSize:'1.25rem'}}>⚠️ Global Threat Matrix <span style={{color:EME}}>C2 Master</span></h3>
            <div style={{display:'flex',flexDirection:'column',gap:20,marginBottom:30}}>
              <div style={box(false)}><label style={lbl}>🚨 Flashpoint Flash Intel</label><p style={{margin:0,fontSize:'1.25rem',fontWeight:600,lineHeight:1.5}}>{data.crisis}</p></div>
              <div style={box(true)}><label style={lbl}>⚖️ Mandatory Rhetorical Constraint</label><p style={{margin:0,fontSize:'1.15rem',fontWeight:600,lineHeight:1.5,color:EME}}>{data.rule}</p></div>
            </div>
            <button style={btn} onClick={trigger}>💥 Inject Global Crisis</button>
            <div style={{background:'#090d16',padding:25,borderRadius:12,textAlign:'center',marginTop:30,border:'1px solid #1e293b'}}>
              <div style={{fontSize:'3.8rem',fontWeight:900,fontFamily:'monospace',color:CRI}}>{timerLabel}</div>
              <div style={{display:'flex',gap:10,marginTop:15}}>
                <button onClick={startTimer} disabled={running} style={{...btn,background:'#334155',boxShadow:'none',opacity:running?0.6:1,cursor:running?'default':'pointer'}}>Iniciar cumbre</button>
                <button onClick={resetTimer} style={{...btn,background:'#334155',boxShadow:'none'}}>Detener</button>
              </div>
            </div>
          </div>

          <div style={{...card,background:'#0f172a'}}>
            <h3 style={{color:CRI,borderBottom:'2px solid #1e293b',paddingBottom:12,marginTop:0,textTransform:'uppercase',letterSpacing:1,fontSize:'1.25rem'}}>🎭 C2 Eloquence Requirements</h3>
            {[
              ['Diplomatic Mitigation:',' Avoid aggressive direct vocabulary. Use euphemisms and hedge statements natively (e.g., "With all due respect, your stance seems somewhat unviable given the current climate...").'],
              ['Sophisticated C2 Grammar:',' Implement conditional clauses with omitted \'if\' (e.g., "Should the alliance fail to act...", "Had we known the ramifications earlier...").'],
              ['Flawless Fluidity:',' Zero hesitation or fillers (uhm, like, so). The speaker must sound like a seasoned ambassador addressing the UN Security Council.'],
            ].map(([b,t],i)=>(
              <div key={i} style={{background:'#1e293b',padding:18,borderRadius:8,marginBottom:15,fontSize:'.95rem',borderRight:`4px solid ${EME}`}}>
                <span style={{color:EME,fontWeight:'bold',display:'block',marginBottom:4}}>{b}</span>{t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


// ===== ENTREVISTA C2 — Panel de ondas conectado a n8n (webhook fijo y oculto) =====
const N8N_WEBHOOK = 'https://nexlum-aulaquest.onrender.com/api/interview/message';
function EntrevistaPanel({ token, user, onBack, persona }) {
  const cvRef = useRef(null);
  const audioRef = useRef(null);
  const recRef = useRef(null);
  const micStreamRef = useRef(null);
  const modeRef = useRef('idle');      // idle | ai | student
  const ampRef = useRef(0.05);
  const mutedRef = useRef(false);
  const historyRef = useRef([]);

  const [started, setStarted] = useState(false);
  const [capTag, setCapTag]   = useState('AI INTERVIEWER');
  const [capTxt, setCapTxt]   = useState('Pulsa “Comenzar entrevista”. El reclutador te explicará cómo será la práctica y empezará la entrevista.');
  const [fb, setFb]           = useState(null);
  const [status, setStatus]   = useState('listo');
  const [listening, setListening] = useState(false);
  const [muted, setMuted]     = useState(false);

  // ---- Canvas de ondas ----
  useEffect(()=>{
    const cv=cvRef.current; if(!cv) return;
    const ctx=cv.getContext('2d');
    let raf, t=0, Wc=0, Hc=0;
    const DPR=Math.min(window.devicePixelRatio||1,2);
    // Paleta de la onda según el entrevistador
    const id=(persona&&persona.nombre)||'';
    const TEMA = id==='NEXA'
      ? [[111,224,255],[58,168,232],[176,122,255]]                   // NEXA: cian/morado
      : id==='Michael'
      ? [[217,160,124],[158,196,238],[124,134,150]]                  // Michael: cálido/azul
      : [[59,130,246],[220,230,255],[244,63,94]];                    // AI Teacher: azul→blanco→rojo
    const rgb=(a)=>`rgba(${a[0]},${a[1]},${a[2]},.95)`;
    const resize=()=>{ const r=cv.getBoundingClientRect(); Wc=r.width; Hc=r.height; cv.width=Wc*DPR; cv.height=Hc*DPR; ctx.setTransform(DPR,0,0,DPR,0,0); };
    resize(); window.addEventListener('resize',resize);
    const draw=()=>{
      t+=0.022; ctx.clearRect(0,0,Wc,Hc);
      const yc=Hc*0.5, w=Wc, mode=modeRef.current;
      const tgt = mode==='ai'?0.85 : mode==='student'?0.55 : 0.06;
      ampRef.current += (tgt-ampRef.current)*0.05;
      const amp=ampRef.current;
      const grad=ctx.createLinearGradient(0,0,w,0);
      if(mode==='student'){ grad.addColorStop(0,'rgba(16,185,129,.9)');grad.addColorStop(.5,'rgba(45,212,191,1)');grad.addColorStop(1,'rgba(16,185,129,.9)'); }
      else { grad.addColorStop(0,rgb(TEMA[0]));grad.addColorStop(.5,rgb(TEMA[1]));grad.addColorStop(1,rgb(TEMA[2])); }
      const layers=30;
      for(let l=0;l<layers;l++){
        const k=l/layers, dir=l%2===0?1:-1;
        ctx.beginPath(); ctx.strokeStyle=grad; ctx.globalAlpha=0.05+0.15*(1-k); ctx.lineWidth=1;
        for(let x=0;x<=w;x+=3){
          const nx=x/w, env=Math.pow(Math.sin(nx*Math.PI),1.2);
          const A=amp*(0.25+0.75*(1-k))*env*Hc*0.42;
          const y=yc+dir*A*(Math.sin(nx*14+t*1.0+l*0.4)*0.5+Math.sin(nx*26+t*1.5+l)*0.3+Math.sin(nx*40-t*1.2+l*0.7)*0.2);
          x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha=1; ctx.lineWidth=2; ctx.strokeStyle=grad; ctx.shadowColor='rgba(120,170,255,.8)'; ctx.shadowBlur=12;
      ctx.beginPath();
      for(let x=0;x<=w;x+=3){ const nx=x/w, env=Math.pow(Math.sin(nx*Math.PI),1.5); const y=yc+amp*env*Hc*0.05*Math.sin(nx*30+t*1.8); x===0?ctx.moveTo(x,y):ctx.lineTo(x,y); }
      ctx.stroke(); ctx.shadowBlur=0;
      raf=requestAnimationFrame(draw);
    };
    draw();
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize',resize); };
  },[]);

  // limpiar audio/mic al salir
  useEffect(()=>()=>{ try{ window.speechSynthesis.cancel(); }catch(e){} try{ audioRef.current&&audioRef.current.pause(); }catch(e){} try{ recRef.current&&recRef.current.abort&&recRef.current.abort(); }catch(e){} },[]);

  const speakFallback=(text)=>{
    const synth=window.speechSynthesis; if(mutedRef.current||!synth) return;
    synth.cancel();
    const u=new SpeechSynthesisUtterance(text); u.lang='en-US'; u.rate=0.82; u.pitch=0.95;
    u.onstart=()=>{ modeRef.current='ai'; setStatus('🔊 hablando…'); };
    u.onend=()=>{ modeRef.current='idle'; setStatus('tu turno — pulsa 🎤'); };
    synth.speak(u);
  };

  const reproducir=(data)=>{
    const texto=data.interviewer||data.reply||data.text||'...';
    setCapTxt(texto); setCapTag('AI SPEAKING');
    const f=data.feedback;
    if(f && typeof f==='object' && (f.original||f.corrected)) setFb({tipo:'obj',...f});
    else if(f) setFb({tipo:'txt',texto:f});
    if(!audioRef.current) audioRef.current=new Audio();
    const a=audioRef.current;
    if(data.audio && !mutedRef.current){
      a.src='data:'+(data.audioMimeType||'audio/mpeg')+';base64,'+data.audio;
      a.playbackRate=0.95; modeRef.current='ai'; setStatus('🔊 hablando…');
      a.onended=()=>{ modeRef.current='idle'; setStatus(data.isFinished?'entrevista finalizada':'tu turno — pulsa 🎤'); };
      a.play().catch(()=>speakFallback(texto));
    } else if(!mutedRef.current){ speakFallback(texto); }
    if(data.isFinished) setCapTag('INTERVIEW FINISHED');
  };

const enviar=async(mensaje)=>{
    setStatus('🤖 consultando (n8n)…');
    try{
      const hist=historyRef.current;
      const r=await fetch(N8N_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({ message:mensaje, history:hist, userName:user?.name||'' })});
      const data=await r.json();
      historyRef.current=[...hist, {role:'user',content:mensaje}, {role:'assistant',content:data.interviewer||''}];
      reproducir(data);
    }catch(err){ setStatus('error de conexión con el entrevistador'); }
  };

  const pedirMic=async()=>{ if(micStreamRef.current) return true; try{ micStreamRef.current=await navigator.mediaDevices.getUserMedia({audio:true}); return true; }catch(e){ setStatus('micrófono denegado'); return false; } };

  const initRec=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR) return null;
    const rec=new SR(); rec.lang='en-US'; rec.interimResults=false; rec.maxAlternatives=1;
    rec.onstart=()=>{ setListening(true); modeRef.current='student'; setStatus('🎙️ escuchando…'); setCapTag('STUDENT SPEAKING'); };
    rec.onend=()=>{ setListening(false); if(modeRef.current==='student') modeRef.current='idle'; };
    rec.onresult=(e)=>{ const txt=e.results[0][0].transcript; setCapTxt('You: '+txt); enviar(txt); };
    rec.onerror=(e)=>setStatus('error mic: '+e.error);
    return rec;
  };

const onMic=async()=>{
    if(!recRef.current){ recRef.current=initRec(); if(!recRef.current){ alert('Usa Google Chrome para el reconocimiento de voz.'); return; } }
    if(listening){ try{recRef.current.stop();}catch(e){} return; }
    try { recRef.current.start(); }
    catch(e){ try{ recRef.current.stop(); }catch(_){}; setTimeout(()=>{ try{recRef.current.start();}catch(_){};},250); }
  };
  const onStart=async()=>{
    setStarted(true);
    historyRef.current=[];
    await pedirMic();
    setStatus('🤖 preparando la práctica…');
    const persName=(persona&&persona.nombre)||'AI Teacher';
    enviar("START_INTERVIEW: Your name is "+persName+" and you are the interviewer for this session. Act as a friendly job recruiter named "+persName+" helping a student practise a real job interview in English. First, warmly greet the student and introduce yourself by name ("+persName+"), then briefly explain how this practice will work (you ask interview questions, they answer out loud in English). After that, the FIRST thing you must ask is which job or position the student wants to be interviewed for today, for example: 'Before we begin, what position are you applying for?'. Do NOT ask any other interview question until the student tells you the role. Once they answer, run a realistic interview fully tailored to that role. Stay in character as "+persName+" the whole interview.");
  };

  const toggleMute=()=>{ const m=!mutedRef.current; mutedRef.current=m; setMuted(m); if(m){ try{window.speechSynthesis.cancel();}catch(e){} audioRef.current&&audioRef.current.pause(); } };
  const detener=()=>{ try{window.speechSynthesis.cancel();}catch(e){} audioRef.current&&audioRef.current.pause(); modeRef.current='idle'; setStatus('listo'); setCapTxt('Entrevista detenida. Pulsa 🎤 para seguir.'); };

  const round={width:46,height:46,borderRadius:'50%',background:'#141b26',color:'#8b9bb0',fontSize:'1.05rem',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'};

  return (
    <div style={{background:'#0a0d14',minHeight:'100vh',color:'#e8edf5',fontFamily:"'Poppins',sans-serif",display:'flex',flexDirection:'column'}}>
      <div style={{height:54,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 1.2rem',borderBottom:'1px solid rgba(99,102,241,.15)'}}>
        <span style={{fontWeight:800,color:'#cdd8e6'}}>💼 Entrevista · {(persona&&persona.nombre)||'C2'}</span>
        <button onClick={onBack} style={{background:'transparent',border:'1px solid rgba(99,102,241,.3)',color:'#a5b4fc',padding:'6px 14px',borderRadius:8,cursor:'pointer',fontSize:'.8rem',fontWeight:600}}>← Volver</button>
      </div>

      <div style={{flex:1,display:'flex',flexDirection:'column',maxWidth:960,width:'100%',margin:'0 auto',padding:'12px 16px'}}>
        <div style={{position:'relative',height:'clamp(240px,40vh,420px)',borderRadius:20,overflow:'hidden',border:'1px solid #1a2230',background:'radial-gradient(120% 90% at 50% 40%,#11161f,#0a0d14 80%)'}}>
          <div style={{position:'absolute',top:14,left:0,right:0,display:'flex',flexDirection:'column',alignItems:'center',gap:6,zIndex:2}}>
            {persona&&persona.emoji && (
              <div style={{width:54,height:54,borderRadius:'50%',background:persona.grad||'linear-gradient(135deg,#3b82f6,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.7rem',boxShadow:`0 0 22px rgba(${persona.accent||'99,102,241'},.55)`,border:'2px solid rgba(255,255,255,.15)'}}>{persona.emoji}</div>
            )}
            <div style={{fontSize:'clamp(.9rem,2.2vw,1.15rem)',fontWeight:700,letterSpacing:'.04em',color:'#cdd8e6',textShadow:'0 2px 12px #000'}}>{(persona&&persona.titulo)||'AI TEACHER (GEMINI)'}</div>
          </div>
          <span style={{position:'absolute',top:14,right:16,fontSize:'.66rem',color:'#5b6b7e',zIndex:2}}>{status}</span>
          <canvas ref={cvRef} style={{position:'relative',display:'block',width:'100%',height:'100%'}}/>
          {!started && (
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:5,padding:16}}>
              <button onClick={onStart} style={{padding:'15px 30px',borderRadius:14,background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',color:'#fff',fontWeight:800,fontSize:'1rem',border:'none',cursor:'pointer',boxShadow:'0 10px 30px rgba(59,130,246,.45)',fontFamily:"'Poppins',sans-serif"}}>▶ Comenzar entrevista</button>
            </div>
          )}
        </div>

        <div style={{textAlign:'center',padding:'14px 8px 18px'}}>
          <div style={{fontSize:'.66rem',letterSpacing:'.2em',color:'#5b6b7e',fontWeight:600}}>{capTag}</div>
          <div style={{fontSize:'clamp(1rem,2.6vw,1.3rem)',margin:'7px auto 14px',color:'#eef3f9',minHeight:30,fontWeight:500,maxWidth:760,lineHeight:1.4}}>{capTxt}</div>
          <div style={{height:1,background:'#1a2230',margin:'4px auto 12px',maxWidth:'60%'}}/>
          <div style={{fontSize:'.66rem',letterSpacing:'.2em',color:'#5b6b7e',fontWeight:600}}>FEEDBACK</div>
          <div style={{fontSize:'clamp(.85rem,2.2vw,1.05rem)',margin:'7px auto 0',color:'#c4d0de',minHeight:24,maxWidth:760}}>
            {!fb && <span style={{color:'#6b7a8c'}}>Tu retroalimentación aparecerá aquí.</span>}
            {fb && fb.tipo==='obj' && (<span>Original: <span style={{color:'#9aa7b6'}}>"{fb.original}"</span> Corrected: <span style={{color:'#eef3f9',fontWeight:600}}>"{fb.corrected}"</span> <span style={{color:'#6b7a8c'}}>({fb.note})</span></span>)}
            {fb && fb.tipo==='txt' && <span style={{color:'#eef3f9',fontWeight:600}}>{fb.texto}</span>}
          </div>

          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:20,marginTop:18}}>
            <button onClick={toggleMute} title="Silenciar" style={round}>{muted?'🔇':'🔊'}</button>
            <button onClick={onMic} title="Hablar" style={{width:58,height:58,borderRadius:'50%',background:'#0e1622',border:'2px solid '+(listening?'#f43f5e':'#2563eb'),color:listening?'#fda4af':'#60a5fa',fontSize:'1.3rem',cursor:'pointer',boxShadow:'0 0 20px rgba(37,99,235,.5)'}}>🎤</button>
            <button onClick={detener} title="Detener" style={round}>⏹️</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AvatarIframe({ src, titulo, onBack }) {
  return (
    <div style={{background:'#05080f',minHeight:'100vh',display:'flex',flexDirection:'column'}}>
      <div style={{height:54,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 1.2rem',borderBottom:'1px solid rgba(99,102,241,.15)',background:'#0a0d14',zIndex:5}}>
        <span style={{fontWeight:800,color:'#cdd8e6',fontFamily:"'Poppins',sans-serif"}}>💼 Entrevista · {titulo}</span>
        <button onClick={onBack} style={{background:'transparent',border:'1px solid rgba(99,102,241,.3)',color:'#a5b4fc',padding:'6px 14px',borderRadius:8,cursor:'pointer',fontSize:'.8rem',fontWeight:600,fontFamily:"'Poppins',sans-serif"}}>← Volver</button>
      </div>
      <iframe src={src} title={titulo} allow="microphone; autoplay" style={{flex:1,width:'100%',border:'none',display:'block'}}/>
    </div>
  );
}

// ── Placement Test ────────────────────────────────────────────────────────────

const NIVEL_INFO = {
  A1: { label:'A1 — Principiante',   color:'#10b981', emoji:'🌱', desc:'Conoces saludos básicos y palabras del día a día.' },
  A2: { label:'A2 — Elemental',      color:'#06b6d4', emoji:'🌿', desc:'Puedes comunicarte en situaciones simples y cotidianas.' },
  B1: { label:'B1 — Intermedio',     color:'#6366f1', emoji:'⚡', desc:'Entiendes textos cotidianos y puedes describir experiencias.' },
  B2: { label:'B2 — Intermedio alto',color:'#8b5cf6', emoji:'🔥', desc:'Te comunicas con fluidez y entiendes temas complejos.' },
  C1: { label:'C1 — Avanzado',       color:'#d946ef', emoji:'💎', desc:'Dominas el inglés con espontaneidad y precisión.' },
  C2: { label:'C2 — Maestría',       color:'#f59e0b', emoji:'👑', desc:'Comprensión y expresión a nivel nativo.' },
};

const API_BASE = import.meta.env.VITE_API_URL || 'https://nexlum-aulaquest.onrender.com';
const NIVEL_ORDER_PT = ['A1','A2','B1','B2','C1','C2'];
const PASS_RATIO_PT  = 0.75; // 75% para avanzar (ej. 6 de 8)
const passNeeded = total => Math.ceil((total || 0) * PASS_RATIO_PT);

function wordSim(a, b) {
  const wa = new Set(a.split(' ').filter(w => w.length > 1));
  const wb = new Set(b.split(' ').filter(w => w.length > 1));
  if (!wa.size || !wb.size) return 0;
  return [...wa].filter(w => wb.has(w)).length / Math.max(wa.size, wb.size);
}

function PlacementTestScreen({ token, userName, alexSpeak, onFinish, onBack }) {
  // Test de DIAGNÓSTICO lineal: una sola pasada de preguntas (fácil → difícil).
  const [preguntas,   setPreguntas]   = useState([]);
  const [phase,       setPhase]       = useState('loading'); // loading|intro|question|submitting|error
  const [idx,         setIdx]         = useState(0);
  const [seleccion,   setSeleccion]   = useState(null);
  const [feedback,    setFeedback]    = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [pronResult,  setPronResult]  = useState(null);
  const [errorMsg,    setErrorMsg]    = useState('');
  const [doneUser,    setDoneUser]    = useState(null);  // user listo tras enviar; pantalla "Empecemos a aprender"
  const answersRef = useRef([]);

  // Cargar el test de diagnóstico (lista ordenada por dificultad)
  useEffect(() => {
    fetch(API_BASE + '/api/placement-test', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(d => {
        if (!d.preguntas) { setErrorMsg(d.msg || 'Error al cargar el test.'); setPhase('error'); return; }
        setPreguntas(d.preguntas);
        // Retomar si el alumno salió a mitad del test (botón Volver)
        try {
          const saved = JSON.parse(localStorage.getItem('_placementProgress') || 'null');
          if (saved && Array.isArray(saved.answers) && saved.idx > 0 && saved.idx < d.preguntas.length) {
            answersRef.current = saved.answers;
            setIdx(saved.idx);
            setPhase('question');   // retoma justo donde quedó
            return;
          }
        } catch {}
        setPhase('intro');
      })
      .catch(() => { setErrorMsg('No se pudo conectar al servidor.'); setPhase('error'); });
  }, [token]);

  // Salir al aula guardando el punto donde quedó
  function handleBack() {
    try { localStorage.setItem('_placementProgress', JSON.stringify({ idx, answers: answersRef.current })); } catch {}
    onBack();
  }

  // Auto-speak para listening y pronunciación al cargar la pregunta
  useEffect(() => {
    if (phase !== 'question' || !preguntas[idx]) return;
    const q = preguntas[idx];
    if ((q.tipo === 'listening' || q.tipo === 'pronunciation') && q.audio) {
      const t = setTimeout(() => alexSpeak(q.audio, 0.62), 500); // lento y claro
      return () => clearTimeout(t);
    }
  }, [phase, idx, preguntas]);

  function handleMCAnswer(i) {
    if (seleccion !== null) return;
    const q = preguntas[idx];
    const correcto = i === q.ans;
    setSeleccion(i);
    setFeedback(correcto ? 'correct' : 'wrong');
    answersRef.current = [...answersRef.current, { id: q._id, ans: i }];
    setTimeout(() => { setSeleccion(null); setFeedback(null); advance(); }, 850);
  }

  function startPronunciation(q) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { resolvePron(false, q); return; }
    // Silenciar a Mr. Alex para que no hable encima del usuario y el micrófono lo escuche bien
    window._alexListening = true;
    if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
    window.speechSynthesis && window.speechSynthesis.cancel();

    const rec = new SR();
    rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 5;
    let silenceTimer = null, resolved = false;
    const done = (ok) => {
      if (resolved) return; resolved = true;
      if (silenceTimer) clearTimeout(silenceTimer);
      window._alexListening = false;   // Mr. Alex puede volver a hablar
      setIsListening(false);
      resolvePron(ok, q);
    };
    setIsListening(true);
    rec.onstart = () => {
      window._alexListening = true;
      if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
      window.speechSynthesis && window.speechSynthesis.cancel();
      silenceTimer = setTimeout(() => { try { rec.stop(); } catch(e){} }, 8000); // hasta 8s para hablar
    };
    rec.onresult = e => {
      const spokenList = Array.from(e.results[0]).map(r => r.transcript.toLowerCase().trim().replace(/[^a-z\s]/g,''));
      const target = (q.target || '').toLowerCase().trim().replace(/[^a-z\s]/g,'');
      const ok = spokenList.some(s => s.includes(target) || target.includes(s) || wordSim(s, target) >= 0.55);
      done(ok);
    };
    rec.onerror = () => done(false);
    rec.onend   = () => done(false); // red de seguridad (idempotente): si no hubo voz, continúa
    rec.start();
  }

  function resolvePron(ok, q) {
    setPronResult(ok ? 'correct' : 'wrong');
    answersRef.current = [...answersRef.current, { id: q._id, ans: ok ? 1 : 0 }];
    setTimeout(() => { setPronResult(null); advance(); }, 1200);
  }

  function advance() {
    const next = idx + 1;
    if (next < preguntas.length) { setIdx(next); return; }
    submitTest(answersRef.current); // terminó el diagnóstico
  }

  async function submitTest(answers) {
    setPhase('submitting');
    try {
      const r = await fetch(API_BASE + '/api/placement-test/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ respuestas: answers }),
      });
      const d = await r.json();
      if (!r.ok) { setErrorMsg(d.msg); setPhase('error'); return; }
      try { localStorage.removeItem('_placementProgress'); } catch {} // ya completó: limpiar el guardado
      setDoneUser(d.user);     // sin mostrar el nivel: solo "Empecemos a aprender"
      setPhase('done');
    } catch { setErrorMsg('Error de conexión.'); setPhase('error'); }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const C = '#8b5cf6'; // color de marca del diagnóstico

  if (phase === 'loading') return (
    <div style={{background:'#06080f',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Poppins',sans-serif"}}>
      <div style={{textAlign:'center',color:'#64748b'}}><div style={{fontSize:'2.5rem',marginBottom:12}}>⚙️</div><p>Preparando tu diagnóstico…</p></div>
    </div>
  );
  if (phase === 'error') return (
    <div style={{background:'#06080f',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Poppins',sans-serif"}}>
      <div style={{textAlign:'center',color:'#f87171',maxWidth:380,padding:32}}><div style={{fontSize:'2.5rem',marginBottom:12}}>⚠️</div><p>{errorMsg}</p></div>
    </div>
  );
  if (phase === 'submitting') return (
    <div style={{background:'#06080f',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Poppins',sans-serif"}}>
      <div style={{textAlign:'center',color:'#94a3b8'}}><div style={{fontSize:'2.5rem',marginBottom:12}}>🧠</div><p style={{fontWeight:600}}>Analizando tu diagnóstico…</p></div>
    </div>
  );

  // Fin del test: sin mostrar nivel, solo "Empecemos a aprender" → Aula 1
  if (phase === 'done') {
    const C = '#8b5cf6';
    return (
      <div style={{background:'#06080f',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Poppins',sans-serif",padding:24}}>
        <div style={{width:'100%',maxWidth:460,textAlign:'center'}}>
          <div style={{fontSize:'3.6rem',marginBottom:6,lineHeight:1}}>🎉</div>
          <div style={{background:'#0d1117',borderRadius:24,padding:'38px 30px',border:`1px solid ${C}33`,boxShadow:`0 0 50px ${C}10`}}>
            <h2 style={{color:C,margin:'0 0 10px',fontSize:'1.5rem',fontWeight:900}}>¡Terminaste tu diagnóstico, {userName}!</h2>
            <p style={{color:'#94a3b8',fontSize:14,lineHeight:1.6,margin:'0 0 26px'}}>
              ¡Buen trabajo! Vas a empezar desde el <strong style={{color:'#cbd5e1'}}>Aula 1</strong> para construir bases sólidas, paso a paso. 💪
            </p>
            <button onClick={() => onFinish(doneUser)}
              style={{width:'100%',padding:'15px 0',background:`linear-gradient(135deg,${C},#6366f1)`,color:'#fff',border:'none',borderRadius:12,fontWeight:800,fontSize:16,cursor:'pointer',fontFamily:"'Poppins',sans-serif",boxShadow:`0 4px 20px ${C}40`,transition:'transform .15s'}}
              onMouseEnter={e=>e.currentTarget.style.transform='scale(1.02)'}
              onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
              Empecemos a aprender 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Intro del diagnóstico
  if (phase === 'intro') {
    return (
      <div style={{background:'#06080f',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Poppins',sans-serif",padding:24}}>
        <div style={{width:'100%',maxWidth:500,textAlign:'center'}}>
          <div style={{background:'#0d1117',borderRadius:24,padding:'40px 30px',border:`1px solid ${C}33`,boxShadow:`0 0 50px ${C}0d`}}>
            <div style={{fontSize:'3.2rem',marginBottom:8}}>🎓</div>
            <h2 style={{color:C,margin:'0 0 10px',fontSize:'1.4rem',fontWeight:900}}>¡Hola, {userName}!</h2>
            <p style={{color:'#94a3b8',fontSize:13.5,marginBottom:8,lineHeight:1.6}}>
              Este es tu <strong style={{color:'#cbd5e1'}}>test de diagnóstico</strong> de inglés. Vamos a medir cómo estás en:
            </p>
            <p style={{color:'#64748b',fontSize:12.5,marginBottom:14,lineHeight:1.9}}>
              🖼️ Imágenes · 📖 Vocabulario · 📝 Gramática<br/>🎧 Listening · 🎤 Pronunciación con Mr. Alex
            </p>
            <div style={{background:`${C}10`,border:`1px solid ${C}28`,borderRadius:12,padding:'12px 16px',marginBottom:18}}>
              <p style={{color:'#94a3b8',fontSize:12,margin:0,lineHeight:1.6}}>
                Son <strong style={{color:C}}>{preguntas.length} preguntas</strong>, de lo más fácil a lo más difícil. Responde con sinceridad — al terminar verás tu diagnóstico y empezarás en el <strong style={{color:C}}>Aula 1</strong>. 🚀
              </p>
            </div>
            <button onClick={() => setPhase('question')}
              style={{width:'100%',padding:'14px 0',background:`linear-gradient(135deg,${C},#6366f1)`,color:'#fff',border:'none',borderRadius:12,fontWeight:800,fontSize:15,cursor:'pointer',fontFamily:"'Poppins',sans-serif",boxShadow:`0 4px 20px ${C}33`}}>
              Comenzar diagnóstico 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pregunta activa
  if (phase === 'question') {
    const q = preguntas[idx];
    if (!q) return null;
    const progPct = (idx / preguntas.length) * 100;
    const TIPO_LABEL = { vocab:'Vocabulario', grammar:'Gramática', listening:'Escucha a Mr. Alex 🎧', fill:'Completa', pronunciation:'Pronunciación con Mr. Alex 🎤', image:'¿Qué ves? 🖼️' };
    return (
      <div style={{background:'#06080f',minHeight:'100vh',fontFamily:"'Poppins',sans-serif",color:'#e2e8f0',display:'flex',flexDirection:'column',alignItems:'center',padding:'24px 18px'}}>
        {/* Header */}
        <div style={{width:'100%',maxWidth:560,marginBottom:18}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,gap:10}}>
            <button onClick={handleBack} title="Volver al aula (guarda tu avance)"
              style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.12)',borderRadius:8,padding:'5px 12px',color:'#94a3b8',fontFamily:"'Poppins',sans-serif",fontSize:11.5,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',transition:'background .2s'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.1)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.05)'}>
              ← Volver al aula
            </button>
            <span style={{color:C,fontWeight:700,fontSize:12,flex:1,textAlign:'center'}}>🎓 Diagnóstico</span>
            <span style={{color:'#334155',fontSize:11,whiteSpace:'nowrap'}}>{idx+1} / {preguntas.length}</span>
          </div>
          <div style={{height:5,background:'rgba(255,255,255,.05)',borderRadius:99,overflow:'hidden'}}>
            <div style={{height:'100%',width:progPct+'%',background:`linear-gradient(90deg,${C},#6366f1)`,borderRadius:99,transition:'width .4s'}}/>
          </div>
        </div>

        {/* Tarjeta */}
        <div style={{width:'100%',maxWidth:560,background:'#0d1117',borderRadius:20,padding:'26px 22px',border:`1px solid ${C}18`,boxShadow:'0 8px 40px rgba(0,0,0,.55)'}}>
          {/* Badge de tipo */}
          <span style={{display:'inline-block',background:`${C}15`,color:C,fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:99,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:14}}>
            {TIPO_LABEL[q.tipo] || q.tipo}
          </span>

          {/* Imagen alusiva (emoji grande) */}
          {q.img && (
            <div style={{display:'flex',justifyContent:'center',marginBottom:16}}>
              <div style={{width:120,height:120,borderRadius:24,background:`${C}0d`,border:`1px solid ${C}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'4.2rem',lineHeight:1,boxShadow:`inset 0 0 30px ${C}0a`}}>
                {q.img}
              </div>
            </div>
          )}

          {/* Botones escuchar — normal y más despacio (listening y pronunciación) */}
          {(q.tipo === 'listening' || q.tipo === 'pronunciation') && q.audio && (
            <div style={{display:'flex',gap:8,marginBottom:14}}>
              <button onClick={() => alexSpeak(q.audio, 0.62)}
                style={{flex:2,display:'flex',alignItems:'center',gap:8,background:`${C}15`,border:`1px solid ${C}35`,borderRadius:12,padding:'10px 14px',cursor:'pointer',color:C,fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:13,justifyContent:'center',transition:'opacity .2s'}}
                onMouseEnter={e=>e.currentTarget.style.opacity='.8'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                🎧 {q.tipo === 'pronunciation' ? 'Escuchar frase' : 'Escuchar'}
              </button>
              <button onClick={() => alexSpeak(q.audio, 0.42)} title="Mr. Alex habla aún más despacio"
                style={{flex:1,display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',borderRadius:12,padding:'10px 12px',cursor:'pointer',color:'#94a3b8',fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:12.5,justifyContent:'center',transition:'opacity .2s'}}
                onMouseEnter={e=>e.currentTarget.style.opacity='.8'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                🐢 Despacio
              </button>
            </div>
          )}

          {/* Texto de la pregunta */}
          <p style={{fontSize:'1rem',fontWeight:600,color:'#e2e8f0',lineHeight:1.55,marginBottom:18}}>{q.q}</p>

          {/* Opciones múltiples (vocab, grammar, fill, listening, image) */}
          {q.tipo !== 'pronunciation' && (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {(q.opts||[]).map((opt, i) => {
                let bg='rgba(255,255,255,.03)', bdr=`1px solid ${C}10`, clr='#94a3b8';
                if (seleccion !== null) {
                  if (i === q.ans) { bg='rgba(16,185,129,.12)'; bdr='1px solid rgba(16,185,129,.4)'; clr='#34d399'; }
                  else if (i === seleccion) { bg='rgba(239,68,68,.1)'; bdr='1px solid rgba(239,68,68,.35)'; clr='#f87171'; }
                }
                return (
                  <button key={i} onClick={() => handleMCAnswer(i)} disabled={seleccion !== null}
                    style={{background:bg,border:bdr,borderRadius:11,padding:'11px 14px',textAlign:'left',color:clr,fontSize:13,fontFamily:"'Poppins',sans-serif",cursor:seleccion!==null?'default':'pointer',transition:'all .14s',fontWeight:500,display:'flex',alignItems:'center',gap:10}}
                    onMouseEnter={e=>{ if(!seleccion) e.currentTarget.style.background=`${C}0f`; }}
                    onMouseLeave={e=>{ if(!seleccion) e.currentTarget.style.background='rgba(255,255,255,.03)'; }}>
                    <span style={{width:21,height:21,borderRadius:99,background:`${C}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:C,flexShrink:0}}>
                      {String.fromCharCode(65+i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* Pronunciación */}
          {q.tipo === 'pronunciation' && !pronResult && (
            <div style={{textAlign:'center',paddingTop:4}}>
              <div style={{background:'rgba(99,102,241,.07)',border:'1px solid rgba(99,102,241,.15)',borderRadius:12,padding:'12px 18px',marginBottom:16}}>
                <span style={{color:'#818cf8',fontWeight:700,fontSize:'1rem',fontStyle:'italic'}}>"{q.audio}"</span>
              </div>
              <p style={{color:'#475569',fontSize:11.5,marginBottom:16}}>Mr. Alex dice la frase arriba. Escúchala y repítela con tu micrófono.</p>
              <button onClick={() => startPronunciation(q)} disabled={isListening}
                style={{display:'inline-flex',alignItems:'center',gap:10,padding:'13px 30px',background:isListening?'rgba(239,68,68,.18)':'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:14,cursor:isListening?'default':'pointer',color:'#fff',fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:14,boxShadow:'0 4px 18px rgba(99,102,241,.3)',transition:'transform .15s'}}
                onMouseEnter={e=>{ if(!isListening) e.currentTarget.style.transform='scale(1.03)'; }}
                onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
                <span style={{fontSize:'1.3rem'}}>{isListening ? '🔴' : '🎤'}</span>
                {isListening ? 'Escuchando…' : 'Hablar ahora'}
              </button>
            </div>
          )}

          {/* Resultado pronunciación */}
          {pronResult && (
            <div style={{textAlign:'center',padding:'12px 0',fontSize:15,fontWeight:700,color:pronResult==='correct'?'#34d399':'#f87171'}}>
              {pronResult==='correct' ? '✓ ¡Excelente pronunciación!' : '✗ Sigue practicando — continúa'}
            </div>
          )}

          {/* Feedback opción múltiple */}
          {feedback && (
            <div style={{marginTop:12,textAlign:'center',fontSize:14,fontWeight:700,color:feedback==='correct'?'#34d399':'#f87171'}}>
              {feedback==='correct' ? '✓ ¡Correcto!' : '✗ Incorrecto'}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// Panel de resultados del diagnóstico (modal que se abre desde el aula)
const DIAG_AREAS = [
  ['imagenes',     '🖼️', 'Imágenes'],
  ['vocabulario',  '📖', 'Vocabulario'],
  ['gramatica',    '📝', 'Gramática'],
  ['listening',    '🎧', 'Listening'],
  ['pronunciacion','🎤', 'Pronunciación'],
];

function DiagnosticoPanel({ diag, userName, onClose }) {
  if (!diag) return null;
  const info = { color: '#8b5cf6' }; // color fijo: no mostramos nivel
  const pct = (c, t) => (t > 0 ? Math.round((c / t) * 100) : 0);
  const colorPct = p => (p >= 70 ? '#34d399' : p >= 40 ? '#fbbf24' : '#f87171');
  const pctGlobal = pct(diag.puntaje, diag.total);

  const areas = DIAG_AREAS
    .map(([k, ic, label]) => { const a = (diag.areas && diag.areas[k]) || { c: 0, t: 0 }; return { k, ic, label, c: a.c, t: a.t, p: pct(a.c, a.t) }; })
    .filter(a => a.t > 0);
  const mejorar = areas.filter(a => a.p < 70).sort((a, b) => a.p - b.p).slice(0, 3);

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(2,4,10,.8)',backdropFilter:'blur(4px)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:18,fontFamily:"'Poppins',sans-serif",overflowY:'auto'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:480,background:'#0d1117',borderRadius:22,border:`1px solid ${info.color}33`,boxShadow:`0 0 60px ${info.color}1a,0 12px 50px rgba(0,0,0,.7)`,maxHeight:'92vh',overflowY:'auto'}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 22px 0'}}>
          <span style={{color:info.color,fontWeight:800,fontSize:'1rem'}}>🎓 Tu diagnóstico</span>
          <button onClick={onClose} style={{background:'rgba(255,255,255,.05)',border:'none',borderRadius:8,width:30,height:30,color:'#94a3b8',cursor:'pointer',fontSize:15}}>✕</button>
        </div>

        <div style={{padding:'10px 22px 22px',textAlign:'center'}}>
          <p style={{color:'#64748b',fontSize:13,margin:'4px 0 14px'}}>Hola <strong style={{color:'#94a3b8'}}>{userName}</strong>, así estuvo tu prueba:</p>

          {/* Nota global (sin etiqueta de nivel) */}
          <div style={{marginBottom:18}}>
            <div style={{background:'rgba(255,255,255,.03)',borderRadius:16,padding:'18px 10px',border:'1px solid rgba(255,255,255,.06)'}}>
              <div style={{fontSize:'2.1rem',fontWeight:900,color:colorPct(pctGlobal),lineHeight:1}}>{diag.puntaje}<span style={{fontSize:'1.1rem',color:'#475569'}}>/{diag.total}</span></div>
              <div style={{fontSize:11.5,color:'#64748b',marginTop:5}}>respuestas correctas ({pctGlobal}%)</div>
            </div>
          </div>

          {/* Barras por área */}
          <div style={{textAlign:'left',marginBottom:16}}>
            <div style={{fontSize:11,color:'#475569',fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:10}}>Tu desempeño por área</div>
            {areas.map(a => (
              <div key={a.k} style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                  <span style={{color:'#cbd5e1'}}>{a.ic} {a.label}</span>
                  <span style={{color:colorPct(a.p),fontWeight:700}}>{a.c}/{a.t} · {a.p}%</span>
                </div>
                <div style={{height:7,background:'rgba(255,255,255,.05)',borderRadius:99,overflow:'hidden'}}>
                  <div style={{height:'100%',width:a.p+'%',background:colorPct(a.p),borderRadius:99,transition:'width .5s'}}/>
                </div>
              </div>
            ))}
          </div>

          {/* Qué mejorar */}
          {mejorar.length > 0 && (
            <div style={{textAlign:'left',background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.2)',borderRadius:12,padding:'12px 14px',marginBottom:16}}>
              <div style={{color:'#fbbf24',fontWeight:700,fontSize:12,marginBottom:6}}>💡 Qué practicar primero</div>
              <div style={{color:'#94a3b8',fontSize:12,lineHeight:1.6}}>
                {mejorar.map(a => a.label).join(', ')}. ¡Son tus mayores oportunidades de crecer!
              </div>
            </div>
          )}

          {/* Nota: todos empiezan en Aula 1 */}
          <p style={{color:'#475569',fontSize:11.5,lineHeight:1.6,margin:'0 0 18px'}}>
            Empezarás en el <strong style={{color:'#94a3b8'}}>Aula 1 (A1)</strong> para construir bases sólidas. Este diagnóstico es tu punto de partida — ¡vuelve a verlo cuando quieras!
          </p>

          <button onClick={onClose}
            style={{width:'100%',padding:'13px 0',background:`linear-gradient(135deg,${info.color},#6366f1)`,color:'#fff',border:'none',borderRadius:12,fontWeight:800,fontSize:15,cursor:'pointer',fontFamily:"'Poppins',sans-serif",boxShadow:`0 4px 18px ${info.color}33`}}>
            ¡Entendido, a estudiar! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen,    setScreen]    = useState(localStorage.getItem('token') ? 'curso' : 'home');
  const [mode,      setMode]      = useState('login');
  const [token,     setToken]     = useState(localStorage.getItem('token') || ''); // sesion persistente; se cierra por inactividad
  const [user,      setUser]      = useState(null);
  const [form,      setForm]      = useState({name:'',email:'',password:'',englishLevel:'A1'});
  const [authErr,   setAuthErr]   = useState('');
  const [authMsg,   setAuthMsg]   = useState('');     // mensajes de exito/info
  const [authBusy,  setAuthBusy]  = useState(false);   // evitar doble submit
  const [resetToken,setResetToken]= useState(''); 
  const [resetPass, setResetPass] = useState('');    // token de recuperacion (de la URL)
  const [showPass, setShowPass] = useState(false);
  const [cloudOpen, setCloudOpen] = useState(false);
  const [orbState,  setOrbState]  = useState('idle');
  const [bubble,    setBubble]    = useState('¡Hola! 👋 Soy Mr. Alex, tu tutor de inglés. Selecciona un tema y empezamos!');
  const [bubbleType,setBubbleType]= useState('');
  const [word,      setWord]      = useState(null);
  const [ejemplo,   setEjemplo]   = useState(null);   // oración de ejemplo + explicación de uso
  const [listening, setListening] = useState(false);
  const [correct,   setCorrect]   = useState(0);
  const [total,     setTotal]     = useState(0);
  const [totalXP,   setTotalXP]   = useState(0);
  const [energy,    setEnergy]    = useState({ tokens: 25, max: 25, nextMs: 0, ilimitado: false }); // energía/tokens (crédito 25)
  const [fraseReto, setFraseReto] = useState(null);   // reto "completa la frase"
  const [temaEjemplos, setTemaEjemplos] = useState([]); // frases de ejemplo del tema abierto
  const [lvlUp,     setLvlUp]     = useState(false);
  const [showDiag,  setShowDiag]  = useState(false);   // panel de resultados del diagnóstico
  const [tema,      setTema]      = useState(null);
  const [screen2,   setScreen2]   = useState('');
  const [adminVistaNivel, setAdminVistaNivel] = useState(null); // admin: ver aula de cualquier nivel
  const [nivelMenu, setNivelMenu] = useState(false);
  const [userMenu2,  setUserMenu2]  = useState(false);   // menú de usuario en el aula
  const [showPerfil2,setShowPerfil2] = useState(false);   // modal de perfil (ver/editar)
  const [perfilForm, setPerfilForm] = useState({ name:'', email:'', currentPassword:'', newPassword:'' });
  const [perfilMsg,  setPerfilMsg]  = useState({ tipo:'', txt:'' });
  const [perfilSaving,setPerfilSaving] = useState(false);
  const inic = (n) => (n||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const NIVEL_NOMBRE = { A1:'Principiante', A2:'Elemental', B1:'Intermedio', B2:'Intermedio alto', C1:'Avanzado', C2:'Maestría' };
  const abrirPerfil = () => { setPerfilForm({ name:user?.name||'', email:user?.email||'', currentPassword:'', newPassword:'' }); setPerfilMsg({tipo:'',txt:''}); setShowPerfil2(true); setUserMenu2(false); };
  const guardarPerfil = async () => {
    setPerfilSaving(true); setPerfilMsg({tipo:'',txt:''});
    try {
      const body = { name: perfilForm.name, email: perfilForm.email };
      if (perfilForm.newPassword) { body.newPassword = perfilForm.newPassword; body.currentPassword = perfilForm.currentPassword; }
      const r = await fetch(API+'/api/practice/perfil', { method:'PUT', headers: authH(token), body: JSON.stringify(body) });
      const d = await r.json();
      if (r.ok && d.user) { setUser(d.user); setPerfilMsg({tipo:'ok',txt:'✅ Perfil actualizado'}); setPerfilForm(f=>({...f,currentPassword:'',newPassword:''})); }
      else setPerfilMsg({tipo:'err',txt:'❌ '+(d.msg||'No se pudo guardar')});
    } catch { setPerfilMsg({tipo:'err',txt:'❌ Error de conexión'}); }
    setPerfilSaving(false);
  };

  const esAdmin = user?.role === 'admin';
  // Entrevistas: se desbloquean al aprobar el examen C2 (o si el admin las habilita)
  const interviewLocked = !esAdmin && !(user?.interviewUnlocked) && !((user?.nivelesAprobados||[]).includes('C2'));
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);   // aviso de límite diario (versión gratuita)
  const [interviewReqState,  setInterviewReqState]  = useState(''); // ''|'sending'|'sent'|'error'
  const [showMaterial,       setShowMaterial]       = useState(false); // panel de material de apoyo (PDFs)
  const [practMenu,          setPractMenu]          = useState(false); // select ✨ Practicar (solo A1)
  const [repasoOpen,         setRepasoOpen]         = useState(false); // "Repaso de los temas aprendidos"
  const [todosOpen,          setTodosOpen]          = useState(false); // "Todos los temas" (todo lo aprendido)
  const nivel = (esAdmin && adminVistaNivel) ? adminVistaNivel : (user?.englishLevel || 'A1');
  const [TOPICS,      setTOPICS]      = useState([]);
  const [vw,          setVw]          = useState(typeof window!=='undefined'?window.innerWidth:1200); // ancho para el panal responsive
  const [vocabData,   setVocabData]   = useState({});
  const [progTemas,   setProgTemas]   = useState({});   // {temaId: {completadas:[], total, completo, desbloqueado}}
  const [todosComp,   setTodosComp]   = useState(false);
  const [quizHabil,   setQuizHabil]   = useState(false);
  const [trialInfo,   setTrialInfo]   = useState({ active: true, expired: false, daysLeft: null });
  const [dailyTopicId,setDailyTopicId]= useState('');
  const [isPremium,   setIsPremium]   = useState(false);

  const cargarProgreso = (restaurarTema=false) => {
    if (!token) return Promise.resolve();
    return fetch(API+'/api/practice/progreso', {headers:authH(token)})
      .then(r=>r.ok?r.json():Promise.reject())
      .then(d=>{
        if (d.temas) {
          const map = {};
          d.temas.forEach(t=>{ map[t.id] = t; });
          setProgTemas(map);
          setTodosComp(d.todosCompletos);
          setQuizHabil(d.quizHabilitado);
          if (d.trial)        setTrialInfo(d.trial);
          if (d.dailyTopicId !== undefined) setDailyTopicId(d.dailyTopicId || '');
          if (d.isPremium !== undefined)    setIsPremium(d.isPremium);
          if (restaurarTema && d.ultimoTema) {
            const temaRestaurado = d.temas.find(t => t.id === d.ultimoTema);
            if (temaRestaurado && temaRestaurado.desbloqueado) {
              setTema({ id: temaRestaurado.id, name: temaRestaurado.titulo, icon: temaRestaurado.icono });
              setBubble('👋 Bienvenido de vuelta! Continuamos con: ' + temaRestaurado.titulo);
            }
          }
        }
      }).catch(()=>{});
  };

  useEffect(()=>{ cargarProgreso(true); },[token, nivel]);

  // Al cargar: detectar enlaces de correo (?verify=... o ?reset=...)
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const vTok = params.get('verify');
    const rTok = params.get('reset');
    if (vTok) {
      fetch(API+'/api/auth/verify/'+encodeURIComponent(vTok))
        .then(r=>r.json().then(d=>({ok:r.ok,d})))
        .then(({ok,d})=>{
          setMode('login');
          setScreen('auth');
          if (ok) setAuthMsg(d.msg || 'Correo confirmado. Ya puedes iniciar sesion.');
          else    setAuthErr(d.msg || 'No se pudo confirmar el correo.');
        })
        .catch(()=>{ setScreen('auth'); setAuthErr('No se pudo conectar al servidor.'); });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (rTok) {
      setResetToken(rTok);
      setScreen('reset');
      window.history.replaceState({}, '', window.location.pathname);
    }
  },[]);

  useEffect(()=>{
    if (!token || !nivel) return;
    fetch(API+'/api/cursos/'+nivel, {headers:authH(token)})
      .then(r=>r.ok?r.json():Promise.reject())
      .then(d=>{
        if(d.temas) {
          setTOPICS(d.temas.map(t=>({id:t.id,icon:t.icono,name:t.titulo})));
          const map = {};
          d.temas.forEach(t=>{ map[t.id] = t.vocabulario; });
          setVocabData(map);
        }
      })
      .catch(()=>{});
  },[token,nivel]);

  useEffect(()=>{
    if (!token) { return; }
    window._alexToken = token;               // restaura el token para la voz de Mr. Alex tras recargar
    fetch(API+'/api/auth/user',{headers:authH(token)})
      .then(r=>r.ok?r.json():Promise.reject())
      .then(u=>{setUser(u);})
      .catch(()=>{localStorage.removeItem('token');setToken('');setScreen('auth');});
  },[token]);

const handleAuth = async(e) => {
    e.preventDefault(); setAuthErr(''); setAuthMsg('');
    const ep = mode==='login' ? '/api/auth/login' : '/api/auth/register';

    // Validacion en el cliente antes de enviar
    const email = (form.email||'').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setAuthErr('Ingresa un correo valido.'); return; }
    if (mode==='register') {
      if ((form.name||'').trim().length < 2) { setAuthErr('Ingresa tu nombre.'); return; }
      const p = form.password||'';
      if (p.length<8 || !/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/[0-9]/.test(p)) {
        setAuthErr('La contraseña debe tener minimo 8 caracteres, con mayuscula, minuscula y numero.'); return;
      }
    } else if (!form.password) { setAuthErr('Ingresa tu contraseña.'); return; }

    const body = mode==='login'
      ? { email: email, password: form.password }
      : { name: form.name.trim(), email: email, password: form.password };

    setAuthBusy(true);
    try {
      const r = await fetch(API+ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();

      if (!r.ok) {
        setAuthErr(d.msg || d.error || 'Error de autenticación');
        setAuthBusy(false);
        return;
      }

      // Registro que exige verificacion: no hay token todavia
      if (d.needVerify || !d.token) {
        setMode('login');
        setAuthMsg(d.msg || 'Cuenta creada. Revisa tu correo para confirmar.');
        setForm({...form, password:''});
        setAuthBusy(false);
        return;
      }

      localStorage.setItem('token', d.token);
      window._alexToken = d.token;           // habilita la voz real de Mr. Alex (ElevenLabs)
      setToken(d.token); setUser(d.user);
      // Nuevo registro: ir al placement test. Login: ir directo al aula.
      if (mode === 'register' && !d.user?.levelAssigned) {
        setScreen('placement');
      } else {
        setScreen('curso');
      }
    } catch {
      setAuthErr('No se pudo conectar al servidor.');
    }
    setAuthBusy(false);
  };

  // Olvide mi contraseña
  const handleForgot = async() => {
    setAuthErr(''); setAuthMsg('');
    const email = (form.email||'').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setAuthErr('Ingresa el correo de tu cuenta.'); return; }
    setAuthBusy(true);
    try {
      const r = await fetch(API+'/api/auth/forgot-password', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) });
      const d = await r.json();
      setAuthMsg(d.msg || 'Si el correo existe, te enviamos instrucciones.');
    } catch { setAuthErr('No se pudo conectar al servidor.'); }
    setAuthBusy(false);
  };

  // Restablecer contraseña (con token de la URL)
  const handleReset = async() => {
    setAuthErr(''); setAuthMsg('');
    const p = resetPass||'';
    if (p.length<8 || !/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/[0-9]/.test(p)) {
      setAuthErr('La contraseña debe tener minimo 8 caracteres, con mayuscula, minuscula y numero.'); return;
    }
    setAuthBusy(true);
    try {
      const r = await fetch(API+'/api/auth/reset-password', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token: resetToken, password: p }) });
      const d = await r.json();
      if (!r.ok) { setAuthErr(d.msg || 'No se pudo actualizar.'); setAuthBusy(false); return; }
      setMode('login'); setScreen('auth'); setResetPass(''); setResetToken('');
      setAuthMsg(d.msg || 'Contraseña actualizada. Ya puedes iniciar sesion.');
    } catch { setAuthErr('No se pudo conectar al servidor.'); }
    setAuthBusy(false);
  };

  const logout = () => {
    stopAlex();                 // detener la voz de Mr. Alex al salir
    localStorage.removeItem('token'); window._alexToken = ''; setToken(''); setUser(null);
    setWord(null); setCloudOpen(false); setScreen('home'); setAdminVistaNivel(null);
  };

  // Cierre de sesion automatico tras 1 minuto sin actividad
  // Ancho de ventana para que el panal de temas escale en tablet y móvil
  useEffect(()=>{
    const onR = () => setVw(window.innerWidth);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  // Frases de ejemplo del tema abierto (cómo usar lo aprendido) — desde la BD
  useEffect(()=>{
    if (!tema) { setTemaEjemplos([]); return; }
    const words = (vocabData[tema.id] || []).map(w => w.en);
    if (!words.length || !token) { setTemaEjemplos([]); return; }
    let vivo = true;
    fetch(API+'/api/practice/ejemplos', { method:'POST', headers: authH(token), body: JSON.stringify({ words }) })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (vivo) setTemaEjemplos(d && d.ejemplos ? d.ejemplos : []); })
      .catch(() => { if (vivo) setTemaEjemplos([]); });
    return () => { vivo = false; };
  }, [tema, vocabData, token]);

  useEffect(()=>{
    if (!token) return;
    let timer;
    const INACTIVIDAD_MS = 60 * 60 * 1000; // 1 hora
    const reiniciar = () => {
      clearTimeout(timer);
      timer = setTimeout(()=>{ logout(); }, INACTIVIDAD_MS);
    };
    const eventos = ['mousemove','mousedown','keydown','touchstart','scroll','click'];
    eventos.forEach(ev => window.addEventListener(ev, reiniciar));
    reiniciar(); // arrancar el conteo
    return ()=>{
      clearTimeout(timer);
      eventos.forEach(ev => window.removeEventListener(ev, reiniciar));
    };
  },[token]);

  // Mensajes de Alex por situación
  const ALEX_BIENVENIDA = [
    "Hola! Soy Mr. Alex, tu tutor de ingles. Selecciona un tema y presiona Nueva Palabra para empezar. Yo te ayudo paso a paso.",
    "Bienvenido al aula! Estoy aqui para enseñarte ingles de forma divertida. Elige un tema y comenzamos juntos.",
    "Listo para aprender? Yo te explico cada palabra, su significado en español, y te escucho pronunciar. Vamos!",
  ];
  const ALEX_TEMA = [
    (t) => "Excelente eleccion! Vamos a practicar el tema: " + t + ". Te dire la palabra, su significado en español, y luego tu la dices. Presiona Nueva Palabra!",
    (t) => "Perfecto! El tema " + t + " tiene vocabulario muy util. Yo te explico todo. Presiona Nueva Palabra cuando estes listo.",
    (t) => "Muy bien! Con el tema " + t + " vas a aprender palabras que usas en el dia a dia. Yo te guio. Empecemos!",
  ];
  const ALEX_OK = [
    (w) => "Perfecto! " + w + " es correcto! Eres un crack. Siguiente palabra?",
    (w) => "Excelente pronunciacion de " + w + "! Sigue asi, vas muy bien!",
    (w) => "Muy bien! " + w + " — lo dijiste perfectamente. Orgullo de tutor!",
    (w) => "Eso es! " + w + " suena increible. Cada palabra que aprendes te acerca mas al siguiente nivel!",
    (w) => "Genial! " + w + " dominado. Recuerda: en ingles se dice " + w + ". Siguiente!",
  ];
  const ALEX_ERROR = [
    (w, es) => "Casi! La palabra es " + w + ", que en español significa " + es + ". Escuchame bien y repite despues de mi.",
    (w, es) => "No te preocupes! Todos cometemos errores. La palabra correcta es " + w + " — en español: " + es + ". Vamos de nuevo!",
    (w, es) => "Tranquilo! El ingles se aprende con practica. La palabra es " + w + ", significa " + es + ". Intentalo una vez mas.",
    (w, es) => "Sigue intentando! Pronuncia despues de mi: " + w + ". En español es: " + es + ". Tu puedes!",
  ];
  const ALEX_SILENCIO = [
    "No te escuche. Habla mas fuerte y presiona el microfono de nuevo. Yo estoy aqui esperandote!",
    "Hmm, no capto tu voz. Asegurate de hablar claro y cerca del microfono. Intentemos de nuevo!",
    "Parece que el microfono no te escucho. Habla un poco mas fuerte. No tengas miedo, yo te apoyo!",
  ];
  const rand = (arr) => arr[Math.floor(Math.random()*arr.length)];
  const randFn = (arr, ...args) => arr[Math.floor(Math.random()*arr.length)](...args);

  const openCloud = (temaObj) => {
    if (temaObj) setTema(temaObj);
    setCloudOpen(true);
    // Pedir el audio YA (sin esperar 400ms). El orbe muestra "procesando…"
    // mientras carga y pasa a "hablando…" solo cuando el sonido arranca de verdad.
    const msg = temaObj ? randFn(ALEX_TEMA, temaObj.name) : rand(ALEX_BIENVENIDA);
    setOrbState('thinking');
    setBubble(temaObj ? ('🎯 Tema: ' + temaObj.name + ' — ' + msg) : ('👋 ' + msg));
    setBubbleType('');
    alexSpeak(temaObj ? temaObj.name : 'Let us begin', 0.85,
      ()=>setOrbState('idle'), null, ()=>setOrbState('speaking'));
    // Precargar la primera palabra pendiente para que la práctica arranque al instante
    if (temaObj) {
      const done = (progTemas[temaObj.id]?.palabrasCompletadas) || [];
      const first = (vocabData[temaObj.id] || []).find(w => !done.includes(w.en));
      prefetchWord(first, window._alexToken || token);
    }
    // Precargar los mensajes de corrección (para que la corrección sea inmediata)
    ALEX_CORRECCION.forEach(t => ttsBlob(t, 'es', window._alexToken || token));
    cargarEnergia();
  };

  const closeCloud = () => {
    stopAlex();                 // detener la voz de Mr. Alex al cerrar el panel
    window._alexListening = false;
    setCloudOpen(false); setOrbState('idle'); setWord(null); setFraseReto(null); setEjemplo(null);
    // Guardar posición al salir
    if (tema) fetch(API+'/api/practice/ultimo-tema',{method:'POST',headers:authH(token),body:JSON.stringify({temaId:tema.id})}).catch(()=>{});
  };

  // Solicitar a soporte el desbloqueo de las entrevistas
  const solicitarEntrevista = async () => {
    setInterviewReqState('sending');
    try {
      const r = await fetch(API+'/api/interview/request-access', { method:'POST', headers:authH(token) });
      setInterviewReqState(r.ok ? 'sent' : 'error');
    } catch { setInterviewReqState('error'); }
  };

  // ── Energía / tokens ──
  const cargarEnergia = async () => {
    try { const r = await fetch(API+'/api/practice/energy',{headers:authH(token)}); if(r.ok) setEnergy(await r.json()); } catch {}
  };
  const gastarToken = async () => {
    try { const r = await fetch(API+'/api/practice/energy/spend',{method:'POST',headers:authH(token)}); const e = await r.json(); setEnergy(e); return e.ilimitado || e.ok; } catch { return true; }
  };
  const sinEnergia = () => !energy.ilimitado && energy.tokens <= 0;

  const usedWordsRef = useRef([]); // useRef evita problemas de closure stale
  const getWord = () => {
    const allWords = tema && vocabData[tema.id] ? vocabData[tema.id] : (Object.values(vocabData)[0] || []);
    if (!allWords.length) return;
    // Deduplicar el vocabulario del tema por si acaso
    const seen = new Set();
    const uniqueWords = allWords.filter(w => {
      if (seen.has(w.en)) return false;
      seen.add(w.en); return true;
    });
    // Priorizar palabras NO completadas aún en MongoDB
    const completadas = (progTemas[tema?.id]?.palabrasCompletadas) || [];
    const pendientes = uniqueWords.filter(w => !completadas.includes(w.en));
    // Si ya completó TODAS, sigue pudiendo practicar (repaso con todas las palabras del tema)
    const base = pendientes.length > 0 ? pendientes : uniqueWords;
    // Evitar repetir en sesión usando ref (siempre actualizado)
    const sinUsar = base.filter(w => !usedWordsRef.current.includes(w.en));
    if (sinUsar.length === 0) usedWordsRef.current = [];
    const pool = sinUsar.length > 0 ? sinUsar : base;
    const w = pool[0];
    usedWordsRef.current = [...usedWordsRef.current, w.en];
    setWord(w);
    setEjemplo(null);
    const tok = window._alexToken || token;
    prefetchWord(w, tok);                                                        // incluye versión lenta (para correcciones)
    prefetchWord(pool[1] || pendientes.find(x => x.en !== w.en), tok);           // adelantar la siguiente
    // Oración de ejemplo + explicación de uso (cacheada en el backend)
    const pEj = fetch(API+'/api/practice/ejemplo', { method:'POST', headers: authH(tok), body: JSON.stringify({ en: w.en, es: w.es }) })
      .then(r => r.ok ? r.json() : null).catch(() => null);
    pEj.then(ej => { if (ej && ej.frase) { setEjemplo(ej); ttsBlob(ej.frase, 'en', tok); if (ej.explicacion) ttsBlob(ej.explicacion, 'es', tok); } });
    setBubble('📖 ' + w.en + ' = ' + w.es + ' — Escucha y repite!'); setBubbleType('');
    setOrbState('thinking');
    // Palabra (EN→ES→EN) y luego Mr. Alex la enseña EN CONTEXTO: oración real + cómo se usa
    alexSpeakBilingual(w.en, w.es, tok, async ()=>{
      const ej = await pEj.catch(() => null);
      const alListening = () => { setOrbState('listening'); setBubble('🎤 Di: ' + w.en + ' (' + w.es + ')'); };
      if (ej && ej.frase) {
        setBubble('🗣️ ' + ej.frase + ' — ' + (ej.fraseEs || ''));
        alexSpeak('For example: ' + ej.frase, 0.88, ()=>{
          if (ej.explicacion) alexSpeak(ej.explicacion, 0.98, alListening, 'es', ()=>setOrbState('speaking'));
          else alListening();
        }, null, ()=>setOrbState('speaking'));
      } else alListening();
    }, ()=>setOrbState('speaking'));
  };

  const startListen = () => {
    if (!word || listening) return;
    // Silenciar a Alex al instante que el usuario presiona el botón
    window._alexListening = true;
    if(_currentAudio){_currentAudio.pause();_currentAudio=null;}
    window.speechSynthesis && window.speechSynthesis.cancel();
    window.responsiveVoice && window.responsiveVoice.cancel();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { window._alexListening = false; setBubble('Usa Chrome para el reconocimiento de voz.'); setBubbleType('err'); return; }
    const rec = new SR();
    rec.lang='en-US'; rec.interimResults=false; rec.maxAlternatives=5;
    let silenceTimer = null;
    rec.onstart = () => {
      // Silenciar a Mr. Alex inmediatamente
      window._alexListening = true;
      if(_currentAudio){_currentAudio.pause();_currentAudio=null;}
      window.speechSynthesis && window.speechSynthesis.cancel();
      window.responsiveVoice && window.responsiveVoice.cancel();
      setListening(true); setOrbState('listening');
      setBubble('🎙️ Escuchando... ¡Habla ahora!'); setBubbleType('');
      silenceTimer = setTimeout(()=>{ try{rec.stop();}catch(e){} }, 10000);
    };
    rec.onend = () => {
      window._alexListening = false; // Mr. Alex puede hablar de nuevo
      setListening(false);
      if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer=null; }
    };
    rec.onerror = (e) => {
      setListening(false); setOrbState('idle');
      if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer=null; }
      if (e.error==='no-speech') {
        const msgSil = rand(ALEX_SILENCIO);
        setBubble('🔇 ' + msgSil); setBubbleType('err');
        alexSpeak(msgSil, 0.85, null, 'es');
      } else if (e.error==='not-allowed') {
        setBubble('🎤 Micrófono bloqueado. Permite el acceso al mic en tu navegador.'); setBubbleType('err');
      } else {
        setBubble('Mic error: '+e.error); setBubbleType('err');
      }
    };
    rec.onresult = async(e) => {
      window._alexListening = false;   // resultado recibido: la respuesta de Mr. Alex no debe saltarse por la carrera con onend
      setOrbState('thinking');
      const alts = Array.from(e.results[0]).map(r=>r.transcript);
      const hit = alts.some(a=>isMatch(a, word.en));
      setTotal(t=>t+1);
      if (hit) {
        setCorrect(c=>c+1); setTotalXP(x=>x+10);
        const msgOk = randFn(ALEX_OK, word.en);
        setBubble('✅ ' + msgOk); setBubbleType('ok'); setOrbState('speaking');
        // Guardar palabra en backend
        let temaCompleto = false;
        try {
          const r = await fetch(API+'/api/practice/word-done',{method:'POST',headers:authH(token),body:JSON.stringify({temaId: tema?.id, word: word.en})});
          const d = await r.json();
          if (d.user) setUser(d.user);
          if (d.todosCompletos) { setTodosComp(true); setQuizHabil(true); }
          temaCompleto = d.temaCompleto || false;
          // Actualizar progreso local
          setProgTemas(prev => {
            const tid = tema?.id;
            const prevComp = prev[tid]?.palabrasCompletadas || [];
            if (!prevComp.includes(word.en)) {
              return { ...prev, [tid]: { ...prev[tid], completadas: (prev[tid]?.completadas||0)+1, palabrasCompletadas: [...prevComp, word.en] } };
            }
            return prev;
          });
            if (temaCompleto) await cargarProgreso();
        } catch {}
        // Avanzar automáticamente
        if (temaCompleto) {
          // Tema completado: se desbloquea el siguiente, PERO no se cierra el panel.
          // El alumno puede seguir practicando este tema (repaso) si quiere.
          setOrbState('speaking');
          setBubble('🏆 ¡Tema completado! Se desbloqueó el siguiente. Puedes seguir practicando o elegir el siguiente tema.');
          setBubbleType('ok');
          alexSpeak('Felicitaciones! Completaste este tema. Se desbloqueó el siguiente. Puedes seguir practicando este tema o elegir el siguiente.', 0.98, ()=>{
            setOrbState('listening'); setBubble('🎤 Sigue practicando: toca "Nueva palabra" o cierra para elegir otro tema.'); setBubbleType('');
          }, 'es', ()=>setOrbState('speaking'));
        } else {
          // Pronunció bien la palabra → ahora Mr. Alex le pregunta CÓMO USARLA:
          // reto "completa la frase". Solo avanza si la completa.
          setBubble('✅ ' + word.en + ' — ¡bien! Ahora, ¿cómo la usas?'); setBubbleType('ok'); setOrbState('speaking');
          const w = word;
          fetch(API+'/api/practice/frase',{method:'POST',headers:authH(token),body:JSON.stringify({en:w.en,es:w.es})})
            .then(r=>r.ok?r.json():null).then(fr=>{
              if (fr && Array.isArray(fr.opts) && fr.opts.length) {
                setFraseReto({ ...fr, word: w });
                setBubble('🧩 Completa la frase con lo que aprendiste.');
                alexSpeak('Now, how would you use it? Complete the sentence.', 0.9, ()=>setOrbState('idle'), null, ()=>setOrbState('speaking'));
              } else {
                alexSpeak('Correct.', 0.82, ()=>{ setOrbState('idle'); setTimeout(()=>getWord(), 300); });
              }
            }).catch(()=>{ alexSpeak('Correct.', 0.82, ()=>{ setOrbState('idle'); setTimeout(()=>getWord(), 300); }); });
        }
      } else {
        // Se equivocó al pronunciar → Mr. Alex corrige con calma (NO gasta energía:
        // el reconocimiento de voz falla seguido y no debe castigar). Modela la
        // palabra despacio y luego normal, y vuelve a escuchar.
        const tok = window._alexToken || token;
        setBubble('🔁 No es así. Escucha: primero despacio, luego normal. ¡Tú puedes!'); setBubbleType('err'); setOrbState('thinking');
        alexSpeak(rand(ALEX_CORRECCION), 0.98, ()=>{
          setBubble('🐢 ' + word.en + ' — despacio…');
          alexSpeakSlow(word.en, tok, ()=>{
            setBubble('🔊 ' + word.en + ' — ahora normal');
            alexSpeak(word.en, 0.85, ()=>{
              setOrbState('listening'); setBubble('🎤 Otra vez, suave: ' + word.en + ' (' + word.es + ')'); setBubbleType('');
            }, null, ()=>setOrbState('speaking'));
          });
        }, 'es', ()=>setOrbState('speaking'));
      }
    };
    // Si start() falla (mic ocupado o reconocimiento ya activo), liberar todo para poder reintentar
    try {
      rec.start();
    } catch (e) {
      window._alexListening = false;
      setListening(false);
      setOrbState('idle');
      setBubble('🎤 Toca "Pronunciar" de nuevo para hablar.'); setBubbleType('');
    }
  };

  const xp = user?.experiencePoints || 0;
  const pct = Math.min(xp%100, 100);
  const progPct = total>0 ? Math.round((correct/total)*100) : 0;

  // Progreso real del nivel (en tiempo real): palabras completadas / total de palabras del nivel
  const palabrasTotalesNivel = TOPICS.reduce((a,t)=> a + (progTemas[t.id]?.total || (vocabData[t.id]||[]).length || 0), 0);
  const palabrasHechasNivel  = TOPICS.reduce((a,t)=> a + (progTemas[t.id]?.completadas || 0), 0);
  const temasTotalesNivel    = TOPICS.length;
  const temasHechosNivel     = TOPICS.filter(t => progTemas[t.id]?.completo).length;
  const pctNivel = palabrasTotalesNivel>0 ? Math.round((palabrasHechasNivel/palabrasTotalesNivel)*100) : 0;

  // ✨ Repaso (A1): temas del nivel con su estado (cada tema completado desbloquea su rutina de repaso)
  const temasRepaso = TOPICS.filter(t => (vocabData[t.id]||[]).length > 0)
    .map(t => ({ id:t.id, name:t.name, icon:t.icon, words: vocabData[t.id]||[], completo: esAdmin || !!progTemas[t.id]?.completo }));
  // 🌟 "Todos los temas": se desbloquea con 3 temas completados y juega SOLO con lo aprendido.
  // Crece solo: más temas completados = más palabras entran al juego. El admin lo ve siempre.
  const todosDesbloqueado = esAdmin || temasHechosNivel >= 3;
  const temaTodos = (()=>{ const seen = new Set(); return { id:'__todos', name:'Todos los temas', icon:'🌟', completo:true,
    words: TOPICS.filter(t => esAdmin || progTemas[t.id]?.completo)
      .flatMap(t => (vocabData[t.id]||[]).map(w => ({ ...w, icon: t.icon })))
      .filter(w => { if (seen.has(w.en)) return false; seen.add(w.en); return true; }) }; })();
  let bellOn = false; try { bellOn = todosDesbloqueado && localStorage.getItem('aq_bell_todos_'+nivel) !== '1'; } catch {}

  if (screen2==='quiz') return (
    <LevelQuiz
      nivel={nivel}
      token={token}
      onBack={()=>setScreen2('')}
      onPass={()=>{ setScreen2(''); setLvlUp(true); setScreen('curso'); setTimeout(()=>setLvlUp(false),4000); if(nivel==='C2'){ setTimeout(()=>{ const el=document.getElementById('c2-entrevistas'); if(el) el.scrollIntoView({behavior:'smooth',block:'center'}); },700); } }}
      onUserUpdate={(u)=>setUser(u)}
    />
  );

  if (screen2==='arena') return (
    <ArenaGame
      token={token}
      onBack={()=>setScreen2('')}
    />
  );

  if (screen2==='city') return (
    <CityGame
      token={token}
      onBack={()=>setScreen2('')}
    />
  );

  if (screen2==='files') return (
    <FilesGame token={token} onBack={()=>setScreen2('')} />
  );

  if (screen2==='royale') return (
    <RoyaleGame token={token} onBack={()=>setScreen2('')} />
  );

  if (screen2==='grimoire') return (
    <GrimoireGame token={token} onBack={()=>setScreen2('')} />
  );

  if (screen2==='tribunal') return (
    <TribunalGame token={token} user={user} onBack={()=>setScreen2('')} />
  );

  if (screen2==='interview') return (
    <EntrevistaPanel token={token} user={user} persona={{nombre:'AI Teacher', titulo:'AI TEACHER (GEMINI)', emoji:'🌊', grad:'linear-gradient(135deg,#3b82f6,#8b5cf6,#f43f5e)', accent:'99,102,241'}} onBack={()=>setScreen2('')} />
  );

  if (screen2==='nexa') return (
    <AvatarIframe src="/avatars/nexa.html" titulo="NEXA" onBack={()=>setScreen2('')} />
  );

  if (screen2==='michael') return (
    <AvatarIframe src="/avatars/michael.html" titulo="Michael Reed" onBack={()=>setScreen2('')} />
  );

  if (screen2==='admin' && user?.role==='admin') return (
    <AdminPanel
      token={token}
      user={user}
      onBack={()=>setScreen2('')}
      onVerNivel={(n)=>{ setAdminVistaNivel(n); setTema(null); setScreen2(''); setScreen('curso'); }}
    />
  );

  if (screen==='home') return (
    <>
      <style>{KF}</style>
      <Home onEmpezar={()=>setScreen(user ? 'curso' : 'auth')} user={user} onLogout={logout} onAdmin={()=>{ setScreen('curso'); setScreen2('admin'); }}/>
    </>
  );

  if (screen==='placement') return (
    <PlacementTestScreen
      token={token}
      userName={user?.name || ''}
      alexSpeak={alexSpeak}
      onFinish={(updatedUser) => {
        setUser(updatedUser);
        setScreen('curso');              // todos empiezan en el Aula 1 (A1), sin mostrar nivel
      }}
      onBack={() => setScreen('curso')}  // volver al aula guardando el avance del test
    />
  );

  if (screen==='forgot') return (
    <div style={{background:'#06080f',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Poppins',sans-serif",padding:20}}>
      <style>{KF}</style>
      <div style={{background:'#0d1117',width:'100%',maxWidth:400,borderRadius:22,padding:'40px 36px',border:'1px solid rgba(99,102,241,.15)',boxShadow:'0 8px 50px rgba(0,0,0,.7)'}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{width:58,height:58,background:'linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem',margin:'0 auto 14px'}}>🔑</div>
          <h2 style={{color:'#6366f1',margin:0,fontSize:'1.5rem',fontWeight:900}}>Recuperar contraseña</h2>
          <p style={{color:'#64748b',margin:'6px 0 0',fontSize:13}}>Te enviaremos un enlace a tu correo</p>
        </div>
        <label style={{display:'block',marginBottom:7,color:'#94a3b8',fontSize:13,fontWeight:500}}>Correo</label>
        <input style={{width:'100%',padding:'12px 16px',background:'#161b26',border:'1px solid rgba(99,102,241,.12)',borderRadius:10,color:'#e2e8f0',fontSize:14,boxSizing:'border-box',marginBottom:20,fontFamily:"'Poppins',sans-serif",outline:'none'}}
          type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="correo@ejemplo.com"/>
        <button onClick={handleForgot} disabled={authBusy} style={{width:'100%',padding:'13px 0',background:authBusy?'#3730a3':'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:10,fontWeight:700,fontSize:15,cursor:authBusy?'wait':'pointer',fontFamily:"'Poppins',sans-serif"}}>
          {authBusy?'Enviando…':'Enviar enlace'}
        </button>
        {authErr&&<p style={{marginTop:14,color:'#f87171',textAlign:'center',fontSize:13}}>{authErr}</p>}
        {authMsg&&<p style={{marginTop:14,color:'#34d399',textAlign:'center',fontSize:13,background:'rgba(16,185,129,.08)',border:'1px solid rgba(16,185,129,.25)',borderRadius:10,padding:'10px'}}>{authMsg}</p>}
        <p style={{textAlign:'center',marginTop:20,fontSize:13}}>
          <span onClick={()=>{setScreen('auth');setMode('login');setAuthErr('');setAuthMsg('');}} style={{color:'#6366f1',textDecoration:'underline',cursor:'pointer'}}>← Volver a iniciar sesion</span>
        </p>
      </div>
    </div>
  );

  if (screen==='reset') return (
    <div style={{background:'#06080f',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Poppins',sans-serif",padding:20}}>
      <style>{KF}</style>
      <div style={{background:'#0d1117',width:'100%',maxWidth:400,borderRadius:22,padding:'40px 36px',border:'1px solid rgba(99,102,241,.15)',boxShadow:'0 8px 50px rgba(0,0,0,.7)'}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{width:58,height:58,background:'linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem',margin:'0 auto 14px'}}>🔒</div>
          <h2 style={{color:'#6366f1',margin:0,fontSize:'1.5rem',fontWeight:900}}>Nueva contraseña</h2>
          <p style={{color:'#64748b',margin:'6px 0 0',fontSize:13}}>Crea tu nueva contraseña</p>
        </div>
        <label style={{display:'block',marginBottom:7,color:'#94a3b8',fontSize:13,fontWeight:500}}>Contraseña nueva</label>
          <input style={{width:'100%',padding:'12px 16px',background:'#161b26',border:'1px solid rgba(99,102,241,.12)',borderRadius:10,color:'#e2e8f0',fontSize:14,boxSizing:'border-box',marginBottom:8,fontFamily:"'Poppins',sans-serif",outline:'none'}}
          type="password" value={resetPass} onChange={e=>setResetPass(e.target.value)} placeholder="••••••••"/>
        <p style={{margin:'0 0 16px',color:'#475569',fontSize:11.5,lineHeight:1.4}}>Minimo 8 caracteres, con una mayuscula, una minuscula y un numero.</p>
        <button onClick={handleReset} disabled={authBusy} style={{width:'100%',padding:'13px 0',background:authBusy?'#3730a3':'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:10,fontWeight:700,fontSize:15,cursor:authBusy?'wait':'pointer',fontFamily:"'Poppins',sans-serif"}}>
          {authBusy?'Guardando…':'Cambiar contraseña'}
        </button>
        {authErr&&<p style={{marginTop:14,color:'#f87171',textAlign:'center',fontSize:13}}>{authErr}</p>}
        {authMsg&&<p style={{marginTop:14,color:'#34d399',textAlign:'center',fontSize:13}}>{authMsg}</p>}
      </div>
    </div>
  );

  if (screen==='auth') return (
    <div style={{background:'#06080f',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Poppins',sans-serif",padding:20}}>
      <style>{KF}</style>
      <div style={{background:'#0d1117',width:'100%',maxWidth:400,borderRadius:22,padding:'40px 36px',border:'1px solid rgba(99,102,241,.15)',boxShadow:'0 8px 50px rgba(0,0,0,.7)'}}>

        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{width:58,height:58,background:'linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem',margin:'0 auto 14px',boxShadow:'0 4px 20px rgba(99,102,241,.4)'}}>🎓</div>
          <h2 style={{color:'#6366f1',margin:0,fontSize:'1.75rem',fontWeight:900}}>AulaQuest</h2>
          <p style={{color:'#64748b',margin:'6px 0 0',fontSize:13}}>{mode==='login'?'Ingresa al Aula':'Crea tu cuenta'}</p>
        </div>

        <div style={{display:'flex',background:'#161b26',borderRadius:11,padding:3,marginBottom:28,border:'1px solid rgba(99,102,241,.1)'}}>
          {['login','register'].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setAuthErr('');}}
              style={{flex:1,padding:'9px 0',border:'none',borderRadius:9,cursor:'pointer',fontWeight:600,fontSize:13,fontFamily:"'Poppins',sans-serif",transition:'all .2s',
                background:mode===m?'linear-gradient(135deg,#6366f1,#8b5cf6)':'transparent',
                color:mode===m?'#fff':'#64748b',
                boxShadow:mode===m?'0 2px 12px rgba(99,102,241,.4)':'none'}}>
              {m==='login'?'Iniciar sesion':'Registrarse'}
            </button>
          ))}
        </div>

        <form onSubmit={handleAuth}>
          {mode==='register'&&(<>
            <label style={{display:'block',marginBottom:7,color:'#94a3b8',fontSize:13,fontWeight:500}}>Nombre</label>
            <input style={{width:'100%',padding:'12px 16px',background:'#161b26',border:'1px solid rgba(99,102,241,.12)',borderRadius:10,color:'#e2e8f0',fontSize:14,boxSizing:'border-box',marginBottom:16,fontFamily:"'Poppins',sans-serif",outline:'none'}}
            value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="Tu nombre" autoComplete="off"
            onFocus={e=>e.target.style.borderColor='rgba(99,102,241,.5)'}
            onBlur={e=>e.target.style.borderColor='rgba(99,102,241,.12)'}/>
          </>)}

          <label style={{display:'block',marginBottom:7,color:'#94a3b8',fontSize:13,fontWeight:500}}>Correo</label>
          <input style={{width:'100%',padding:'12px 16px',background:'#161b26',border:'1px solid rgba(99,102,241,.12)',borderRadius:10,color:'#e2e8f0',fontSize:14,boxSizing:'border-box',marginBottom:16,fontFamily:"'Poppins',sans-serif",outline:'none'}}
          type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required placeholder="correo@ejemplo.com" autoComplete="off"
          onFocus={e=>e.target.style.borderColor='rgba(99,102,241,.5)'}
          onBlur={e=>e.target.style.borderColor='rgba(99,102,241,.12)'}/>
          <label style={{display:'block',marginBottom:7,color:'#94a3b8',fontSize:13,fontWeight:500}}>Contrasena</label>
          <div style={{position:'relative',marginBottom:mode==='register'?16:26}}>
            <input style={{width:'100%',padding:'12px 44px 12px 16px',background:'#161b26',border:'1px solid rgba(99,102,241,.12)',borderRadius:10,color:'#e2e8f0',fontSize:14,boxSizing:'border-box',fontFamily:"'Poppins',sans-serif",outline:'none'}}
              type={showPass?'text':'password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required placeholder="••••••••" autoComplete={mode==='register'?'new-password':'current-password'}
              onFocus={e=>e.target.style.borderColor='rgba(99,102,241,.5)'}
              onBlur={e=>e.target.style.borderColor='rgba(99,102,241,.12)'}/>
            <button type="button" onClick={()=>setShowPass(!showPass)}
              style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#94a3b8',fontSize:16,padding:0,lineHeight:1}}
              aria-label={showPass?'Ocultar contraseña':'Ver contraseña'}>
              {showPass?'🙈':'👁️'}
            </button>
          </div>

          {mode==='register' && (
            <p style={{margin:'-8px 0 16px',color:'#475569',fontSize:11.5,lineHeight:1.4}}>Minimo 8 caracteres, con una mayuscula, una minuscula y un numero.</p>
          )}

          <button type="submit" disabled={authBusy} style={{width:'100%',padding:'13px 0',background:authBusy?'#3730a3':'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:10,fontWeight:700,fontSize:15,cursor:authBusy?'wait':'pointer',fontFamily:"'Poppins',sans-serif",boxShadow:'0 4px 15px rgba(99,102,241,.4)',opacity:authBusy?0.8:1}}>
            {authBusy ? 'Procesando…' : (mode==='login'?'Entrar':'Crear cuenta')}
          </button>
        </form>

        {mode==='login' && (
          <p style={{textAlign:'center',marginTop:14,fontSize:12.5}}>
            <span onClick={()=>{setScreen('forgot');setAuthErr('');setAuthMsg('');}} style={{color:'#94a3b8',cursor:'pointer',textDecoration:'underline'}}>¿Olvidaste tu contraseña?</span>
          </p>
        )}

        {authErr&&<p style={{marginTop:14,color:'#f87171',textAlign:'center',fontSize:13}}>{authErr}</p>}
        {authMsg&&<p style={{marginTop:14,color:'#34d399',textAlign:'center',fontSize:13,background:'rgba(16,185,129,.08)',border:'1px solid rgba(16,185,129,.25)',borderRadius:10,padding:'10px'}}>{authMsg}</p>}
        <p style={{textAlign:'center',marginTop:20,fontSize:13}}>
          <span onClick={()=>setScreen('home')} style={{color:'#6366f1',textDecoration:'underline',cursor:'pointer'}}>Volver al inicio</span>
        </p>
      </div>
    </div>
  );
  return (
    <div style={{background:'#020617',minHeight:'100vh',fontFamily:"'Poppins',sans-serif",color:'#e2e8f0',position:'relative'}}>
      <style>{KF}</style>
      {showDiag && <DiagnosticoPanel diag={user?.diagnostico} userName={user?.name||''} onClose={()=>setShowDiag(false)} />}
      {showDailyModal && (
        <div onClick={()=>setShowDailyModal(false)} style={{position:'fixed',inset:0,background:'rgba(2,4,10,.8)',backdropFilter:'blur(4px)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:18,fontFamily:"'Poppins',sans-serif"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:420,background:'#0d1117',borderRadius:22,border:'1px solid rgba(245,158,11,.3)',padding:'28px 26px',textAlign:'center',boxShadow:'0 12px 50px rgba(0,0,0,.7)'}}>
            <div style={{fontSize:'2.4rem'}}>🌙</div>
            <h3 style={{color:'#fbbf24',margin:'8px 0 6px',fontSize:'1.15rem',fontWeight:800}}>Un tema por día</h3>
            <p style={{color:'#cbd5e1',fontSize:'.85rem',lineHeight:1.6,margin:'0 0 6px'}}>En la <b>versión gratuita</b> puedes practicar <b>1 tema por día</b>. Ya practicaste el tema de hoy — vuelve mañana para el siguiente.</p>
            <p style={{color:'#94a3b8',fontSize:'.8rem',lineHeight:1.6,margin:'0 0 16px'}}>¿Quieres practicar <b>los temas que quieras cada día</b>? Contáctanos y desbloqueamos tu cuenta.</p>
            <a href={'https://wa.me/573022398289?text='+encodeURIComponent('Hola, quiero desbloquear mi cuenta de AulaQuest para practicar varios temas por día.')} target="_blank" rel="noopener noreferrer" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:'linear-gradient(135deg,#25D366,#128C7E)',color:'#fff',border:'none',padding:'12px',borderRadius:12,fontWeight:700,fontSize:'.88rem',cursor:'pointer',textDecoration:'none',marginBottom:8}}>💬 Contactar a soporte por WhatsApp</a>
            <button onClick={()=>setShowDailyModal(false)} style={{background:'transparent',border:'1px solid rgba(148,163,184,.3)',color:'#94a3b8',padding:'10px',borderRadius:12,fontWeight:600,fontSize:'.82rem',cursor:'pointer',width:'100%'}}>Entendido</button>
          </div>
        </div>
      )}
      {showInterviewModal && (
        <div onClick={()=>setShowInterviewModal(false)} style={{position:'fixed',inset:0,background:'rgba(2,4,10,.8)',backdropFilter:'blur(4px)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:18,fontFamily:"'Poppins',sans-serif"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:420,background:'#0d1117',borderRadius:22,border:'1px solid rgba(99,102,241,.3)',padding:'30px 26px',textAlign:'center',boxShadow:'0 12px 50px rgba(0,0,0,.7)'}}>
            <div style={{fontSize:'2.9rem',marginBottom:8}}>🔒</div>
            <h2 style={{color:'#a5b4fc',margin:'0 0 10px',fontSize:'1.2rem',fontWeight:900}}>Entrevistas bloqueadas</h2>
            {interviewReqState==='sent' ? (
              <>
                <p style={{color:'#34d399',fontSize:14,lineHeight:1.6,marginBottom:22}}>✅ ¡Solicitud enviada! Soporte revisará tu acceso y te contactará pronto por correo.</p>
                <button onClick={()=>setShowInterviewModal(false)} style={{width:'100%',padding:'13px 0',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:12,fontWeight:800,fontSize:15,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Entendido</button>
              </>
            ) : (
              <>
                <p style={{color:'#94a3b8',fontSize:13.5,lineHeight:1.6,marginBottom:18}}>Las entrevistas con IA requieren acceso. Solicítalo a soporte y te avisaremos cuando esté habilitado para tu cuenta.</p>
                {interviewReqState==='error' && <p style={{color:'#f87171',fontSize:12.5,marginBottom:12}}>No se pudo enviar. Revisa tu conexión e intenta de nuevo.</p>}
                <button onClick={solicitarEntrevista} disabled={interviewReqState==='sending'}
                  style={{width:'100%',padding:'13px 0',background:interviewReqState==='sending'?'#3730a3':'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:12,fontWeight:800,fontSize:15,cursor:interviewReqState==='sending'?'wait':'pointer',fontFamily:"'Poppins',sans-serif",marginBottom:10}}>
                  {interviewReqState==='sending'?'Enviando…':'Solicitar acceso a soporte'}
                </button>
                <button onClick={()=>setShowInterviewModal(false)} style={{width:'100%',padding:'10px 0',background:'none',color:'#64748b',border:'none',borderRadius:10,fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Cancelar</button>
              </>
            )}
          </div>
        </div>
      )}
      {showMaterial && (
        <div onClick={()=>setShowMaterial(false)} style={{position:'fixed',inset:0,zIndex:9400,background:'rgba(2,6,23,.85)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,fontFamily:"'Poppins',sans-serif"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:520,background:'linear-gradient(180deg,rgba(24,29,49,.99),rgba(13,17,28,.99))',backdropFilter:'blur(26px) saturate(1.5)',WebkitBackdropFilter:'blur(26px) saturate(1.5)',border:'1px solid rgba(255,255,255,.09)',borderRadius:22,padding:'1.4rem',boxShadow:'0 30px 80px rgba(0,0,0,.6)',position:'relative',maxHeight:'90vh',overflowY:'auto',boxSizing:'border-box'}}>
            <button onClick={()=>setShowMaterial(false)} style={{position:'absolute',top:14,right:14,background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.25)',color:'#ef4444',width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:12}}>✕</button>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
              <div style={{width:44,height:44,borderRadius:13,background:'linear-gradient(135deg,#10b981,#06b6d4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem',boxShadow:'0 4px 16px rgba(16,185,129,.35)'}}>📚</div>
              <div>
                <div style={{fontSize:'1rem',fontWeight:800,color:'#f1f5f9'}}>Material de apoyo</div>
                <div style={{fontSize:'.7rem',color:'#94a3b8'}}>Ingles {nivel} · 4 recursos descargables en PDF</div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10}}>
              {[
                { ic:'📘', t:'Guía de gramática '+nivel,      d:'Reglas clave del nivel '+nivel, url:'/material/AulaQuest_Guia_Gramatica_'+nivel+'.pdf' },
                { ic:'📋', t:'Vocabulario '+nivel+' completo', d:'Todas las palabras con traducción', url:'/material/AulaQuest_Vocabulario_'+nivel+'_Completo.pdf' },
                { ic:'✏️', t:'Hojas de ejercicios',            d:'Práctica imprimible por tema', url:'/material/AulaQuest_Hojas_de_Ejercicios_'+nivel+'.pdf' },
                { ic:'🔊', t:'Guía de pronunciación',          d:'Sonidos del inglés con audio', url:'/material/AulaQuest_Guia_Pronunciacion.pdf' },
              ].map((m,i)=>(
                <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" download
                  onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(16,185,129,.5)'} onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.09)'}
                  style={{display:'block',textDecoration:'none',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.09)',borderRadius:14,padding:14,transition:'border-color .15s'}}>
                  <div style={{fontSize:'1.6rem',lineHeight:1}}>{m.ic}</div>
                  <div style={{color:'#e2e8f0',fontSize:'.78rem',fontWeight:600,marginTop:8}}>{m.t}</div>
                  <div style={{color:'#64748b',fontSize:'.7rem',marginTop:3,lineHeight:1.5}}>{m.d}</div>
                  <div style={{color:'#34d399',fontSize:'.7rem',marginTop:10,fontWeight:600}}>⬇ Descargar PDF</div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
      {repasoOpen && <RepasoAlex token={token} temas={temasRepaso} nivel={nivel} nombre={(user?.name||'').split(' ')[0]} onClose={()=>setRepasoOpen(false)}/>}
      {todosOpen && <TodosQuiz token={token} words={temaTodos.words} nivel={nivel} nombre={(user?.name||'').split(' ')[0]} onClose={()=>setTodosOpen(false)}/>}
      <div className="aq-bar" style={{background:'rgba(10,14,26,.45)',backdropFilter:'blur(22px) saturate(1.4)',WebkitBackdropFilter:'blur(22px) saturate(1.4)',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 1.8rem',borderBottom:'1px solid rgba(255,255,255,0.06)',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={()=>setScreen('home')}>
          <div style={{width:34,height:34,background:'linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.95rem',boxShadow:'0 0 16px rgba(99,102,241,.4)'}}>🎓</div>
          <span style={{fontWeight:800,fontSize:'1.05rem',letterSpacing:'.02em',background:'linear-gradient(135deg,#818cf8,#c4b5fd)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>AulaQuest</span>
        </div>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          <span onClick={()=>setScreen('home')} style={{color:'#94a3b8',fontSize:'.78rem',padding:'5px 10px',cursor:'pointer',borderRadius:7,transition:'all .2s'}}
            onMouseEnter={e=>e.currentTarget.style.color='#e2e8f0'}
            onMouseLeave={e=>e.currentTarget.style.color='#94a3b8'}>
            Inicio
          </span>
          <span style={{color:'#334155',fontSize:'.78rem'}}>|</span>
          <span style={{color:'#475569',fontSize:'.78rem',padding:'5px 10px'}}>Curso activo:</span>
          {esAdmin ? (
            <div style={{position:'relative'}}>
              <div onClick={()=>setNivelMenu(o=>!o)} title="Como admin puedes ver el aula de cualquier nivel"
                style={{display:'flex',alignItems:'center',gap:8,color:'#fbbf24',fontSize:'.78rem',padding:'5px 12px',borderRadius:9,background:'linear-gradient(135deg,rgba(245,158,11,.18),rgba(217,119,6,.12))',border:'1px solid rgba(245,158,11,.45)',fontWeight:700,cursor:'pointer',boxShadow:'0 2px 10px rgba(245,158,11,.15)'}}>
                🛡️ Inglés {nivel} <span style={{fontSize:'.6rem',opacity:.8,transition:'transform .2s',transform:nivelMenu?'rotate(180deg)':'none'}}>▼</span>
              </div>
              {nivelMenu && (
                <div style={{position:'absolute',top:'calc(100% + 8px)',left:0,background:'rgba(13,17,28,.98)',backdropFilter:'blur(14px)',border:'1px solid rgba(245,158,11,.25)',borderRadius:14,padding:8,minWidth:210,zIndex:3000,boxShadow:'0 24px 60px rgba(0,0,0,.7), 0 0 0 1px rgba(245,158,11,.08)'}}>
                  <div style={{fontSize:'.62rem',color:'#64748b',fontWeight:700,letterSpacing:'.1em',padding:'4px 10px 8px',textTransform:'uppercase'}}>Ver aula por nivel</div>
                  {[
                    {l:'A1',n:'Principiante',c:'#10b981'},{l:'A2',n:'Elemental',c:'#06b6d4'},
                    {l:'B1',n:'Intermedio',c:'#6366f1'},{l:'B2',n:'Intermedio alto',c:'#8b5cf6'},
                    {l:'C1',n:'Avanzado',c:'#d946ef'},{l:'C2',n:'Maestría',c:'#f59e0b'},
                  ].map(o=>{
                    const sel = nivel===o.l;
                    return (
                      <div key={o.l} onClick={()=>{ setAdminVistaNivel(o.l); setTema(null); setScreen2(''); setNivelMenu(false); }}
                        onMouseEnter={e=>{ if(!sel) e.currentTarget.style.background='rgba(255,255,255,.05)'; }}
                        onMouseLeave={e=>{ if(!sel) e.currentTarget.style.background='transparent'; }}
                        style={{display:'flex',alignItems:'center',gap:10,padding:'9px 10px',borderRadius:9,cursor:'pointer',background:sel?'rgba(245,158,11,.14)':'transparent',border:sel?'1px solid rgba(245,158,11,.35)':'1px solid transparent',marginBottom:2,transition:'background .15s'}}>
                        <div style={{width:30,height:30,borderRadius:8,background:`${o.c}22`,border:`1px solid ${o.c}55`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <span style={{fontSize:'.72rem',fontWeight:800,color:o.c}}>{o.l}</span>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:'.78rem',fontWeight:600,color:'#e2e8f0'}}>Inglés {o.l}</div>
                          <div style={{fontSize:'.64rem',color:'#64748b'}}>{o.n}</div>
                        </div>
                        {sel && <span style={{color:'#fbbf24',fontSize:'.75rem'}}>✓</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <span style={{color:'#e2e8f0',fontSize:'.78rem',padding:'5px 12px',borderRadius:7,background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,.3)',fontWeight:600}}>Ingles {nivel}</span>
          )}
          {(
            <div style={{position:'relative',marginLeft:10}}>
              <div onClick={()=>setPractMenu(o=>!o)}
                onMouseEnter={e=>{ if(!practMenu) e.currentTarget.style.color='#e2e8f0'; }}
                onMouseLeave={e=>{ if(!practMenu) e.currentTarget.style.color='#94a3b8'; }}
                style={{position:'relative',color:practMenu?'#e2e8f0':'#94a3b8',fontSize:'.78rem',padding:'5px 10px',cursor:'pointer',borderRadius:7,transition:'all .2s'}}>
                Repaso
                {bellOn && <span title="¡Nuevo repaso desbloqueado!" style={{position:'absolute',top:-3,right:-2,width:14,height:14,borderRadius:'50%',background:'#ef4444',border:'1.5px solid #0a0e1a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.5rem',boxShadow:'0 0 8px rgba(239,68,68,.7)'}}>🔔</span>}
              </div>
              {practMenu && <div onClick={()=>setPractMenu(false)} style={{position:'fixed',inset:0,zIndex:1999}}/>}
              {practMenu && (
                <div style={{position:'absolute',top:'calc(100% + 12px)',left:'50%',transform:'translateX(-50%)',minWidth:256,background:'linear-gradient(180deg,rgba(24,29,49,.99),rgba(13,17,28,.99))',backdropFilter:'blur(26px) saturate(1.5)',WebkitBackdropFilter:'blur(26px) saturate(1.5)',border:'1px solid rgba(139,92,246,.28)',borderRadius:18,padding:8,zIndex:2000,boxShadow:'0 24px 60px rgba(0,0,0,.75), 0 0 0 1px rgba(139,92,246,.08), 0 0 40px rgba(99,102,241,.12)'}}>
                  <div style={{fontSize:'.6rem',color:'#64748b',fontWeight:700,letterSpacing:'.08em',padding:'6px 10px 8px'}}>PRÁCTICA CON MR. ALEX</div>
                  <div onClick={()=>{ setPractMenu(false); setRepasoOpen(true); }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.06)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    style={{display:'flex',alignItems:'center',gap:11,padding:10,borderRadius:12,cursor:'pointer',transition:'background .12s'}}>
                    <div style={{width:38,height:38,flexShrink:0,borderRadius:11,background:'linear-gradient(135deg,#8b5cf6,#d946ef)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem'}}>🧠</div>
                    <div style={{flex:1}}><div style={{fontWeight:700,fontSize:'.8rem',color:'#f1f5f9'}}>Repaso de temas aprendidos</div><div style={{fontSize:'.65rem',color:'#94a3b8'}}>Solo lo que ya aprendiste</div></div>
                    <span style={{color:'#475569',fontSize:'.8rem'}}>›</span>
                  </div>
                  <div onClick={()=>{ if(!todosDesbloqueado) return; try{localStorage.setItem('aq_bell_todos_'+nivel,'1');}catch(e){} setPractMenu(false); setTodosOpen(true); }}
                    onMouseEnter={e=>{ if(todosDesbloqueado) e.currentTarget.style.background='rgba(255,255,255,.06)'; }} onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    style={{display:'flex',alignItems:'center',gap:11,padding:10,borderRadius:12,cursor:todosDesbloqueado?'pointer':'not-allowed',transition:'background .12s',opacity:todosDesbloqueado?1:.55}}>
                    <div style={{width:38,height:38,flexShrink:0,borderRadius:11,background:'linear-gradient(135deg,#f59e0b,#d946ef)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',position:'relative'}}>🌟
                      {bellOn && <span style={{position:'absolute',top:-4,right:-4,width:14,height:14,borderRadius:'50%',background:'#ef4444',border:'1.5px solid #0a0e1a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.5rem',boxShadow:'0 0 8px rgba(239,68,68,.7)'}}>🔔</span>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:'.8rem',color:'#f1f5f9',display:'flex',alignItems:'center',gap:6}}>Todos los temas{bellOn && <span style={{fontSize:'.52rem',color:'#fff',background:'#ef4444',borderRadius:20,padding:'1px 7px',fontWeight:800}}>NUEVO</span>}</div>
                      <div style={{fontSize:'.65rem',color:'#94a3b8'}}>{todosDesbloqueado?'Juego con lo aprendido: preguntas, V/F 🎲':'🔒 Se desbloquea al completar 3 temas'}</div>
                    </div>
                    <span style={{color:'#475569',fontSize:'.8rem'}}>{todosDesbloqueado?'›':'🔒'}</span>
                  </div>
                  <div style={{height:1,background:'rgba(255,255,255,.07)',margin:'6px 8px'}}/>
                  <div style={{fontSize:'.6rem',color:'#64748b',fontWeight:700,letterSpacing:'.08em',padding:'6px 10px 8px'}}>RECURSOS</div>
                  <div onClick={()=>{ setPractMenu(false); setShowMaterial(true); }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.06)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    style={{display:'flex',alignItems:'center',gap:11,padding:10,borderRadius:12,cursor:'pointer',transition:'background .12s'}}>
                    <div style={{width:38,height:38,flexShrink:0,borderRadius:11,background:'linear-gradient(135deg,#10b981,#06b6d4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem'}}>📚</div>
                    <div style={{flex:1}}><div style={{fontWeight:700,fontSize:'.8rem',color:'#f1f5f9'}}>Material de apoyo</div><div style={{fontSize:'.65rem',color:'#94a3b8'}}>PDF descargables del nivel</div></div>
                    <span style={{color:'#475569',fontSize:'.8rem'}}>›</span>
                  </div>
                </div>
              )}
            </div>
          )}
          {user?.role==='admin' && (<>
            <span style={{color:'#334155',fontSize:'.78rem'}}>|</span>
            <span onClick={()=>setScreen2('admin')} style={{color:'#f59e0b',fontSize:'.78rem',padding:'5px 12px',cursor:'pointer',borderRadius:7,background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.3)',fontWeight:700,display:'flex',alignItems:'center',gap:5}}>
              🛡️ Admin
            </span>
          </>)}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{position:'relative'}}>
            <div onClick={()=>setUserMenu2(o=>!o)}
              onMouseEnter={e=>{ if(!userMenu2) e.currentTarget.style.background='rgba(139,92,246,.1)'; }}
              onMouseLeave={e=>{ if(!userMenu2) e.currentTarget.style.background='transparent'; }}
              style={{display:'flex',alignItems:'center',gap:8,background:userMenu2?'rgba(139,92,246,.14)':'transparent',border:'none',padding:'4px 10px 4px 6px',borderRadius:50,cursor:'pointer',transition:'background .2s'}}>
              <div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.68rem',fontWeight:800,color:'#fff',boxShadow:'0 0 0 2px rgba(139,92,246,'+(userMenu2?'.6':'.25')+')',transition:'box-shadow .2s'}}>
                {inic(user?.name)}
              </div>
              <div>
                <div style={{fontSize:'.75rem',fontWeight:600,color:'#e2e8f0'}}>{(user?.name||'').split(' ')[0]}</div>
                <div style={{fontSize:'.62rem',color:'#64748b'}}>{xp} XP</div>
              </div>
            </div>
            {userMenu2 && <div onClick={()=>setUserMenu2(false)} style={{position:'fixed',inset:0,zIndex:1999}}/>}
            {userMenu2 && (
              <div style={{position:'absolute',top:'calc(100% + 12px)',right:0,minWidth:270,background:'linear-gradient(180deg,rgba(24,29,49,.99),rgba(13,17,28,.99))',backdropFilter:'blur(26px) saturate(1.5)',WebkitBackdropFilter:'blur(26px) saturate(1.5)',border:'1px solid rgba(139,92,246,.28)',borderRadius:18,padding:8,zIndex:2000,boxShadow:'0 24px 60px rgba(0,0,0,.75), 0 0 0 1px rgba(139,92,246,.08), 0 0 40px rgba(99,102,241,.12)'}}>
                <div style={{display:'flex',alignItems:'center',gap:11,padding:'10px 10px 11px'}}>
                  <div style={{width:46,height:46,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'1rem',color:'#fff',flexShrink:0}}>{inic(user?.name)}</div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:'.92rem',fontWeight:700,color:'#e2e8f0',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user?.name}</div>
                    <div style={{fontSize:'.68rem',color:'#64748b',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user?.email}</div>
                    <div style={{display:'flex',gap:5,marginTop:5,flexWrap:'wrap'}}>
                      <span style={{fontSize:'.6rem',color:'#a5b4fc',background:'rgba(139,92,246,.16)',borderRadius:20,padding:'2px 9px',fontWeight:700}}>{esAdmin?'🛡️ Administrador':'Aula '+(user?.englishLevel||'')}</span>
                      <span style={{fontSize:'.6rem',color:'#fbbf24',background:'rgba(245,158,11,.14)',borderRadius:20,padding:'2px 9px',fontWeight:700}}>{xp} XP</span>
                    </div>
                  </div>
                </div>
                <div style={{height:1,background:'rgba(255,255,255,.07)',margin:'2px 8px 6px'}}/>
                <MenuItem icon="👤" label="Ver / editar mi perfil" onClick={abrirPerfil}/>
                {esAdmin && <MenuItem icon="🛡️" label="Panel de administrador" onClick={()=>{ setUserMenu2(false); setScreen2('admin'); }}/>}
                <div style={{height:1,background:'rgba(255,255,255,.07)',margin:'6px 6px'}}/>
                <MenuItem icon="🚪" label="Cerrar sesión" danger onClick={()=>{ setUserMenu2(false); logout(); }}/>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPerfil2 && (
        <div onClick={()=>setShowPerfil2(false)} style={{position:'fixed',inset:0,zIndex:3000,background:'rgba(2,6,23,.82)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,overflowY:'auto'}}>
          <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:440,background:'linear-gradient(180deg,rgba(20,24,40,.99),rgba(13,17,28,.99))',border:'1px solid rgba(139,92,246,.3)',borderRadius:22,padding:'1.6rem',boxShadow:'0 30px 80px rgba(0,0,0,.7)',position:'relative',maxHeight:'92vh',overflowY:'auto',boxSizing:'border-box'}}>
            <button onClick={()=>setShowPerfil2(false)} style={{position:'absolute',top:14,right:14,background:'none',border:'none',color:'#64748b',fontSize:'1.1rem',cursor:'pointer'}}>✕</button>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',marginBottom:16}}>
              <div style={{width:76,height:76,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'1.7rem',color:'#fff',boxShadow:'0 8px 24px rgba(139,92,246,.4)'}}>{inic(user?.name)}</div>
              <div style={{fontSize:'1.2rem',fontWeight:800,color:'#f1f5f9',marginTop:12}}>{user?.name}</div>
              <div style={{marginTop:6,display:'inline-flex',alignItems:'center',gap:6,background:'rgba(99,102,241,.14)',border:'1px solid rgba(99,102,241,.4)',color:'#a5b4fc',fontSize:'.72rem',fontWeight:700,padding:'4px 12px',borderRadius:50}}>{esAdmin?'🛡️ Administrador':('🎓 Aula '+user?.englishLevel+' — '+(NIVEL_NOMBRE[user?.englishLevel]||''))}</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              {[['⭐',(user?.experiencePoints||0)+' XP','Experiencia'],['🗣️',(user?.wordsCorrect||0),'Palabras correctas'],['🏆',(user?.nivelesAprobados||[]).length,'Niveles aprobados'],['📅',user?.createdAt?new Date(user.createdAt).toLocaleDateString('es-CO',{month:'short',year:'numeric'}):'—','Miembro desde']].map(([ic,val,lbl])=>(
                <div key={lbl} style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(139,92,246,.15)',borderRadius:12,padding:'12px'}}>
                  <div style={{fontSize:'1.05rem'}}>{ic}</div>
                  <div style={{fontSize:'1.02rem',fontWeight:800,color:'#e2e8f0',marginTop:2}}>{val}</div>
                  <div style={{fontSize:'.64rem',color:'#64748b'}}>{lbl}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:'.7rem',fontWeight:800,color:'#a5b4fc',letterSpacing:'.05em',marginBottom:10}}>✏️ EDITAR MI INFORMACIÓN</div>
            {[['Nombre completo','name','text','Tu nombre'],['Correo electrónico','email','email','tucorreo@ejemplo.com']].map(([lbl,key,type,ph])=>(
              <div key={key} style={{marginBottom:10}}>
                <label style={{fontSize:'.68rem',color:'#64748b',display:'block',marginBottom:4}}>{lbl}</label>
                <input type={type} value={perfilForm[key]} onChange={e=>setPerfilForm(f=>({...f,[key]:e.target.value}))} placeholder={ph} disabled={esAdmin&&key==='email'}
                  style={{width:'100%',boxSizing:'border-box',background:'#0a0e1a',border:'1px solid rgba(139,92,246,.3)',borderRadius:10,color:'#e2e8f0',padding:'10px 12px',fontSize:'.85rem',outline:'none',opacity:(esAdmin&&key==='email')?0.5:1}}/>
              </div>
            ))}
            <div style={{fontSize:'.66rem',color:'#475569',margin:'12px 0 8px'}}>Cambiar contraseña (opcional)</div>
            {[['Contraseña actual','currentPassword','Solo si vas a cambiarla'],['Nueva contraseña','newPassword','Mínimo 8 caracteres']].map(([lbl,key,ph])=>(
              <div key={key} style={{marginBottom:10}}>
                <input type="password" value={perfilForm[key]} onChange={e=>setPerfilForm(f=>({...f,[key]:e.target.value}))} placeholder={ph}
                  style={{width:'100%',boxSizing:'border-box',background:'#0a0e1a',border:'1px solid rgba(139,92,246,.2)',borderRadius:10,color:'#e2e8f0',padding:'10px 12px',fontSize:'.85rem',outline:'none'}}/>
              </div>
            ))}
            {perfilMsg.txt && <div style={{fontSize:'.78rem',fontWeight:600,color:perfilMsg.tipo==='ok'?'#34d399':'#f87171',margin:'6px 0 10px'}}>{perfilMsg.txt}</div>}
            <button onClick={guardarPerfil} disabled={perfilSaving} style={{width:'100%',background:perfilSaving?'#334155':'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',padding:'12px',borderRadius:12,fontWeight:700,fontSize:'.9rem',cursor:perfilSaving?'default':'pointer',marginTop:4}}>{perfilSaving?'Guardando…':'💾 Guardar cambios'}</button>
          </div>
        </div>
      )}

      <div style={{padding:'1.2rem 1.5rem',transition:'filter .4s,opacity .4s',filter:cloudOpen?'blur(3px)':'none',opacity:cloudOpen?0.35:1,pointerEvents:cloudOpen?'none':'all'}}>
        <div style={{fontSize:'.7rem',color:'#475569',marginBottom:'.6rem'}}>Cursos / <span style={{color:'#6366f1'}}>Ingles {nivel}</span></div>
        {lvlUp&&<div style={{background:'rgba(234,179,8,.15)',border:'1px solid #eab308',color:'#fde047',textAlign:'center',fontWeight:700,fontSize:16,borderRadius:12,padding:14,marginBottom:16}}>Subiste al nivel {user?.englishLevel}!</div>}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
          <h1 style={{fontSize:'1.3rem',fontWeight:900}}>Ingles <span style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{nivel}</span> — Tus temas</h1>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'.95rem',fontWeight:800,color:'#a5b4fc'}}>{pctNivel}% del nivel</div>
            <div style={{fontSize:'.7rem',color:'#64748b'}}>{temasHechosNivel}/{temasTotalesNivel} temas · {palabrasHechasNivel}/{palabrasTotalesNivel} palabras · {xp} XP</div>
          </div>
        </div>
        <div style={{width:'100%',background:'#1e293b',height:10,borderRadius:8,overflow:'hidden',marginBottom:'1rem',position:'relative',boxShadow:'inset 0 1px 3px rgba(0,0,0,.4)'}}>
          <div style={{width:pctNivel+'%',background:'linear-gradient(90deg,#6366f1,#06b6d4,#10b981)',height:'100%',borderRadius:8,transition:'width .5s ease',boxShadow:'0 0 12px rgba(99,102,241,.5)'}}/>
        </div>

        {/* ── Diagnóstico + Trial (lado a lado, mismo tamaño) ──────────── */}
        <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'stretch',marginBottom:'1rem'}}>

          {/* Diagnóstico: aviso pendiente o botón de resultados */}
          {user && !user.diagnostico && (
            <div style={{flex:'1 1 320px',background:'linear-gradient(135deg,rgba(139,92,246,.16),rgba(99,102,241,.1))',border:'1px solid rgba(139,92,246,.45)',borderRadius:14,padding:'14px 18px',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap',boxShadow:'0 0 24px rgba(139,92,246,.12)'}}>
              <span style={{fontSize:'1.7rem'}}>🎓</span>
              <div style={{flex:1,minWidth:150}}>
                <div style={{color:'#c4b5fd',fontWeight:800,fontSize:'.92rem'}}>Aún te falta tu test de diagnóstico</div>
                <div style={{color:'#94a3b8',fontSize:'.78rem',marginTop:2}}>Es necesario para conocer tu nivel de inglés y saber qué mejorar. Empezarás siempre en el Aula 1.</div>
              </div>
              <button onClick={()=>setScreen('placement')}
                style={{background:'linear-gradient(135deg,#8b5cf6,#6366f1)',color:'#fff',border:'none',borderRadius:9,padding:'10px 22px',fontSize:'.84rem',fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',fontFamily:"'Poppins',sans-serif",boxShadow:'0 4px 16px rgba(139,92,246,.35)'}}>
                Hacer test ahora →
              </button>
            </div>
          )}
          {user?.diagnostico && (
            <button onClick={()=>setShowDiag(true)}
              style={{flex:'1 1 320px',display:'flex',alignItems:'center',gap:10,background:'linear-gradient(135deg,rgba(139,92,246,.12),rgba(99,102,241,.08))',border:'1px solid rgba(139,92,246,.28)',borderRadius:14,padding:'14px 18px',cursor:'pointer',color:'#c4b5fd',fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:'.82rem',transition:'background .2s'}}
              onMouseEnter={e=>e.currentTarget.style.background='linear-gradient(135deg,rgba(139,92,246,.2),rgba(99,102,241,.14))'}
              onMouseLeave={e=>e.currentTarget.style.background='linear-gradient(135deg,rgba(139,92,246,.12),rgba(99,102,241,.08))'}>
              <span style={{fontSize:'1.1rem'}}>📊</span>
              <span style={{flex:1,textAlign:'left'}}>Resultados de mi diagnóstico</span>
              <span style={{color:'#8b5cf6',fontSize:'1rem'}}>→</span>
            </button>
          )}

          {/* Trial */}
          {!isPremium && !esAdmin && (trialInfo.expired ? (
            <div style={{flex:'1 1 320px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.3)',borderRadius:14,padding:'14px 18px',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
              <span style={{fontSize:'1.5rem'}}>⛔</span>
              <div style={{flex:1,minWidth:150}}>
                <div style={{color:'#f87171',fontWeight:700,fontSize:'.9rem'}}>Tu período de prueba gratuita terminó</div>
                <div style={{color:'#94a3b8',fontSize:'.78rem',marginTop:2}}>Puedes explorar el contenido, pero no avanzar ni ganar XP. Contáctanos para continuar aprendiendo.</div>
              </div>
              <a href="mailto:adcerezov@tecmd.edu.co?subject=Quiero continuar en AulaQuest" style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:9,padding:'8px 18px',fontSize:'.8rem',fontWeight:700,cursor:'pointer',textDecoration:'none',whiteSpace:'nowrap'}}>
                Contactar para continuar
              </a>
            </div>
          ) : trialInfo.daysLeft !== null && (
            <div style={{flex:'1 1 320px',background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.25)',borderRadius:14,padding:'14px 18px',display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:'1.4rem'}}>⏳</span>
              <div style={{flex:1}}>
                <div style={{color:'#fbbf24',fontWeight:700,fontSize:'.85rem'}}>
                  {trialInfo.daysLeft === 1 ? 'Te queda 1 día de prueba gratuita' : `Te quedan ${trialInfo.daysLeft} días de prueba gratuita`}
                </div>
                <div style={{color:'#64748b',fontSize:'.75rem',marginTop:2}}>Contáctanos para continuar</div>
              </div>
            </div>
          ))}

        </div>

          {(()=>{
            // Panal responsive: menos columnas y hexágonos más pequeños en tablet/móvil
            const bigCols = vw < 480 ? 3 : vw < 760 ? 4 : 5;
            const smallCols = bigCols - 1;
            let hexW = Math.floor(Math.min(vw - 14, 900) / bigCols);
            hexW = Math.max(92, Math.min(174, hexW));
            const hexH = Math.round(hexW * 1.105);
            const overlap = Math.round(hexH * 0.253);
            const emojiRem = Math.max(1.4,  hexW / 74);
            const titleRem = Math.max(0.66, hexW / 210);
            const progRem  = Math.max(0.56, hexW / 260);
            const titlePad = Math.round(hexW * 0.13);
            const filas=[]; let _i=0,_w=bigCols;
            while(_i<TOPICS.length){ filas.push(TOPICS.slice(_i,_i+_w)); _i+=_w; _w=_w===bigCols?smallCols:bigCols; }
            return (
            <div style={{marginBottom:'1rem'}}>
            {filas.map((fila,_fi)=>(
              <div key={_fi} style={{display:'flex',justifyContent:'center',flexWrap:'nowrap',marginTop:_fi===0?0:-overlap}}>
              {fila.map((t)=>{
                const idx       = TOPICS.indexOf(t);
                const prog      = progTemas[t.id] || {};
                const completo  = prog.completo || false;
                const completadas = prog.completadas || 0;
                const total     = prog.total || (vocabData[t.id]||[]).length || 0;
                const desbloqBase = esAdmin ? true : (idx === 0 ? true : (progTemas[TOPICS[idx-1]?.id]?.completo || false));
                const esTemaDelDia = dailyTopicId === t.id;
                const hayTemaDelDia = dailyTopicId !== '';
                const bloqueadoDiario = !isPremium && !esAdmin && desbloqBase && !completo && hayTemaDelDia && !esTemaDelDia;
                const desbloq   = desbloqBase && !bloqueadoDiario;
                const activo    = tema?.id===t.id;
                return (
                  <div key={t.id}
                    onClick={()=>{
                      if (!desbloqBase) { setBubble('🔒 Completa el tema anterior primero para desbloquear este.'); setBubbleType('err'); return; }
                      if (bloqueadoDiario) { setShowDailyModal(true); return; }
                      setTema(activo?null:t); usedWordsRef.current=[]; setWord(null);
                      if (!activo) openCloud(t);
                    }}
                    style={{width:hexW,height:hexH,flex:'0 0 auto',margin:'0 -1px',position:'relative',cursor:desbloq?'pointer':'not-allowed',transition:'transform .22s ease,filter .22s ease',willChange:'transform,filter'}}
                    onMouseEnter={e=>{ if(desbloq){ const g=completo?'16,185,129':activo?'139,92,246':'99,102,241'; e.currentTarget.style.zIndex='9'; e.currentTarget.style.transform='scale(1.09) translateY(-3px)'; e.currentTarget.style.filter=`brightness(1.12) drop-shadow(0 12px 24px rgba(${g},.65))`; } }}
                    onMouseLeave={e=>{ e.currentTarget.style.zIndex=''; e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.filter='none'; }}>
                    <div style={{width:'100%',height:'100%',clipPath:'polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:completo?'linear-gradient(160deg,rgba(16,185,129,.2),rgba(16,185,129,.07))':activo?'linear-gradient(160deg,rgba(139,92,246,.32),rgba(99,102,241,.18))':desbloq?'linear-gradient(160deg,#1e2a44,#141c2e)':'#0e1420',opacity:desbloq?1:0.5,position:'relative'}}>
                    {completo && <span style={{position:'absolute',top:'19%',right:'30%',fontSize:'.75rem',color:'#34d399',fontWeight:700}}>✓</span>}
                    {!desbloqBase && <span style={{position:'absolute',top:'19%',right:'28%',fontSize:'.78rem'}}>🔒</span>}
                    {bloqueadoDiario && <span style={{position:'absolute',top:'19%',right:'28%',fontSize:'.78rem'}} title="Límite diario">🌙</span>}
                    <div style={{fontSize:emojiRem+'rem',lineHeight:1}}>{t.icon}</div>
                    <div style={{fontSize:titleRem+'rem',color:completo?'#6ee7b7':activo?'#c4b5fd':desbloq?'#e8eef7':'#475569',fontWeight:activo||completo?600:500,marginTop:Math.round(hexW*0.05),textAlign:'center',padding:'0 '+titlePad+'px',lineHeight:1.2,letterSpacing:'.01em'}}>{t.name}</div>
                    {desbloq && total>0 && <div style={{fontSize:progRem+'rem',color:'#7c8aa3',marginTop:3,fontWeight:500}}>{completadas}/{total}</div>}
                    </div>
                  </div>
                );
              })}
              </div>
            ))}
            </div>
            );
          })()}
        {tema&&(
          <div style={{background:'#0f172a',border:'1px solid rgba(99,102,241,.2)',borderRadius:14,padding:'1.2rem',marginBottom:'1rem'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.8rem'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:'1.2rem'}}>{tema.icon}</span>
                <div>
                  <div style={{fontSize:'.85rem',fontWeight:700,color:'#e2e8f0'}}>{tema.name}</div>
                  <div style={{fontSize:'.65rem',color:'#64748b'}}>{(progTemas[tema.id]?.completadas||0)}/{(vocabData[tema.id]||[]).length} palabras completadas</div>
                </div>
              </div>
              <button onClick={()=>setTema(null)} style={{background:'none',border:'none',color:'#475569',cursor:'pointer',fontSize:'.85rem'}}>✕</button>
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:'1rem'}}>
              {(vocabData[tema.id]||[]).map((w,i)=>{
                const done = (progTemas[tema.id]?.palabrasCompletadas||[]).includes(w.en);
                return (
                <span key={i} style={{background:done?'rgba(16,185,129,.1)':'rgba(99,102,241,.1)',border:'1px solid '+(done?'rgba(16,185,129,.3)':'rgba(99,102,241,.2)'),borderRadius:8,padding:'3px 10px',fontSize:'.72rem',color:done?'#10b981':'#a5b4fc'}}>
                  {done?'✓ ':''}{w.en} <span style={{color:'#475569'}}>= {w.es}</span>
                </span>
              );
              })}
            </div>
            {temaEjemplos.length > 0 && (
              <div style={{background:'rgba(99,102,241,.06)',border:'1px solid rgba(99,102,241,.2)',borderRadius:10,padding:'.8rem',marginBottom:'.8rem'}}>
                <div style={{fontSize:'.72rem',fontWeight:800,color:'#a5b4fc',letterSpacing:'.04em',marginBottom:8}}>💬 CÓMO USAR LO APRENDIDO — {temaEjemplos.length} frases de ejemplo</div>
                <div style={{display:'flex',flexDirection:'column',gap:9,maxHeight:240,overflowY:'auto'}}>
                  {temaEjemplos.map((ej,i)=>(
                    <div key={i} style={{borderLeft:'2px solid rgba(99,102,241,.4)',paddingLeft:10}}>
                      <div style={{fontSize:'.62rem',color:'#6366f1',fontWeight:700}}>{ej.en}</div>
                      <div style={{fontSize:'.8rem',color:'#e2e8f0',fontWeight:600}}>
                        {ej.frase}
                        <button onClick={()=>alexSpeak(ej.frase,0.88)} title="Escuchar" style={{background:'none',border:'none',cursor:'pointer',fontSize:'.82rem',marginLeft:5}}>🔊</button>
                      </div>
                      <div style={{fontSize:'.68rem',color:'#64748b'}}>{ej.fraseEs}</div>
                      {ej.explicacion && <div style={{fontSize:'.66rem',color:'#f59e0b',marginTop:2}}>📘 {ej.explicacion}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.25)',borderRadius:10,padding:'.8rem',marginBottom:'.8rem'}}>
              <div style={{fontSize:'.72rem',fontWeight:700,color:'#f59e0b',marginBottom:2}}>RETO DEL TEMA</div>
              <div style={{fontSize:'.78rem',color:'#e2e8f0'}}>Pronuncia correctamente <strong>{(vocabData[tema.id]||[]).length} palabras</strong> de {tema.name}</div>
              <div style={{fontSize:'.65rem',color:'#64748b',marginTop:3}}>Completadas: {progTemas[tema.id]?.completadas||0} / {(vocabData[tema.id]||[]).length} · Recompensa: +{(vocabData[tema.id]||[]).length * 10} XP</div>
            </div>
            <button onClick={()=>openCloud(tema)} style={{width:'100%',border:'none',padding:'10px',borderRadius:10,fontWeight:700,fontSize:'.82rem',cursor:'pointer',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              <span>🎤</span> Practicar {tema.name} con Mr. Alex
            </button>
          </div>
        )}
        {nivel === 'C2' && (
        <div id="c2-entrevistas" style={{background: interviewLocked ? 'linear-gradient(135deg,rgba(99,102,241,.06),rgba(139,92,246,.08))' : 'linear-gradient(135deg,rgba(16,185,129,.1),rgba(6,182,212,.08))',border:'1px solid '+(interviewLocked?'rgba(99,102,241,.2)':'rgba(16,185,129,.35)'),borderRadius:16,padding:'1.1rem 1.3rem',marginBottom:'1rem',boxShadow:'0 10px 30px rgba(0,0,0,.45)',transition:'all .3s'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
            <span style={{fontSize:'1.1rem'}}>💼</span>
            <span style={{fontSize:'.88rem',fontWeight:700,color:'#e2e8f0'}}>Entrevista de Trabajo con IA</span>
            <span style={{background: interviewLocked ? 'rgba(99,102,241,.15)' : 'rgba(16,185,129,.18)',color: interviewLocked ? '#a5b4fc' : '#34d399',fontSize:'.6rem',fontWeight:700,padding:'2px 7px',borderRadius:50}}>{interviewLocked ? 'RETO FINAL C2' : '✅ DESBLOQUEADA'}</span>
          </div>
          <p style={{color:'#64748b',fontSize:'.75rem',margin:'0 0 12px'}}>{interviewLocked ? 'Aprueba el examen final C2 para desbloquear las entrevistas con IA en tiempo real.' : '¡Aprobaste el examen C2! Elige a tu entrevistador y practica en inglés con feedback en tiempo real.'}</p>

          {(()=>{
            const ENTREVISTADORES=[
              { id:'interview', nombre:'AI Teacher', sub:'Voz · Gemini', emoji:'🌊', grad:'linear-gradient(135deg,#3b82f6,#8b5cf6,#f43f5e)', accent:'99,102,241' },
              { id:'nexa',      nombre:'NEXA',       sub:'Avatar 3D · Asistente IA', emoji:'🤖', grad:'linear-gradient(135deg,#6fe0ff,#3aa8e8,#b07aff)', accent:'58,168,232' },
              { id:'michael',   nombre:'Michael',    sub:'Avatar 3D · HR Coach', emoji:'👨‍🏫', grad:'linear-gradient(135deg,#d9a07c,#9ec4ee,#35495e)', accent:'158,196,238' },
            ];
            return (
              <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
                {ENTREVISTADORES.map(e=>(
                  <div key={e.id} onClick={()=>{ if(interviewLocked){ setInterviewReqState(''); setShowInterviewModal(true); } else { setScreen2(e.id); } }}
                    onMouseEnter={ev=>{ev.currentTarget.style.transform='translateY(-6px)';ev.currentTarget.style.boxShadow=`0 16px 40px rgba(${e.accent},.4)`;}}
                    onMouseLeave={ev=>{ev.currentTarget.style.transform='translateY(0)';ev.currentTarget.style.boxShadow='0 8px 20px rgba(0,0,0,.4)';}}
                    style={{flex:'1 1 200px',minWidth:0,cursor:'pointer',borderRadius:16,overflow:'hidden',border:`1px solid rgba(${e.accent},.3)`,background:'rgba(15,23,42,.6)',boxShadow:'0 8px 20px rgba(0,0,0,.4)',transition:'transform .25s ease, box-shadow .25s ease'}}>
                    <div style={{height:130,background:e.grad,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
                      <span style={{fontSize:'3.4rem',filter:interviewLocked?'drop-shadow(0 4px 12px rgba(0,0,0,.5)) grayscale(.6)':'drop-shadow(0 4px 12px rgba(0,0,0,.5))',opacity:interviewLocked?0.6:1}}>{e.emoji}</span>
                      <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 50% 120%,rgba(255,255,255,.25),transparent 60%)'}}/>
                      {interviewLocked && <div style={{position:'absolute',inset:0,background:'rgba(2,6,23,.45)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2.2rem'}}>🔒</div>}
                      <span style={{position:'absolute',top:10,right:10,background:'rgba(0,0,0,.35)',backdropFilter:'blur(4px)',color:'#fff',fontSize:'.58rem',fontWeight:700,padding:'3px 8px',borderRadius:50}}>{interviewLocked?'🔒 BLOQUEADO':'ELEGIR ▶'}</span>
                    </div>
                    <div style={{padding:'12px 14px'}}>
                      <div style={{fontSize:'.98rem',fontWeight:800,color:'#f1f5f9'}}>{e.nombre}</div>
                      <div style={{fontSize:'.68rem',color:'#64748b'}}>{e.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
        )}

        <div style={{display:'flex',gap:'1rem',alignItems:'stretch',marginBottom:'1rem',flexWrap:'wrap',justifyContent:'center'}}>
        <div style={{flex:'1 1 280px',display:'flex',flexDirection:'column',gap:'1rem'}}>
        {nivel === 'A1' && (()=>{
          const temasCompletados = TOPICS.filter(t => progTemas[t.id]?.completo).length;
          const juegoDesbloqueado = esAdmin || (temasCompletados >= 3);
          const temasRestantes = Math.max(0, 3 - temasCompletados);
          return (
            <div onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-6px)';e.currentTarget.style.boxShadow='0 18px 40px rgba(6,182,212,.25)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 10px 30px rgba(0,0,0,.45)';}} style={{background: juegoDesbloqueado ? 'linear-gradient(135deg,rgba(6,182,212,.08),rgba(99,102,241,.06))' : 'rgba(15,23,42,.5)',border:'1px solid '+(juegoDesbloqueado?'rgba(6,182,212,.25)':'rgba(99,102,241,.08)'),borderRadius:16,padding:'1rem 1.5rem',flex:1,display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem',opacity:juegoDesbloqueado?1:0.7,boxShadow:'0 10px 30px rgba(0,0,0,.45)',transition:'transform .25s ease, box-shadow .25s ease'}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{fontSize:'1.1rem'}}>{juegoDesbloqueado?'⚔️':'🔒'}</span>
                  <span style={{fontSize:'.88rem',fontWeight:700,color:'#e2e8f0'}}>AulaQuest Arena</span>
                  <span style={{background:juegoDesbloqueado?'rgba(6,182,212,.15)':'rgba(245,158,11,.12)',color:juegoDesbloqueado?'#06b6d4':'#f59e0b',fontSize:'.6rem',fontWeight:700,padding:'2px 7px',borderRadius:50}}>
                    {juegoDesbloqueado?'MULTIJUGADOR':'BLOQUEADO'}
                  </span>
                </div>
                <p style={{color:'#64748b',fontSize:'.75rem',margin:'0 0 6px'}}>
                  {juegoDesbloqueado
                    ? 'Quiz en vivo con tus compañeros: crea una sala o entra con un código de 4 dígitos. ¡El más rápido gana!'
                    : 'Completa '+temasRestantes+' tema'+(temasRestantes>1?'s':'')+' más con Mr. Alex para desbloquear la Arena.'}
                </p>
                {!juegoDesbloqueado && (
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:'.68rem',color:'#475569'}}>Progreso</span>
                      <span style={{fontSize:'.68rem',color:'#6366f1',fontWeight:700}}>{temasCompletados} / 3 temas</span>
                    </div>
                    <div style={{height:4,background:'rgba(99,102,241,.08)',borderRadius:10,overflow:'hidden'}}>
                      <div style={{height:'100%',width:(temasCompletados/3*100)+'%',background:'linear-gradient(90deg,#06b6d4,#6366f1)',borderRadius:10,transition:'width .4s'}}/>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={()=>{ if(juegoDesbloqueado) setScreen2('arena'); }}
                style={{flexShrink:0,background:juegoDesbloqueado?'linear-gradient(135deg,#06b6d4,#6366f1)':'rgba(30,41,59,.8)',color:juegoDesbloqueado?'#fff':'#334155',border:juegoDesbloqueado?'none':'1px solid rgba(99,102,241,.1)',padding:'10px 20px',borderRadius:10,fontWeight:700,fontSize:'.82rem',cursor:juegoDesbloqueado?'pointer':'not-allowed',whiteSpace:'nowrap',transition:'all .2s'}}>
                {juegoDesbloqueado?'⚔️ Jugar':'🔒 Bloqueado'}
              </button>
            </div>
          );
        })()}

        {nivel === 'A2' && (()=>{
          const temasCompletados = TOPICS.filter(t => progTemas[t.id]?.completo).length;
          const cityDesbloqueado = esAdmin || (temasCompletados >= 3);
          const cityRestantes = Math.max(0, 3 - temasCompletados);
          return (
            <div onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-6px)';e.currentTarget.style.boxShadow='0 18px 40px rgba(6,182,212,.25)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 10px 30px rgba(0,0,0,.45)';}} style={{background: cityDesbloqueado ? 'linear-gradient(135deg,rgba(6,182,212,.08),rgba(99,102,241,.06))' : 'rgba(15,23,42,.5)',border:'1px solid '+(cityDesbloqueado?'rgba(6,182,212,.25)':'rgba(99,102,241,.08)'),borderRadius:16,padding:'1rem 1.5rem',flex:1,display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem',opacity:cityDesbloqueado?1:0.7,boxShadow:'0 10px 30px rgba(0,0,0,.45)',transition:'transform .25s ease, box-shadow .25s ease'}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{fontSize:'1.1rem'}}>{cityDesbloqueado?'🏙️':'🔒'}</span>
                  <span style={{fontSize:'.88rem',fontWeight:700,color:'#e2e8f0'}}>AulaQuest City</span>
                  <span style={{background:cityDesbloqueado?'rgba(6,182,212,.15)':'rgba(245,158,11,.12)',color:cityDesbloqueado?'#06b6d4':'#f59e0b',fontSize:'.6rem',fontWeight:700,padding:'2px 7px',borderRadius:50}}>
                    {cityDesbloqueado?'COOPERATIVO':'BLOQUEADO'}
                  </span>
                </div>
                <p style={{color:'#64748b',fontSize:'.75rem',margin:'0 0 6px'}}>
                  {cityDesbloqueado
                    ? 'Explora la ciudad con tu equipo: misiones con personajes, diccionario compartido y ayuda entre compañeros.'
                    : 'Completa '+cityRestantes+' tema'+(cityRestantes>1?'s':'')+' más con Mr. Alex para desbloquear la ciudad.'}
                </p>
              </div>
              <button onClick={()=>{ if(cityDesbloqueado) setScreen2('city'); }}
                style={{flexShrink:0,background:cityDesbloqueado?'linear-gradient(135deg,#06b6d4,#6366f1)':'rgba(30,41,59,.8)',color:cityDesbloqueado?'#fff':'#334155',border:cityDesbloqueado?'none':'1px solid rgba(99,102,241,.1)',padding:'10px 20px',borderRadius:10,fontWeight:700,fontSize:'.82rem',cursor:cityDesbloqueado?'pointer':'not-allowed',whiteSpace:'nowrap',transition:'all .2s'}}>
                {cityDesbloqueado?'🏙️ Jugar':'🔒 Bloqueado'}
              </button>
            </div>
          );
        })()}

        {['B1','B2','C1','C2'].includes(nivel) && (()=>{
          const CFG = {
            B1: { nombre:'AulaQuest Files — Detective Cases', icono:'🕵️', accent:'6,182,212',  txt:'#67e8f9', screen:'files',    grad:'linear-gradient(135deg,#06b6d4,#0891b2)', desc:'Resuelve el Caso #7 con tu escuadra: interroga sospechosos en past simple y present perfect, comparte pistas en vivo y descubre al culpable.' },
            B2: { nombre:'AulaQuest Royale — English Battle Royale', icono:'🪂', accent:'6,182,212', txt:'#67e8f9', screen:'royale',   grad:'linear-gradient(135deg,#06b6d4,#0891b2)', desc:'Battle royale de inglés: sobrevive la tormenta en escuadras, abre cofres, gana duelos 1v1 y revive a tu equipo con retos B2 (phrasal verbs, idioms, listening).' },
            C1: { nombre:'AulaQuest Grimoire — C1 Wizard Duels', icono:'📖', accent:'139,92,246',  txt:'#c4b5fd', screen:'grimoire', grad:'linear-gradient(135deg,#8b5cf6,#6d28d9)', desc:'Duelos PvP 1v1 de magos: cada hechizo es un reto C1 (collocations, matices, estructuras, register, acentos). Bloquea, encadena rachas y sube de liga con ELO.' },
            C2: { nombre:'El Tribunal — Duelo de Retórica', icono:'⚖️', accent:'201,162,75',  txt:'#E4C36E', screen:'tribunal', grad:'linear-gradient(135deg,#7C2E2E,#C9A24B)', desc:'Juego de rol oculto: cumple un mandato retórico secreto sin declararlo, engaña al jurado con un bluff o desenmascara al abogado. El Magistrado (IA) dicta veredicto. 2-4 jugadores.' },
          }[nivel];
          const temasCompletados = TOPICS.filter(t => progTemas[t.id]?.completo).length;
          const juegoDesbloqueado = esAdmin || (temasCompletados >= 3);
          const temasRestantes = Math.max(0, 3 - temasCompletados);
          const accent = CFG.accent;
          return (
            <div onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-6px)';e.currentTarget.style.boxShadow=`0 18px 40px rgba(${accent},.3)`;}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 10px 30px rgba(0,0,0,.45)';}} style={{background: juegoDesbloqueado ? `linear-gradient(135deg,rgba(${accent},.08),rgba(${accent},.04))` : 'rgba(15,23,42,.5)',border:'1px solid '+(juegoDesbloqueado?`rgba(${accent},.25)`:'rgba(99,102,241,.08)'),borderRadius:16,padding:'1rem 1.5rem',flex:1,display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem',opacity:juegoDesbloqueado?1:0.7,boxShadow:'0 10px 30px rgba(0,0,0,.45)',transition:'transform .25s ease, box-shadow .25s ease'}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{fontSize:'1.1rem'}}>{juegoDesbloqueado?CFG.icono:'🔒'}</span>
                  <span style={{fontSize:'.88rem',fontWeight:700,color:'#e2e8f0'}}>{CFG.nombre}</span>
                  <span style={{background:juegoDesbloqueado?`rgba(${accent},.15)`:'rgba(245,158,11,.12)',color:juegoDesbloqueado?CFG.txt:'#f59e0b',fontSize:'.6rem',fontWeight:700,padding:'2px 7px',borderRadius:50}}>
                    {juegoDesbloqueado?('MINIJUEGO '+nivel):'BLOQUEADO'}
                  </span>
                </div>
                <p style={{color:'#64748b',fontSize:'.75rem',margin:'0 0 6px'}}>
                  {juegoDesbloqueado
                    ? CFG.desc
                    : 'Completa '+temasRestantes+' tema'+(temasRestantes>1?'s':'')+' más con Mr. Alex para desbloquear este minijuego.'}
                </p>
                {!juegoDesbloqueado && (
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:'.68rem',color:'#475569'}}>Progreso</span>
                      <span style={{fontSize:'.68rem',color:'#6366f1',fontWeight:700}}>{temasCompletados} / 3 temas</span>
                    </div>
                    <div style={{height:4,background:'rgba(99,102,241,.08)',borderRadius:10,overflow:'hidden'}}>
                      <div style={{height:'100%',width:(temasCompletados/3*100)+'%',background:CFG.grad,borderRadius:10,transition:'width .4s'}}/>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={()=>{ if(juegoDesbloqueado) setScreen2(CFG.screen); }}
                style={{flexShrink:0,background:juegoDesbloqueado?CFG.grad:'rgba(30,41,59,.8)',color:juegoDesbloqueado?'#fff':'#334155',border:juegoDesbloqueado?'none':'1px solid rgba(99,102,241,.1)',padding:'10px 20px',borderRadius:10,fontWeight:700,fontSize:'.82rem',cursor:juegoDesbloqueado?'pointer':'not-allowed',whiteSpace:'nowrap',transition:'all .2s'}}>
                {juegoDesbloqueado?'🎮 Jugar':'🔒 Bloqueado'}
              </button>
            </div>
          );
        })()}
        </div>

        <div style={{flex:'0 0 auto',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,cursor:'pointer',padding:'0 .4rem'}} onClick={()=>openCloud(tema||null)}>
          <div style={{position:'relative',width:64,height:64}}>
            {[0,5,10].map((ins,i)=>(
              <div key={i} style={{position:'absolute',top:ins,left:ins,right:ins,bottom:ins,borderRadius:'50%',border:'2px solid transparent',
                ...(i===0?{borderTopColor:'#6366f1',borderRightColor:'#6366f1',animation:'maRot 3s linear infinite'}
                  :i===1?{borderLeftColor:'#06b6d4',borderBottomColor:'#06b6d4',animation:'maRot 5s linear infinite reverse'}
                  :{borderTopColor:'#8b5cf6',animation:'maRot 8s linear infinite'})}}/>
            ))}
            <div style={{position:'absolute',inset:16,borderRadius:'50%',background:'#0a0f1e',border:'1px solid rgba(99,102,241,.5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',boxShadow:'0 0 16px rgba(99,102,241,.35)'}}>🎓</div>
          </div>
          <div style={{fontSize:'.7rem',fontWeight:700,color:'#6366f1',letterSpacing:'.06em'}}>MR. ALEX</div>
          <div style={{fontSize:'.58rem',color:'#475569',textAlign:'center',maxWidth:120}}>{tema?'toca para practicar '+tema.name:'selecciona un tema'}</div>
        </div>

        <div style={{flex:'1 1 280px',display:'flex',flexDirection:'column',gap:'1rem'}}>
        {(()=>{
          const yaAprobado   = (user?.nivelesAprobados || []).includes(nivel);
          const puedeExamen  = (esAdmin || quizHabil) && !yaAprobado;   // el admin siempre tiene acceso
          const temasTotal   = TOPICS.length;
          const temasHechos  = TOPICS.filter(t=>progTemas[t.id]?.completo).length;
          const progExamen   = temasTotal>0 ? Math.round((temasHechos/temasTotal)*100) : 0;

          if (yaAprobado) return (
            <div style={{background:'rgba(16,185,129,.06)',border:'1px solid rgba(16,185,129,.2)',borderRadius:16,padding:'1rem 1.5rem',flex:1,display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:36,height:36,borderRadius:10,background:'rgba(16,185,129,.15)',border:'1px solid rgba(16,185,129,.3)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <span style={{fontSize:'1rem'}}>✅</span>
              </div>
              <div>
                <div style={{fontSize:'.88rem',fontWeight:700,color:'#10b981'}}>Examen {nivel} aprobado</div>
                <div style={{fontSize:'.72rem',color:'#475569'}}>Ya demostraste tu dominio de este nivel. ¡Sigue practicando!</div>
              </div>
            </div>
          );

          return (
            <div onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-6px)';e.currentTarget.style.boxShadow='0 18px 40px rgba(16,185,129,.25)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 10px 30px rgba(0,0,0,.45)';}} style={{background: puedeExamen ? 'linear-gradient(135deg,rgba(16,185,129,.08),rgba(6,182,212,.06))' : 'rgba(15,23,42,.5)',border:`1px solid ${puedeExamen ? 'rgba(16,185,129,.25)' : 'rgba(99,102,241,.12)'}`,borderRadius:16,padding:'1.2rem 1.5rem',flex:1,display:'flex',alignItems:'center',boxShadow:'0 10px 30px rgba(0,0,0,.45)',transition:'transform .25s ease, box-shadow .25s ease'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem',width:'100%'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <div style={{width:32,height:32,borderRadius:8,background: puedeExamen ? 'rgba(16,185,129,.15)' : 'rgba(99,102,241,.08)',border:`1px solid ${puedeExamen ? 'rgba(16,185,129,.3)' : 'rgba(99,102,241,.15)'}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <span style={{fontSize:'.75rem',fontWeight:900,color: puedeExamen ? '#10b981' : '#475569'}}>{puedeExamen ? nivel : '🔒'}</span>
                    </div>
                    <div>
                      <span style={{fontSize:'.88rem',fontWeight:700,color:'#e2e8f0'}}>Examen obligatorio — {nivel} → {nivel==='A1'?'A2':nivel==='A2'?'B1':nivel==='B1'?'B2':nivel==='B2'?'C1':'C2'}</span>
                      <span style={{marginLeft:8,background: puedeExamen ? 'rgba(16,185,129,.15)' : 'rgba(245,158,11,.12)',color: puedeExamen ? '#10b981' : '#f59e0b',fontSize:'.6rem',fontWeight:700,padding:'2px 7px',borderRadius:50}}>
                        {puedeExamen ? 'LISTO PARA PRESENTAR' : 'PRACTICA PRIMERO'}
                      </span>
                    </div>
                  </div>
                  <p style={{color:'#64748b',fontSize:'.75rem',margin:'0 0 8px'}}>
                    {puedeExamen
                      ? `Debes aprobar este examen para avanzar al siguiente nivel. Necesitas 7/10. ¡Tú puedes!`
                      : `Completa todos los temas con Mr. Alex para habilitar el examen. Llevas ${temasHechos} de ${temasTotal} temas completados.`}
                  </p>
                  {!puedeExamen && (
                    <div>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                        <span style={{fontSize:'.68rem',color:'#475569'}}>Progreso de práctica</span>
                        <span style={{fontSize:'.68rem',color:'#6366f1',fontWeight:700}}>{temasHechos} / {temasTotal} temas completados</span>
                      </div>
                      <div style={{height:5,background:'rgba(99,102,241,.08)',borderRadius:10,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${progExamen}%`,background:'linear-gradient(90deg,#6366f1,#8b5cf6)',borderRadius:10,transition:'width .5s'}}/>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={()=>{ if(puedeExamen) setScreen2('quiz'); }}
                  style={{flexShrink:0,background: puedeExamen ? 'linear-gradient(135deg,#10b981,#06b6d4)' : 'rgba(30,41,59,.8)',color: puedeExamen ? '#fff' : '#334155',border: puedeExamen ? 'none' : '1px solid rgba(99,102,241,.1)',padding:'10px 20px',borderRadius:10,fontWeight:700,fontSize:'.82rem',cursor: puedeExamen ? 'pointer' : 'not-allowed',whiteSpace:'nowrap',boxShadow: puedeExamen ? '0 0 20px rgba(16,185,129,.2)' : 'none',transition:'all .2s'}}>
                  {puedeExamen ? '🎓 Presentar examen' : '🔒 Bloqueado'}
                </button>
              </div>
            </div>
          );
        })()}
        </div>
        </div>


      </div>

      <div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(2,6,23,.85)',opacity:cloudOpen?1:0,pointerEvents:cloudOpen?'all':'none',transition:'opacity .3s',display:'flex',alignItems:'center',justifyContent:'center',padding:'12px'}}>
        <div style={{background:'#0a0f1e',borderRadius:20,border:'1px solid rgba(99,102,241,.3)',padding:'clamp(1rem,4vw,1.8rem) clamp(.9rem,4vw,1.8rem)',width:'100%',maxWidth:'min(600px, 96vw)',maxHeight:'92vh',overflowY:'auto',boxSizing:'border-box',transform:cloudOpen?'translateY(0)':'translateY(30px)',transition:'transform .4s cubic-bezier(.22,.61,.36,1)',position:'relative',boxShadow:'0 0 60px rgba(99,102,241,.25)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.2rem',flexWrap:'wrap',gap:8}}>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              <span style={{fontSize:'.8rem',fontWeight:700,color:'#6366f1',letterSpacing:'.08em'}}>MR. ALEX</span>
              {tema&&<span style={{background:'rgba(99,102,241,.15)',color:'#a5b4fc',padding:'2px 8px',borderRadius:50,fontSize:'.62rem',fontWeight:700}}>{tema.name}</span>}
              <span style={{background:'rgba(16,185,129,.15)',color:'#10b981',padding:'2px 8px',borderRadius:50,fontSize:'.62rem',fontWeight:700}}>EN VIVO</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              {correct>=3&&<span style={{fontSize:'.75rem',fontWeight:700,color:'#f59e0b'}}>Racha {correct}</span>}
              {!energy.ilimitado && <span title="Energía: pierdes 1 token al equivocarte" style={{fontSize:'.72rem',fontWeight:700,color: energy.tokens<=1?'#ef4444':'#f59e0b',whiteSpace:'nowrap'}}>⚡ {energy.tokens}/{energy.max}</span>}
              <span style={{fontSize:'.72rem',color:'#64748b'}}>{totalXP} XP</span>
              <button onClick={closeCloud} style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.25)',color:'#ef4444',width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:12}}>✕</button>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:'1.5rem'}}>
            <MrAlexOrb size={160} state={orbState}/>
            <div style={{fontSize:'.65rem',color:'#64748b',marginTop:8}}>
              {orbState==='idle'?'listo':orbState==='listening'?'escuchando...':orbState==='speaking'?'hablando...':'procesando...'}
            </div>
            <div style={{background:bubbleType==='ok'?'rgba(16,185,129,.1)':bubbleType==='err'?'rgba(239,68,68,.1)':'rgba(99,102,241,.08)',border:'1px solid '+(bubbleType==='ok'?'#10b981':bubbleType==='err'?'#ef4444':'rgba(99,102,241,.25)'),borderRadius:14,padding:'10px 16px',fontSize:'.8rem',color:bubbleType==='ok'?'#34d399':bubbleType==='err'?'#f87171':'#e2e8f0',maxWidth:340,textAlign:'center',marginTop:10,lineHeight:1.5}}>
              {bubbleType==='ok'&&'🎉 '}{bubble}
            </div>
          </div>
          {word?(
            <div style={{background:'#020617',border:'1px solid rgba(99,102,241,.2)',borderRadius:14,padding:'1.2rem',textAlign:'center',marginBottom:'1rem'}}>
              <div style={{fontSize:'2.4rem',fontWeight:900,letterSpacing:3}}>{word.en}</div>
              <div style={{color:'#6366f1',fontSize:'.9rem',fontStyle:'italic',marginTop:4}}>{word.es}</div>
              <div style={{display:'flex',gap:8,marginTop:8,justifyContent:'center'}}>
                <button onClick={()=>alexSpeakBilingual(word.en, word.es, window._alexToken||token, null)}
                  style={{background:'none',border:'1px solid rgba(99,102,241,.2)',color:'#64748b',cursor:'pointer',fontSize:'.72rem',padding:'4px 10px',borderRadius:8}}>
                  🔊 Normal
                </button>
                <button onClick={async()=>{
                  if(_currentAudio){_currentAudio.pause();_currentAudio=null;}
                  window.speechSynthesis&&window.speechSynthesis.cancel();
                  const tok=window._alexToken||token||'';
                  try {
                    const r=await fetch(API+'/api/tts/speak-slow',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},body:JSON.stringify({text:word.en})});
                    if(r.ok){const blob=await r.blob();const url=URL.createObjectURL(blob);const a=new Audio(url);_currentAudio=a;a.play();}
                    else throw new Error();
                  } catch {
                    const u=new SpeechSynthesisUtterance(word.en);u.lang='en-US';u.rate=0.35;u.pitch=1.0;window.speechSynthesis&&window.speechSynthesis.speak(u);
                  }
                }} style={{background:'none',border:'1px solid rgba(99,102,241,.2)',color:'#64748b',cursor:'pointer',fontSize:'.72rem',padding:'4px 10px',borderRadius:8}}>
                  🐢 Despacio
                </button>
              </div>
              {ejemplo && (
                <div style={{marginTop:12,background:'rgba(99,102,241,.07)',border:'1px solid rgba(99,102,241,.22)',borderRadius:12,padding:'10px 14px',textAlign:'left'}}>
                  <div style={{fontSize:'.6rem',fontWeight:800,color:'#a5b4fc',letterSpacing:'.07em',marginBottom:5}}>💬 ASÍ SE USA EN UNA CONVERSACIÓN</div>
                  <div style={{fontSize:'.92rem',fontWeight:700,color:'#e2e8f0'}}>
                    {ejemplo.frase}
                    <button onClick={()=>alexSpeak(ejemplo.frase, 0.88)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'.9rem',marginLeft:6}}>🔊</button>
                  </div>
                  <div style={{fontSize:'.72rem',color:'#94a3b8',marginTop:2}}>{ejemplo.fraseEs}</div>
                  {ejemplo.explicacion && (
                    <div style={{fontSize:'.72rem',color:'#fbbf24',marginTop:7,lineHeight:1.45}}>
                      📘 {ejemplo.explicacion}
                      <button onClick={()=>alexSpeak(ejemplo.explicacion, 0.98, null, 'es')} style={{background:'none',border:'none',cursor:'pointer',fontSize:'.85rem',marginLeft:5}}>🔊</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ):(
            <div style={{background:'#020617',border:'1px dashed rgba(99,102,241,.2)',borderRadius:14,padding:'1.5rem',textAlign:'center',marginBottom:'1rem',color:'#334155',fontSize:'.85rem'}}>Toca "Nueva palabra" para comenzar</div>
          )}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <button onClick={()=>{ setFraseReto(null); getWord(); }} style={{border:'none',padding:'12px',borderRadius:12,fontWeight:700,fontSize:'.82rem',cursor:'pointer',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff'}}>Nueva palabra</button>
            <button onClick={startListen} disabled={!word||listening}
              style={{border:'none',padding:'12px',borderRadius:12,fontWeight:700,fontSize:'.82rem',cursor:(!word||listening)?'not-allowed':'pointer',background:listening?'#eab308':'#10b981',color:listening?'#0f172a':'#fff',opacity:!word?0.4:1,animation:listening?'pulseBtn 1s ease-in-out infinite':'none'}}>
              {listening?'Escuchando...':'Pronunciar'}
            </button>
          </div>

          {/* Reto: completa la frase (usar lo aprendido). Gasta token al fallar. */}
          {fraseReto && (
            <div style={{marginTop:'1rem',background:'rgba(139,92,246,.08)',border:'1px solid rgba(139,92,246,.3)',borderRadius:14,padding:'1rem'}}>
              <div style={{fontSize:'.62rem',fontWeight:800,color:'#c4b5fd',letterSpacing:'.06em',marginBottom:6}}>🧩 COMPLETA LA FRASE — ¿cómo la usas?</div>
              <div style={{fontSize:'1rem',fontWeight:700,color:'#e2e8f0',textAlign:'center',margin:'6px 0'}}>{fraseReto.prompt}</div>
              {fraseReto.promptEs && <div style={{fontSize:'.72rem',color:'#64748b',textAlign:'center',marginBottom:8}}>{fraseReto.promptEs}</div>}
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {fraseReto.opts.map((o,i)=>(
                  <button key={i} onClick={async()=>{
                    if (i === fraseReto.ans) {
                      const w = fraseReto.word; setFraseReto(null);
                      setBubble('✅ ¡Muy bien! Así se usa "'+w.en+'".'); setBubbleType('ok'); setOrbState('speaking');
                      alexSpeak('Excellent! That is how you use it.', 0.9, ()=>{ setOrbState('idle'); setTimeout(()=>getWord(), 300); }, null, ()=>setOrbState('speaking'));
                    } else {
                      gastarToken();   // cuenta el intento, pero NUNCA bloquea (siempre puede reintentar o saltar)
                      setOrbState('speaking'); setBubble('🔁 Casi. Escucha con calma por qué no es esa.'); setBubbleType('err');
                      alexSpeak('Not quite. Let me explain, stay calm.', 0.92, ()=>{
                        if (fraseReto && fraseReto.explic) alexSpeak(fraseReto.explic, 0.98, ()=>{ setOrbState('idle'); setBubble('🧩 Inténtalo otra vez, o toca "Saltar" para seguir.'); }, 'es', ()=>setOrbState('speaking'));
                        else { setOrbState('idle'); setBubble('🧩 Inténtalo otra vez, o toca "Saltar" para seguir.'); }
                      }, null, ()=>setOrbState('speaking'));
                    }
                  }} style={{border:'1px solid rgba(139,92,246,.35)',background:'rgba(20,15,40,.6)',color:'#e2e8f0',padding:'11px 14px',borderRadius:10,fontWeight:600,fontSize:'.85rem',cursor:'pointer',textAlign:'left'}}>{o}</button>
                ))}
              </div>
              <button onClick={()=>{ setFraseReto(null); setBubble('👉 Siguiente palabra'); setBubbleType(''); setOrbState('idle'); setTimeout(()=>getWord(), 150); }}
                style={{marginTop:10,width:'100%',background:'transparent',border:'1px solid rgba(148,163,184,.3)',color:'#94a3b8',padding:'9px',borderRadius:10,fontWeight:600,fontSize:'.78rem',cursor:'pointer'}}>Saltar ⏭ (siguiente palabra)</button>
            </div>
          )}
          <div style={{marginTop:'1rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'.65rem',color:'#475569',marginBottom:4}}>
              <span>Progreso sesion</span><span>{correct}/{total} correctas</span>
            </div>
            <div style={{height:6,background:'#1e293b',borderRadius:6,overflow:'hidden'}}>
              <div style={{width:progPct+'%',background:'linear-gradient(90deg,#10b981,#06b6d4)',height:'100%',borderRadius:6,transition:'width .5s'}}/>
            </div>
            {correct>0&&(
              <div style={{display:'flex',justifyContent:'center',gap:3,marginTop:6}}>
                {Array.from({length:Math.min(correct,15)}).map((_, i)=>(<span key={i} style={{fontSize:'.7rem'}}>⭐</span>))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}