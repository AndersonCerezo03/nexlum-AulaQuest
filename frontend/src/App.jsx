import { useState, useEffect, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';
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
  @media (max-width: 760px) {
    .aq-2col { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
    .aq-topics { grid-template-columns: repeat(2,1fr) !important; }
    html, body { overflow-x: hidden !important; max-width: 100% !important; }
    .aq-bar { flex-wrap: wrap !important; height: auto !important; padding: 8px 12px !important; gap: 8px !important; }
    #root, body > div { overflow-x: hidden !important; max-width: 100vw !important; }
    * { max-width: 100% !important; }
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
async function alexSpeakBilingual(enText, esText, token, onEnd) {
  // onEnd se llama UNA sola vez. Watchdog: libera el flujo aunque un audio de la
  // secuencia se cuelgue, para que la práctica no quede trabada en "speaking".
  let done = false, guard = null;
  const finish = () => { if (done) return; done = true; if (guard) clearTimeout(guard); if (onEnd) onEnd(); };
  guard = setTimeout(finish, 14000);

  if (window._alexListening) { finish(); return; }
  if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
  window.speechSynthesis && window.speechSynthesis.cancel();

  const fallback = () => {
    if (!window.speechSynthesis) { finish(); return; }
    const u = new SpeechSynthesisUtterance(enText);
    u.lang='en-US'; u.rate=0.72; u.pitch=1.0; u.volume=1;
    u.onend = finish; u.onerror = finish;
    window.speechSynthesis.speak(u);
  };

  if (!token) { fallback(); return; }

  try {
    const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };

    const [rEn, rEs] = await Promise.all([
      fetch(API+'/api/tts/speak',    { method:'POST', headers, body: JSON.stringify({ text: enText }) }),
      fetch(API+'/api/tts/speak-es', { method:'POST', headers, body: JSON.stringify({ text: esText }) }),
    ]);

    if (!rEn.ok || !rEs.ok) { fallback(); return; }

    const [blobEn, blobEs] = await Promise.all([rEn.blob(), rEs.blob()]);
    const urlEn = URL.createObjectURL(blobEn);
    const urlEs = URL.createObjectURL(blobEs);

    const playSeq = (steps, idx) => {
      if (idx >= steps.length) { finish(); return; }
      const step = steps[idx];
      if (step.pause) { setTimeout(() => playSeq(steps, idx+1), step.pause); return; }
      if (window._alexListening) { finish(); return; }
      const audio = new Audio(step.url);
      _currentAudio = audio;
      audio.onended = () => playSeq(steps, idx+1);
      audio.onerror = () => playSeq(steps, idx+1);
      audio.play().catch(() => playSeq(steps, idx+1)); // si un audio falla, sigue con el resto
    };

    playSeq([
      { url: urlEn },
      { pause: 600 },
      { url: urlEs },
      { pause: 700 },
      { url: urlEn },
    ], 0);

  } catch { fallback(); }
}

// Cache de audio para no repetir llamadas
const _ttsCache = {};
let _currentAudio = null;

function alexSpeak(text, rate, onEnd) {
  // onEnd se llama UNA sola vez. Watchdog: si el audio nunca dispara su evento
  // de fin (bug de Web Speech, blob inválido o red lenta), el flujo se libera igual
  // para que la práctica del aula no se quede trabada esperando para siempre.
  let done = false, guard = null;
  const finish = () => { if (done) return; done = true; if (guard) clearTimeout(guard); if (onEnd) onEnd(); };
  guard = setTimeout(finish, 9000);

  if (window._alexListening) { finish(); return; }

  // Cancelar audio previo
  if (_currentAudio) { _currentAudio.pause(); _currentAudio.currentTime = 0; _currentAudio = null; }
  window.speechSynthesis && window.speechSynthesis.cancel();
  window.responsiveVoice && window.responsiveVoice.cancel();

  const speakWS = () => {
    if (!window.speechSynthesis) { finish(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang='en-US'; u.rate=rate || 0.80; u.pitch=1.0; u.volume=1;
    u.onend = finish; u.onerror = finish;
    window.speechSynthesis.speak(u);
  };

  const playUrl = (url) => {
    if (window._alexListening) { finish(); return; }
    const audio = new Audio(url);
    audio.playbackRate = rate || 0.95;
    _currentAudio = audio;
    audio.onended = finish;
    audio.onerror = finish;
    audio.play().catch(finish);
  };

  const token = window._alexToken || '';
  if (!token) { speakWS(); return; }   // sin token: voz del navegador

  // Usar cache si existe
  const cacheKey = text.substring(0,50);
  if (_ttsCache[cacheKey]) { playUrl(_ttsCache[cacheKey]); return; }

  // Llamar al backend ElevenLabs (con fallback a la voz del navegador si falla)
  fetch(API+'/api/tts/speak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ text }),
  })
  .then(r => { if (!r.ok) throw new Error('TTS error'); return r.blob(); })
  .then(blob => { const url = URL.createObjectURL(blob); _ttsCache[cacheKey] = url; playUrl(url); })
  .catch(speakWS);
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

function Home({ onEmpezar, user, onLogout }) {
  const [cursosOpen, setCursosOpen] = useState(false);
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
      <nav style={{position:'fixed',top:0,left:0,width:'100%',zIndex:1000,height:62,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 2rem',background:'rgba(9,11,21,0.92)',backdropFilter:'blur(24px)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:36,height:36,background:'linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem'}}>🎓</div>
          <span style={{fontWeight:700,fontSize:'1.15rem',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>AulaQuest</span>
        </div>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          <span style={{color:'#94a3b8',padding:'.45rem .85rem',borderRadius:8,fontSize:'.88rem',cursor:'pointer',fontWeight:500}}>Inicio</span>
          <div style={{position:'relative'}}>
            <span onClick={()=>setCursosOpen(o=>!o)} style={{color: cursosOpen ? '#a5b4fc' : '#94a3b8',padding:'.45rem .85rem',borderRadius:8,fontSize:'.88rem',cursor:'pointer',fontWeight:500,display:'flex',alignItems:'center',gap:5,background: cursosOpen ? 'rgba(99,102,241,.1)' : 'transparent',transition:'all .2s'}}>
              📚 Cursos <span style={{fontSize:'.65rem',opacity:.7}}>{cursosOpen?'▲':'▼'}</span>
            </span>
            {cursosOpen && (
              <div style={{position:'absolute',top:'calc(100% + 8px)',left:'50%',transform:'translateX(-50%)',background:'#0a0e1a',border:'1px solid rgba(99,102,241,.3)',borderRadius:16,padding:'10px',minWidth:320,zIndex:2000,boxShadow:'0 20px 60px rgba(0,0,0,.8), 0 0 0 1px rgba(99,102,241,.1)'}}>
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
            <span style={{fontSize:'.85rem',color:'#e2e8f0',fontWeight:600}}>👤 {user.name}</span>
            <button onClick={onEmpezar} style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',padding:'.5rem 1.2rem',borderRadius:8,fontWeight:600,fontSize:'.88rem',cursor:'pointer'}}>Ir al aula</button>
            <button onClick={onLogout} style={{background:'transparent',color:'#ef4444',border:'1px solid rgba(239,68,68,.3)',padding:'.5rem 1rem',borderRadius:8,fontWeight:600,fontSize:'.85rem',cursor:'pointer'}}>Salir</button>
          </div>
        ) : (
          <button onClick={onEmpezar} style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',padding:'.5rem 1.2rem',borderRadius:8,fontWeight:600,fontSize:'.88rem',cursor:'pointer',boxShadow:'0 3px 12px rgba(99,102,241,.35)'}}>
            🚀 Empezar
          </button>
        )}
      </nav>
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

// ─── MINIJUEGO: MEMORIA — EMPAREJA CARTAS ────────────────────────────────────
function MemoryGame({ nivel, vocabData, onBack }) {
  const [cards,     setCards]     = useState([]);
  const [flipped,   setFlipped]   = useState([]);
  const [matched,   setMatched]   = useState([]);
  const [moves,     setMoves]     = useState(0);
  const [phase,     setPhase]     = useState('ready');
  const [feedback,  setFeedback]  = useState(null);
  const [combo,     setCombo]     = useState(0);
  const [stars,     setStars]     = useState(0);
  const [timer,     setTimer]     = useState(0);
  const timerRef = useRef(null);
  const lockRef  = useRef(false);

  const PAIRS = 8; // 8 pares = 16 cartas

  const buildCards = () => {
    const all = Object.values(vocabData).flat();
    const shuffledPool = [...all].sort(() => Math.random() - 0.5).slice(0, PAIRS);
    const deck = [];
    shuffledPool.forEach((w, i) => {
      deck.push({ id: i*2,   pairId: i, type: 'en', text: w.en, emoji: getEmoji(w.en) });
      deck.push({ id: i*2+1, pairId: i, type: 'es', text: w.es, emoji: '' });
    });
    return deck.sort(() => Math.random() - 0.5);
  };

  const getEmoji = (word) => {
    const map = {
      'Hello':'👋','Goodbye':'👋','Apple':'🍎','Water':'💧','House':'🏠','Book':'📚',
      'Cat':'🐱','Dog':'🐶','Sun':'☀️','Moon':'🌙','Tree':'🌳','Car':'🚗',
      'Fish':'🐟','Bird':'🐦','Flower':'🌸','Star':'⭐','Heart':'❤️','Fire':'🔥',
      'Eye':'👁️','Hand':'✋','Head':'🗣️','Foot':'🦶','Nose':'👃','Mouth':'👄',
      'Red':'🔴','Blue':'🔵','Green':'🟢','Yellow':'🟡','Black':'⚫','White':'⚪',
      'Mother':'👩','Father':'👨','Brother':'👦','Sister':'👧','Baby':'👶',
      'Bread':'🍞','Milk':'🥛','Egg':'🥚','Rice':'🍚','Soup':'🍲','Meat':'🥩',
      'One':'1️⃣','Two':'2️⃣','Three':'3️⃣','Four':'4️⃣','Five':'5️⃣',
      'Run':'🏃','Eat':'🍴','Sleep':'😴','Talk':'💬','Work':'💼','Play':'🎮',
      'Big':'📦','Small':'🔬','Good':'👍','Bad':'👎','Hot':'🌡️','Cold':'🧊',
    };
    return map[word] || '📝';
  };

  const startGame = () => {
    const deck = buildCards();
    setCards(deck); setFlipped([]); setMatched([]);
    setMoves(0); setCombo(0); setFeedback(null); setTimer(0);
    setPhase('playing');
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const calcStars = (mv, time) => {
    if (mv <= PAIRS + 2 && time < 60) return 3;
    if (mv <= PAIRS + 6 && time < 120) return 2;
    return 1;
  };

  const flipCard = (card) => {
    if (lockRef.current) return;
    if (matched.includes(card.pairId)) return;
    if (flipped.find(f => f.id === card.id)) return;
    if (flipped.length === 2) return;

    const newFlipped = [...flipped, card];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      lockRef.current = true;
      setMoves(m => m + 1);
      const [a, b] = newFlipped;

      if (a.pairId === b.pairId && a.type !== b.type) {
        // Match!
        const newCombo = combo + 1;
        setCombo(newCombo);
        const comboMsg = newCombo >= 3 ? ' 🔥 COMBO x' + newCombo + '!' : '';
        setFeedback({ msg: '¡Correcto! ' + a.text + ' = ' + b.text + comboMsg, ok: true });
        setTimeout(() => {
          const newMatched = [...matched, a.pairId];
          setMatched(newMatched);
          setFlipped([]);
          setFeedback(null);
          lockRef.current = false;
          if (newMatched.length === PAIRS) {
            clearInterval(timerRef.current);
            const s = calcStars(moves + 1, timer);
            setStars(s);
            setPhase('win');
          }
        }, 800);
      } else {
        // No match
        setCombo(0);
        setFeedback({ msg: '¡Casi! Sigue intentando 💪', ok: false });
        setTimeout(() => {
          setFlipped([]);
          setFeedback(null);
          lockRef.current = false;
        }, 1200);
      }
    }
  };

  const isFlipped = (card) => flipped.find(f => f.id === card.id) || matched.includes(card.pairId);
  const isMatched = (card) => matched.includes(card.pairId);

  const fmtTime = (s) => Math.floor(s/60)+':'+(s%60<10?'0':'')+s%60;

  const containerStyle = {
    background: '#020617', minHeight: '100vh',
    fontFamily: "'Poppins',sans-serif", color: '#e2e8f0',
  };

  // READY
  if (phase === 'ready') return (
    <div style={containerStyle}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',padding:'2rem'}}>
        <div style={{maxWidth:480,width:'100%',textAlign:'center'}}>
          <div style={{fontSize:'4rem',marginBottom:'1rem'}}>🃏</div>
          <h2 style={{fontSize:'2rem',fontWeight:900,marginBottom:'.5rem',background:'linear-gradient(135deg,#10b981,#06b6d4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            Empareja las Cartas
          </h2>
          <p style={{color:'#64748b',marginBottom:'2rem',lineHeight:1.6}}>
            Voltea las cartas y encuentra las parejas.<br/>
            Une cada palabra en <strong style={{color:'#a5b4fc'}}>inglés</strong> con su traducción en <strong style={{color:'#10b981'}}>español</strong>.<br/>
            <span style={{color:'#f59e0b'}}>¡Menos movimientos = más estrellas! ⭐</span>
          </p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:'2rem'}}>
            {[['🃏',PAIRS+' pares','16 cartas en total'],['⭐','3 estrellas','menos de '+(PAIRS+2)+' movimientos'],['⏱️','Contra el tiempo','¡más rápido más puntos!']].map(([i,t,d])=>(
              <div key={t} style={{background:'#0f172a',border:'1px solid rgba(16,185,129,.2)',borderRadius:12,padding:'1rem'}}>
                <div style={{fontSize:'1.5rem',marginBottom:4}}>{i}</div>
                <div style={{fontSize:'.85rem',fontWeight:700,color:'#e2e8f0'}}>{t}</div>
                <div style={{fontSize:'.72rem',color:'#64748b'}}>{d}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:12,justifyContent:'center'}}>
            <button onClick={startGame} style={{background:'linear-gradient(135deg,#10b981,#06b6d4)',color:'#fff',border:'none',padding:'14px 32px',borderRadius:12,fontWeight:700,fontSize:'1rem',cursor:'pointer',boxShadow:'0 0 30px rgba(16,185,129,.35)'}}>
              🎮 ¡Jugar!
            </button>
            <button onClick={onBack} style={{background:'transparent',color:'#64748b',border:'1px solid rgba(99,102,241,.2)',padding:'14px 24px',borderRadius:12,fontWeight:600,cursor:'pointer'}}>
              Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // WIN
  if (phase === 'win') return (
    <div style={containerStyle}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',padding:'2rem'}}>
        <div style={{maxWidth:420,width:'100%',textAlign:'center'}}>
          <div style={{fontSize:'4rem',marginBottom:'.5rem'}}>{'⭐'.repeat(stars)}</div>
          <h2 style={{fontSize:'2rem',fontWeight:900,marginBottom:'.5rem',background:'linear-gradient(135deg,#10b981,#06b6d4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            ¡Lo lograste!
          </h2>
          <p style={{color:'#64748b',marginBottom:'1.5rem'}}>Encontraste todas las parejas. Tu memoria es increíble! 🧠</p>
          <div style={{background:'#0f172a',border:'1px solid rgba(16,185,129,.2)',borderRadius:16,padding:'1.5rem',marginBottom:'1.5rem'}}>
            {[['🎯','Movimientos',moves],['⏱️','Tiempo',fmtTime(timer)],['⭐','Estrellas',stars+' / 3']].map(([i,l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
                <span style={{color:'#64748b',fontSize:'.85rem'}}>{i} {l}</span>
                <span style={{color:'#10b981',fontWeight:700}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:12,justifyContent:'center'}}>
            <button onClick={startGame} style={{background:'linear-gradient(135deg,#10b981,#06b6d4)',color:'#fff',border:'none',padding:'12px 28px',borderRadius:12,fontWeight:700,cursor:'pointer'}}>
              🔄 Jugar de nuevo
            </button>
            <button onClick={onBack} style={{background:'transparent',color:'#64748b',border:'1px solid rgba(99,102,241,.2)',padding:'12px 20px',borderRadius:12,fontWeight:600,cursor:'pointer'}}>
              Volver al aula
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // PLAYING
  return (
    <div style={containerStyle}>
      {/* HUD */}
      <div style={{position:'sticky',top:0,zIndex:100,background:'rgba(2,6,23,.95)',borderBottom:'1px solid rgba(16,185,129,.15)',padding:'10px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',backdropFilter:'blur(10px)'}}>
        <div style={{fontSize:'.85rem',color:'#64748b'}}>⏱️ <span style={{color:'#e2e8f0',fontWeight:700}}>{fmtTime(timer)}</span></div>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:'.75rem',color:'#64748b'}}>Pares: <span style={{color:'#10b981',fontWeight:700}}>{matched.length}/{PAIRS}</span></div>
          {combo >= 3 && <div style={{fontSize:'.65rem',color:'#f59e0b',fontWeight:700}}>🔥 COMBO x{combo}</div>}
        </div>
        <div style={{fontSize:'.85rem',color:'#64748b'}}>Movimientos: <span style={{color:'#e2e8f0',fontWeight:700}}>{moves}</span></div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{position:'fixed',top:60,left:'50%',transform:'translateX(-50%)',zIndex:200,
          background:feedback.ok?'rgba(16,185,129,.15)':'rgba(239,68,68,.1)',
          border:'1px solid '+(feedback.ok?'#10b981':'rgba(239,68,68,.3)'),
          borderRadius:10,padding:'8px 20px',fontSize:'.85rem',fontWeight:700,
          color:feedback.ok?'#10b981':'#f87171',whiteSpace:'nowrap',
          boxShadow:'0 4px 20px rgba(0,0,0,.3)'}}>
          {feedback.msg}
        </div>
      )}

      {/* Grid de cartas */}
      <div style={{padding:'1.5rem',maxWidth:700,margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {cards.map(card => {
            const flippedCard = isFlipped(card);
            const matchedCard = isMatched(card);
            const isEN = card.type === 'en';
            return (
              <div key={card.id} onClick={() => !matchedCard && flipCard(card)}
                style={{
                  height:90, borderRadius:14, cursor: matchedCard?'default':'pointer',
                  perspective:600, transition:'transform .1s',
                  transform: (!matchedCard && !flippedCard) ? 'scale(1)' : 'scale(1)',
                }}>
                <div style={{
                  width:'100%', height:'100%', position:'relative',
                  transformStyle:'preserve-3d',
                  transition:'transform .4s cubic-bezier(.4,0,.2,1)',
                  transform: flippedCard ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}>
                  {/* Dorso */}
                  <div style={{
                    position:'absolute',width:'100%',height:'100%',backfaceVisibility:'hidden',
                    background:'linear-gradient(135deg,#1e1b4b,#0f172a)',
                    border:'1px solid rgba(99,102,241,.2)',borderRadius:14,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:'1.8rem',
                  }}>🎴</div>
                  {/* Frente */}
                  <div style={{
                    position:'absolute',width:'100%',height:'100%',backfaceVisibility:'hidden',
                    transform:'rotateY(180deg)',
                    background: matchedCard
                      ? 'rgba(16,185,129,.12)'
                      : isEN ? 'rgba(99,102,241,.12)' : 'rgba(6,182,212,.12)',
                    border:'1px solid '+(matchedCard?'rgba(16,185,129,.4)':isEN?'rgba(99,102,241,.4)':'rgba(6,182,212,.4)'),
                    borderRadius:14,
                    display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                    padding:'8px',textAlign:'center',
                  }}>
                    {isEN && <div style={{fontSize:'1.2rem',marginBottom:2}}>{card.emoji}</div>}
                    <div style={{fontSize:isEN?'.75rem':'.8rem',fontWeight:700,color:matchedCard?'#10b981':isEN?'#a5b4fc':'#67e8f9',lineHeight:1.2}}>
                      {card.text}
                    </div>
                    <div style={{fontSize:'.55rem',color:'#475569',marginTop:3,fontWeight:600,letterSpacing:'.05em'}}>
                      {isEN?'🇬🇧 INGLÉS':'🇨🇴 ESPAÑOL'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── MINIJUEGO: LLUVIA DE PALABRAS ───────────────────────────────────────────
function WordRain({ nivel, token, vocabData, onBack }) {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const authH = (t) => ({ Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' });

  const [words,      setWords]      = useState([]);   // palabras cayendo [{id,en,es,x,y,speed,answered}]
  const [input,      setInput]      = useState('');
  const [score,      setScore]      = useState(0);
  const [lives,      setLives]      = useState(3);
  const [phase,      setPhase]      = useState('ready'); // ready | playing | gameover | win
  const [feedback,   setFeedback]   = useState(null);   // {msg, ok}
  const [pool,       setPool]       = useState([]);
  const [usedIdx,    setUsedIdx]    = useState([]);
  const [highScore,  setHighScore]  = useState(0);
  const [combo,      setCombo]      = useState(0);
  const inputRef = useRef(null);
  const rafRef   = useRef(null);
  const wordsRef = useRef([]);
  const lastTime = useRef(0);
  const spawnTimer = useRef(0);

  // Cargar vocabulario desde vocabData prop
  useEffect(() => {
    const all = Object.values(vocabData).flat();
    if (all.length) setPool(all);
  }, [vocabData]);

  const getNextWord = (used) => {
    const available = pool.filter((_, i) => !used.includes(i));
    if (!available.length) return null;
    const idx = pool.indexOf(available[Math.floor(Math.random() * available.length)]);
    return { idx, word: pool[idx] };
  };

  const spawnWord = (used) => {
    const next = getNextWord(used);
    if (!next) return used;
    const newUsed = [...used, next.idx];
    const newWord = {
      id:       Date.now() + Math.random(),
      en:       next.word.en,
      es:       next.word.es,
      x:        10 + Math.random() * 75,
      y:        -8,
      speed:    0.012 + Math.random() * 0.018 + score * 0.0002,
      answered: false,
      hit:      false,
    };
    wordsRef.current = [...wordsRef.current, newWord];
    setWords([...wordsRef.current]);
    setUsedIdx(newUsed);
    return newUsed;
  };

  const startGame = () => {
    wordsRef.current = [];
    setWords([]); setScore(0); setLives(3); setCombo(0);
    setUsedIdx([]); setFeedback(null); setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Game loop
  useEffect(() => {
    if (phase !== 'playing') { cancelAnimationFrame(rafRef.current); return; }
    let used = usedIdx;

    const loop = (timestamp) => {
      const delta = timestamp - lastTime.current;
      lastTime.current = timestamp;
      spawnTimer.current += delta;

      // Spawn cada 2.5s
      if (spawnTimer.current > 2500 && wordsRef.current.filter(w=>!w.answered&&!w.hit).length < 5) {
        spawnTimer.current = 0;
        used = spawnWord(used);
      }

      // Mover palabras
      let lost = 0;
      wordsRef.current = wordsRef.current.map(w => {
        if (w.answered || w.hit) return w;
        const newY = w.y + w.speed * delta;
        if (newY > 100) { lost++; return { ...w, y: newY, hit: true }; }
        return { ...w, y: newY };
      });

      if (lost > 0) {
        setLives(prev => {
          const next = prev - lost;
          if (next <= 0) { setPhase('gameover'); return 0; }
          return next;
        });
        setFeedback({ msg: '💔 Se te escapó una!', ok: false });
        setTimeout(() => setFeedback(null), 1000);
      }

      // Limpiar palabras viejas
      wordsRef.current = wordsRef.current.filter(w => w.y < 110);
      setWords([...wordsRef.current]);

      // Verificar si todas completadas
      if (used.length >= pool.length && wordsRef.current.every(w => w.answered || w.hit)) {
        setPhase('win');
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    spawnTimer.current = 2500; // spawn inmediato
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, pool]);

  const handleInput = (e) => {
    const val = e.target.value;
    setInput(val);

    // Buscar coincidencia exacta (español o inglés)
    const clean = s => s.toLowerCase().trim();
    const match = wordsRef.current.find(w =>
      !w.answered && !w.hit &&
      (clean(val) === clean(w.es) || clean(val) === clean(w.en))
    );

    if (match) {
      wordsRef.current = wordsRef.current.map(w =>
        w.id === match.id ? { ...w, answered: true } : w
      );
      setWords([...wordsRef.current]);
      const newCombo = combo + 1;
      const pts = newCombo >= 3 ? 20 : 10;
      setScore(s => { const ns = s + pts; setHighScore(h => Math.max(h, ns)); return ns; });
      setCombo(newCombo);
      const comboMsg = newCombo >= 5 ? ' 🔥 COMBO x'+newCombo+'!' : newCombo >= 3 ? ' ⚡ x'+newCombo : '';
      setFeedback({ msg: '+'+pts+' pts! ✅ '+match.en+' = '+match.es+comboMsg, ok: true });
      setTimeout(() => setFeedback(null), 1200);
      setInput('');
      inputRef.current?.focus();
    } else {
      setCombo(0);
    }
  };

  const LIVES_ICONS = ['💀','❤️','❤️❤️','❤️❤️❤️'];

  const containerStyle = {
    background: '#020617',
    minHeight: '100vh',
    fontFamily: "'Poppins',sans-serif",
    color: '#e2e8f0',
    position: 'relative',
    overflow: 'hidden',
  };

  // PANTALLA READY
  if (phase === 'ready') return (
    <div style={containerStyle}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',padding:'2rem'}}>
        <div style={{maxWidth:480,width:'100%',textAlign:'center'}}>
          <div style={{fontSize:'4rem',marginBottom:'1rem'}}>🌧️</div>
          <h2 style={{fontSize:'2rem',fontWeight:900,marginBottom:'.5rem',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            Lluvia de Palabras
          </h2>
          <p style={{color:'#64748b',marginBottom:'2rem',lineHeight:1.6}}>
            Caerán palabras en inglés del nivel <strong style={{color:'#a5b4fc'}}>{nivel}</strong>.<br/>
            Escribe la traducción al español antes de que lleguen abajo.<br/>
            <span style={{color:'#f59e0b'}}>¡3 errores y game over!</span>
          </p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:'2rem'}}>
            {[['🎯','Escribe','la traducción en español'],['⚡','Combo','3+ seguidas = 20 pts'],['❤️','Vidas','3 oportunidades']].map(([i,t,d])=>(
              <div key={t} style={{background:'#0f172a',border:'1px solid rgba(99,102,241,.2)',borderRadius:12,padding:'1rem'}}>
                <div style={{fontSize:'1.5rem',marginBottom:4}}>{i}</div>
                <div style={{fontSize:'.85rem',fontWeight:700,color:'#e2e8f0'}}>{t}</div>
                <div style={{fontSize:'.72rem',color:'#64748b'}}>{d}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:12,justifyContent:'center'}}>
            <button onClick={startGame} style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',padding:'14px 32px',borderRadius:12,fontWeight:700,fontSize:'1rem',cursor:'pointer',boxShadow:'0 0 30px rgba(99,102,241,.4)'}}>
              🚀 ¡Jugar!
            </button>
            <button onClick={onBack} style={{background:'transparent',color:'#64748b',border:'1px solid rgba(99,102,241,.2)',padding:'14px 24px',borderRadius:12,fontWeight:600,cursor:'pointer'}}>
              Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // PANTALLA GAMEOVER / WIN
  if (phase === 'gameover' || phase === 'win') return (
    <div style={containerStyle}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',padding:'2rem'}}>
        <div style={{maxWidth:420,width:'100%',textAlign:'center'}}>
          <div style={{fontSize:'5rem',marginBottom:'1rem'}}>{phase==='win'?'🏆':'💀'}</div>
          <h2 style={{fontSize:'2rem',fontWeight:900,marginBottom:'.5rem',background:phase==='win'?'linear-gradient(135deg,#10b981,#06b6d4)':'linear-gradient(135deg,#ef4444,#f59e0b)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            {phase==='win'?'¡Completaste todas las palabras!':'¡Game Over!'}
          </h2>
          <p style={{color:'#64748b',marginBottom:'1.5rem'}}>{phase==='win'?'Dominaste todo el vocabulario. Eres increíble! 🌟':'Se te acabaron las vidas. Pero aprendiste mucho!'}</p>
          <div style={{background:'#0f172a',border:'1px solid rgba(99,102,241,.2)',borderRadius:16,padding:'1.5rem',marginBottom:'1.5rem'}}>
            <div style={{fontSize:'2.5rem',fontWeight:900,color:'#6366f1',marginBottom:4}}>{score}</div>
            <div style={{fontSize:'.85rem',color:'#64748b'}}>puntos</div>
            {highScore > 0 && <div style={{fontSize:'.75rem',color:'#f59e0b',marginTop:8}}>🏅 Mejor puntaje: {highScore}</div>}
          </div>
          <div style={{display:'flex',gap:12,justifyContent:'center'}}>
            <button onClick={startGame} style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',padding:'12px 28px',borderRadius:12,fontWeight:700,cursor:'pointer'}}>
              🔄 Jugar de nuevo
            </button>
            <button onClick={onBack} style={{background:'transparent',color:'#64748b',border:'1px solid rgba(99,102,241,.2)',padding:'12px 20px',borderRadius:12,fontWeight:600,cursor:'pointer'}}>
              Volver al aula
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // PANTALLA PLAYING
  return (
    <div style={containerStyle}>
      {/* HUD */}
      <div style={{position:'fixed',top:0,left:0,right:0,zIndex:100,background:'rgba(2,6,23,.9)',borderBottom:'1px solid rgba(99,102,241,.2)',padding:'10px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',backdropFilter:'blur(10px)'}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:'1.3rem'}}>{'❤️'.repeat(lives)}</span>
          <span style={{fontSize:'.75rem',color:'#64748b'}}>{lives} vidas</span>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:'1.2rem',fontWeight:900,color:'#6366f1'}}>{score} pts</div>
          {combo >= 3 && <div style={{fontSize:'.65rem',color:'#f59e0b',fontWeight:700}}>🔥 COMBO x{combo}</div>}
        </div>
        <button onClick={()=>setPhase('gameover')} style={{background:'transparent',color:'#475569',border:'1px solid rgba(99,102,241,.15)',padding:'4px 12px',borderRadius:8,cursor:'pointer',fontSize:'.75rem'}}>
          Salir
        </button>
      </div>

      {/* Campo de juego */}
      <div style={{position:'fixed',top:56,left:0,right:0,bottom:80,overflow:'hidden'}}>
        {/* Línea de peligro */}
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:'rgba(239,68,68,.3)'}}/>
        <div style={{position:'absolute',bottom:4,right:12,fontSize:'.6rem',color:'rgba(239,68,68,.5)'}}>zona de peligro</div>

        {/* Palabras cayendo */}
        {words.filter(w=>!w.answered&&!w.hit).map(w=>(
          <div key={w.id} style={{
            position:'absolute',
            left: w.x+'%',
            top:  w.y+'%',
            transform:'translateX(-50%)',
            background:'rgba(13,17,23,.9)',
            border:'1px solid rgba(99,102,241,.4)',
            borderRadius:10,
            padding:'6px 14px',
            fontSize:'.85rem',
            fontWeight:700,
            color:'#a5b4fc',
            whiteSpace:'nowrap',
            boxShadow:'0 0 15px rgba(99,102,241,.2)',
            backdropFilter:'blur(4px)',
            transition:'top 0.05s linear',
          }}>
            {w.en}
          </div>
        ))}

        {/* Palabras respondidas (efecto desvanecimiento) */}
        {words.filter(w=>w.answered).map(w=>(
          <div key={w.id+'ok'} style={{
            position:'absolute',left:w.x+'%',top:w.y+'%',transform:'translateX(-50%)',
            background:'rgba(16,185,129,.15)',border:'1px solid #10b981',borderRadius:10,
            padding:'6px 14px',fontSize:'.85rem',fontWeight:700,color:'#10b981',
            whiteSpace:'nowrap',opacity:0.6,pointerEvents:'none',
          }}>
            ✓ {w.en}
          </div>
        ))}
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{position:'fixed',top:70,left:'50%',transform:'translateX(-50%)',zIndex:200,
          background:feedback.ok?'rgba(16,185,129,.15)':'rgba(239,68,68,.15)',
          border:'1px solid '+(feedback.ok?'#10b981':'#ef4444'),
          borderRadius:10,padding:'8px 20px',fontSize:'.85rem',fontWeight:700,
          color:feedback.ok?'#10b981':'#ef4444',whiteSpace:'nowrap',
          boxShadow:'0 4px 20px rgba(0,0,0,.3)'}}>
          {feedback.msg}
        </div>
      )}

      {/* Input */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,padding:'12px 20px',background:'rgba(2,6,23,.95)',borderTop:'1px solid rgba(99,102,241,.2)',backdropFilter:'blur(10px)',display:'flex',gap:12,alignItems:'center'}}>
        <div style={{flex:1,position:'relative'}}>
          <input
            ref={inputRef}
            value={input}
            onChange={handleInput}
            placeholder="Escribe la traducción en español..."
            autoComplete="off"
            style={{width:'100%',background:'#0f172a',border:'1px solid rgba(99,102,241,.3)',borderRadius:12,padding:'12px 16px',color:'#e2e8f0',fontSize:'1rem',fontFamily:"'Poppins',sans-serif",outline:'none',boxSizing:'border-box'}}
          />
        </div>
        <div style={{fontSize:'.75rem',color:'#475569',whiteSpace:'nowrap'}}>
          {words.filter(w=>w.answered).length}/{pool.length} palabras
        </div>
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

function AlibiGame({ onBack }) {
  const PLACES = [
    "At a modern Italian restaurant downtown",
    "Inside the biggest supermarket in the city",
    "At a noisy rock concert in the park",
    "In the quiet public library studying for an exam",
    "At a friend's birthday party in a big house",
    "Waiting at the airport terminal for a delayed flight",
  ];
  const ACTIONS = [
    "Eating a huge pizza and drinking soda",
    "Buying a lot of chocolate and energy drinks",
    "Dancing near the stage and losing a phone",
    "Reading a boring book about ancient history",
    "Singing karaoke terribly in front of 30 people",
    "Sleeping on a very uncomfortable plastic chair",
  ];
  const WITNESSES = [
    "A famous local chef wearing a white uniform",
    "An angry security guard with a mustache",
    "Two noisy teenagers playing video games",
    "An old lady who was walking a tiny dog",
    "A friendly taxi driver who didn't speak English",
    "Your English teacher's secret twin brother",
  ];
  const pick = arr => arr[Math.floor(Math.random()*arr.length)];

  const [alibi, setAlibi] = useState({ place:'Pulsa "Generar coartada" para empezar...', action:'-', witness:'-' });
  const [timeLeft, setTimeLeft] = useState(180);
  const [running, setRunning]   = useState(false);
  const intervalRef = useRef(null);

  const stop = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  useEffect(()=>()=>stop(), []);

  const generar = () => {
    setAlibi({ place: pick(PLACES), action: pick(ACTIONS), witness: pick(WITNESSES) });
    resetTimer();
  };
  const startTimer = () => {
    stop(); setRunning(true);
    intervalRef.current = setInterval(()=>{
      setTimeLeft(prev => {
        if (prev <= 1) { stop(); setRunning(false); return 0; }
        return prev - 1;
      });
    }, 1000);
  };
  const resetTimer = () => { stop(); setRunning(false); setTimeLeft(180); };

  const mm = String(Math.floor(timeLeft/60)).padStart(2,'0');
  const ss = String(timeLeft%60).padStart(2,'0');
  const timerLabel = (timeLeft===0 && !running) ? '¡A HABLAR!' : `${mm}:${ss}`;

  const CY = '#00adb5', RED = '#ff4757';
  const card = { background:'#1e1e1e', borderRadius:12, padding:25, boxShadow:'0 10px 30px rgba(0,0,0,.5)', border:'1px solid #2a2a2a' };
  const elem = { background:'#262626', padding:15, borderRadius:8, borderLeft:`5px solid ${CY}` };
  const lbl  = { display:'block', fontSize:'.85rem', color:CY, textTransform:'uppercase', fontWeight:'bold', marginBottom:5 };
  const btn  = { background:CY, color:'#121212', border:'none', padding:'12px 24px', fontSize:'1rem', fontWeight:'bold', borderRadius:6, cursor:'pointer', width:'100%' };
  const badge= { background:CY, color:'#121212', padding:'2px 6px', borderRadius:4, fontWeight:'bold', fontSize:'.8rem', marginRight:5 };

  return (
    <div style={{background:'#121212',minHeight:'100vh',color:'#eee',fontFamily:"'Segoe UI',Tahoma,sans-serif",padding:20}}>
      <div style={{maxWidth:1050,margin:'0 auto'}}>
        <button onClick={onBack} style={{background:'transparent',border:'1px solid rgba(0,173,181,.5)',color:CY,padding:'7px 16px',borderRadius:8,cursor:'pointer',fontWeight:600,marginBottom:18}}>← Volver al aula</button>
        <header style={{textAlign:'center',marginBottom:30}}>
          <h1 style={{color:CY,fontSize:'2.5rem',margin:'0 0 5px',letterSpacing:1}}>The Alibi Generator</h1>
          <p style={{color:'#a0a0a0',fontSize:'1.1rem',margin:0}}>B1 Level • Past Continuous, Connectors & Interrogation</p>
        </header>

        <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:25}}>
          <div style={card}>
            <h3 style={{marginTop:0,color:CY,borderBottom:'2px solid #2a2a2a',paddingBottom:10,fontSize:'1.3rem'}}>🚨 Suspects' Mission Card</h3>
            <p style={{color:'#a0a0a0',fontSize:'.95rem',marginBottom:20}}>
              Genera la historia base. Los dos sospechosos deben coordinar los detalles usando la guía gramatical de la derecha. ¡No pueden contradecirse!
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:15,marginBottom:20}}>
              <div style={elem}><label style={lbl}>📍 Where were you?</label><span style={{fontSize:'1.2rem',fontWeight:500}}>{alibi.place}</span></div>
              <div style={elem}><label style={lbl}>🛠️ What were you doing?</label><span style={{fontSize:'1.2rem',fontWeight:500}}>{alibi.action}</span></div>
              <div style={elem}><label style={lbl}>👥 Who was with you?</label><span style={{fontSize:'1.2rem',fontWeight:500}}>{alibi.witness}</span></div>
            </div>
            <button style={btn} onClick={generar}>🎲 Generar nueva coartada</button>

            <div style={{textAlign:'center',marginTop:20,background:'#1a2f3b',padding:15,borderRadius:8,border:`1px solid ${CY}`}}>
              <span style={{fontSize:'.9rem',textTransform:'uppercase',letterSpacing:1}}>Reloj de preparación</span>
              <div style={{fontSize:'2.5rem',fontWeight:'bold',color:(timeLeft===0&&!running)?RED:'#eee',margin:'10px 0',fontFamily:'monospace'}}>{timerLabel}</div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={startTimer} disabled={running} style={{...btn,background:'#444',color:'#fff',opacity:running?0.6:1,cursor:running?'default':'pointer'}}>Iniciar preparación</button>
                <button onClick={resetTimer} style={{...btn,background:RED,color:'#fff'}}>Reiniciar</button>
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{marginTop:0,color:CY,borderBottom:'2px solid #2a2a2a',paddingBottom:10,fontSize:'1.3rem'}}>🎯 B1 Language Requirements</h3>
            <p style={{color:'#a0a0a0',fontSize:'.95rem'}}>Usa obligatoriamente estas estructuras durante el interrogatorio para ganar puntos extra:</p>
            <ul style={{listStyle:'none',padding:0}}>
              {[
                ['Past Continuous','"We were watching a movie when..."'],
                ['Because','To explain the reason of an action.'],
                ['While','To describe two actions at the same time.'],
                ['Although','To show a contrast or surprise.'],
                ['Suddenly','To introduce an unexpected event.'],
              ].map(([b,t],i)=>(
                <li key={i} style={{background:'#262626',padding:'10px 15px',marginBottom:8,borderRadius:6,fontSize:'.95rem'}}>
                  <span style={badge}>{b}</span>{t}
                </li>
              ))}
            </ul>
            <h3 style={{marginTop:25,color:CY,borderBottom:'2px solid #2a2a2a',paddingBottom:10,fontSize:'1.3rem'}}>💬 Suggested Questions</h3>
            <p style={{fontStyle:'italic',fontSize:'.9rem',color:'#a0a0a0'}}>
              • What exactly were you wearing?<br/>
              • What time did you arrive and leave?<br/>
              • Why did you decide to go there?<br/>
              • What was the weather like?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CrisisGame({ onBack }) {
  const INFLUENCERS = [
    "A famous fitness coach with 10 million followers",
    "An extreme environmental activist and YouTuber",
    "A high-tech billionaire tech-reviewer",
    "A luxury travel vlogger who targets young adults",
    "A traditional grandma chef who went viral on TikTok",
  ];
  const SCANDALS = [
    "Was caught on camera eating a massive beef burger at a secret local restaurant.",
    "Was spotted throwing tons of plastic bottles into the ocean from a private yacht.",
    "Accidentally revealed during a livestream that they use an old cracked iPhone instead of the brand they sponsor.",
    "Was exposed for photoshopped vacation pictures; they were actually staying in a cheap local hotel room.",
    "Was caught buying all of their 'homemade' meals from a fast-food chain down the street.",
  ];
  const RULES = [
    "Must use at least two Mixed Conditionals (e.g., 'If we hadn't done that, our reputation wouldn't be in danger now').",
    "Must use passive structures to avoid direct blame (e.g., 'Mistakes were made', 'The video was leaked').",
    "Must heavily include B2 adverbs of certainty/doubt (e.g., 'undoubtedly, highly unlikely, presumably').",
    "Must use strong phrasal verbs for problem-solving (e.g., 'deal with, face up to, back down, clear up').",
    "Must defend the case using inversion for dramatic emphasis (e.g., 'Not only did he apologize, but he also...').",
  ];
  const pick = arr => arr[Math.floor(Math.random()*arr.length)];

  const [data, setData] = useState({ inf:'Pulsa "Lanzar escándalo" para empezar...', scandal:'-', rule:'-' });
  const [timeLeft, setTimeLeft] = useState(180);
  const [running, setRunning]   = useState(false);
  const intervalRef = useRef(null);

  const stop = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  useEffect(()=>()=>stop(), []);

  const deploy = () => {
    setData({ inf: pick(INFLUENCERS), scandal: pick(SCANDALS), rule: pick(RULES) });
    resetTimer();
  };
  const startTimer = () => {
    stop(); setRunning(true);
    intervalRef.current = setInterval(()=>{
      setTimeLeft(prev => { if (prev <= 1) { stop(); setRunning(false); return 0; } return prev - 1; });
    }, 1000);
  };
  const resetTimer = () => { stop(); setRunning(false); setTimeLeft(180); };

  const mm = String(Math.floor(timeLeft/60)).padStart(2,'0');
  const ss = String(timeLeft%60).padStart(2,'0');
  const timerLabel = (timeLeft===0 && !running) ? 'LIVE PRESS!' : `${mm}:${ss}`;

  const PUR='#a855f7', GRN='#10b981', DGR='#ef4444';
  const card = { background:'#1e293b', borderRadius:16, padding:30, boxShadow:'0 20px 25px -5px rgba(0,0,0,.3)', border:'1px solid #334155' };
  const slot = (hl)=>({ background:'#0f172a', padding:18, borderRadius:10, borderLeft:`5px solid ${hl?GRN:PUR}` });
  const lbl  = { display:'block', fontSize:'.8rem', color:'#94a3b8', textTransform:'uppercase', letterSpacing:1, fontWeight:'bold', marginBottom:6 };
  const btn  = { background:'linear-gradient(135deg,#a855f7,#7c3aed)', color:'#fff', border:'none', padding:'14px 28px', fontSize:'1.05rem', fontWeight:'bold', borderRadius:8, cursor:'pointer', width:'100%', boxShadow:'0 4px 12px rgba(168,85,247,.3)' };

  return (
    <div style={{background:'#0f172a',minHeight:'100vh',color:'#f8fafc',fontFamily:"'Segoe UI',Roboto,Arial,sans-serif",padding:20}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <button onClick={onBack} style={{background:'transparent',border:'1px solid rgba(168,85,247,.5)',color:PUR,padding:'7px 16px',borderRadius:8,cursor:'pointer',fontWeight:600,marginBottom:18}}>← Volver al aula</button>
        <header style={{textAlign:'center',marginBottom:30}}>
          <h1 style={{color:PUR,fontSize:'2.6rem',margin:'0 0 5px',fontWeight:800}}>The Influencer Crisis Manager</h1>
          <p style={{color:'#94a3b8',fontSize:'1.1rem',margin:0}}>B2 Level • Advanced Negotiation, Speculation & Fluency Integration</p>
        </header>

        <div style={{display:'grid',gridTemplateColumns:'1.3fr 1fr',gap:25}}>
          <div style={card}>
            <h3 style={{marginTop:0,color:PUR,borderBottom:'2px solid #334155',paddingBottom:12,fontSize:'1.4rem'}}>📢 Scandal Deployment Card</h3>
            <p style={{color:'#94a3b8',fontSize:'.95rem',marginBottom:25}}>
              Genera una crisis de relaciones públicas. El equipo de mánagers discute la estrategia de defensa mientras la prensa prepara sus ataques.
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:18,marginBottom:25}}>
              <div style={slot(false)}><label style={lbl}>👤 Target Influencer</label><span style={{fontSize:'1.25rem',fontWeight:600}}>{data.inf}</span></div>
              <div style={slot(false)}><label style={lbl}>🔥 The PR Scandal</label><span style={{fontSize:'1.25rem',fontWeight:600}}>{data.scandal}</span></div>
              <div style={slot(true)}><label style={lbl}>🎯 Mandatory Language Rule (B2)</label><span style={{fontSize:'1.25rem',fontWeight:600,color:GRN}}>{data.rule}</span></div>
            </div>
            <button style={btn} onClick={deploy}>🎲 Lanzar escándalo</button>

            <div style={{marginTop:25,background:'linear-gradient(180deg,#1e293b,#0f172a)',padding:20,borderRadius:12,border:'1px solid #334155',textAlign:'center'}}>
              <span style={{fontSize:'.85rem',textTransform:'uppercase',fontWeight:'bold',color:'#94a3b8'}}>Press Conference Warm-Up Clock</span>
              <div style={{fontSize:'3rem',fontWeight:800,color:(timeLeft===0&&!running)?DGR:'#f8fafc',margin:'10px 0',fontFamily:"'Courier New',monospace",letterSpacing:2}}>{timerLabel}</div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={startTimer} disabled={running} style={{...btn,background:'#334155',boxShadow:'none',opacity:running?0.6:1,cursor:running?'default':'pointer'}}>Iniciar preparación</button>
                <button onClick={resetTimer} style={{...btn,background:DGR,boxShadow:'none'}}>Reiniciar</button>
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{marginTop:0,color:PUR,borderBottom:'2px solid #334155',paddingBottom:12,fontSize:'1.4rem'}}>🧩 Integrated Level Blueprint</h3>
            <p style={{color:'#94a3b8',fontSize:'.9rem',marginBottom:20}}>Este juego fusiona las herramientas de los niveles previos con los objetivos B2:</p>
            <ul style={{listStyle:'none',padding:0,margin:0}}>
              {[
                ['🔄 Level A2/B1 Integration (The Foundation)','Describir detalladamente las circunstancias del hecho (preposiciones de lugar, adjetivos de emoción) y usar conectores de contraste (however, despite).'],
                ['⚡ Level B2 Speculation (The Core Challenge)','La prensa interroga usando modales perfectos: "You must have known that...", "He couldn\'t have done that alone."'],
                ['🗣️ Proactive Fluency (The Goal)','No se permite leer notas. Deben justificar las acciones del influencer improvisando argumentos lógicos de inmediato.'],
              ].map(([b,t],i)=>(
                <li key={i} style={{background:'#0f172a',padding:'12px 15px',marginBottom:10,borderRadius:8,fontSize:'.95rem',borderRight:`3px solid ${GRN}`}}>
                  <span style={{color:GRN,fontWeight:'bold',display:'block',marginBottom:4,fontSize:'.85rem'}}>{b}</span>{t}
                </li>
              ))}
            </ul>
            <h3 style={{marginTop:25,color:PUR,borderBottom:'2px solid #334155',paddingBottom:12,fontSize:'1.4rem'}}>🎙️ Journalists' Attack Guide</h3>
            <p style={{fontStyle:'italic',fontSize:'.9rem',color:'#94a3b8',lineHeight:1.5}}>
              • "How can you justify this behavior?"<br/>
              • "If this is true, what will you do to compensate your followers?"<br/>
              • "It is highly unlikely that nobody noticed before..."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SharkTankGame({ onBack }) {
  const PRODUCTS = [
    "An AI-powered smart pillow that wakes you up by gently slapping your face when you oversleep.",
    "A subscription app that uses drones to deliver hot espresso directly to your office window while you work.",
    "Dehydrated water powder: just add real water to create instant mineral water for high-end luxury hikers.",
    "A corporate networking app exclusively for people who have been fired from multi-million dollar corporations.",
  ];
  const CRISES = [
    "A sudden 40% tax increase on luxury items has just been approved by the government.",
    "Your main manufacturer in Asia has gone completely bankrupt, halting production for 6 months.",
    "A massive viral tweet claims your company secretly uses cookies to record users' dreams.",
    "Inflation has spiked, and the consumer's purchasing power has dropped to an all-time low this morning.",
  ];
  const INVESTORS = [
    "Aggressive & Impatient: Interrupts constantly, despises buzzwords, wants to hear raw numbers immediately.",
    "Skeptical Tech Guru: Intrigued by the data but convinced your infrastructure will crumble under a cyberattack.",
    "The Eco-Conscious Billionaire: Will cancel you immediately if your product cannot prove a 100% carbon-neutral footprint.",
  ];
  const pick = arr => arr[Math.floor(Math.random()*arr.length)];

  const [data, setData] = useState({ product:'Pulsa el botón para girar el mercado...', crisis:'-', investor:'-' });
  const [timeLeft, setTimeLeft] = useState(180);
  const [running, setRunning]   = useState(false);
  const intervalRef = useRef(null);

  const stop = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  useEffect(()=>()=>stop(), []);

  const roll = () => {
    setData({ product: pick(PRODUCTS), crisis: pick(CRISES), investor: pick(INVESTORS) });
    resetTimer();
  };
  const startTimer = () => {
    stop(); setRunning(true);
    intervalRef.current = setInterval(()=>{
      setTimeLeft(prev => { if (prev <= 1) { stop(); setRunning(false); return 0; } return prev - 1; });
    }, 1000);
  };
  const resetTimer = () => { stop(); setRunning(false); setTimeLeft(180); };

  const mm = String(Math.floor(timeLeft/60)).padStart(2,'0');
  const ss = String(timeLeft%60).padStart(2,'0');
  const timerLabel = (timeLeft===0 && !running) ? 'CROSS-EXAMINATION!' : `${mm}:${ss}`;

  const CY='#06b6d4', GOLD='#fbbf24', DGR='#f43f5e';
  const card = { background:'#151f32', borderRadius:16, padding:30, border:'1px solid #1e293b', boxShadow:'0 25px 50px -12px rgba(0,0,0,.5)' };
  const slot = (gold)=>({ background:'#0b0f19', padding:20, borderRadius:10, borderLeft:`5px solid ${gold?GOLD:CY}` });
  const lbl  = { display:'block', fontSize:'.75rem', color:'#64748b', textTransform:'uppercase', fontWeight:'bold', marginBottom:6 };
  const btn  = { background:'linear-gradient(135deg,#06b6d4,#0891b2)', color:'#0b0f19', border:'none', padding:15, fontSize:'1.1rem', fontWeight:'bold', borderRadius:8, cursor:'pointer', width:'100%', boxShadow:'0 4px 14px rgba(6,182,212,.4)' };

  return (
    <div style={{background:'#0b0f19',minHeight:'100vh',color:'#f1f5f9',fontFamily:"'Segoe UI',system-ui,sans-serif",padding:25}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <button onClick={onBack} style={{background:'transparent',border:'1px solid rgba(6,182,212,.5)',color:CY,padding:'7px 16px',borderRadius:8,cursor:'pointer',fontWeight:600,marginBottom:18}}>← Volver al aula</button>
        <header style={{textAlign:'center',marginBottom:30}}>
          <h1 style={{color:CY,fontSize:'2.8rem',margin:0,fontWeight:800}}>The Startup Shark Tank</h1>
          <p style={{color:'#64748b',fontSize:'1.1rem'}}>Level C1 • Advanced Persuasion, Market Inversions & Real Corporate Strategy</p>
        </header>

        <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:30}}>
          <div style={card}>
            <h3 style={{color:CY,borderBottom:'2px solid #1e293b',paddingBottom:12,marginTop:0,display:'flex',justifyContent:'space-between',fontSize:'1.4rem'}}>🚀 Venture Deployment Board <span style={{color:GOLD}}>C1</span></h3>
            <div style={{display:'flex',flexDirection:'column',gap:15,marginBottom:25}}>
              <div style={slot(false)}><label style={lbl}>💡 The Absurd Product / Startup</label><span style={{fontSize:'1.2rem',fontWeight:600,lineHeight:1.4}}>{data.product}</span></div>
              <div style={slot(false)}><label style={lbl}>📉 Current Market Crisis</label><span style={{fontSize:'1.2rem',fontWeight:600,lineHeight:1.4}}>{data.crisis}</span></div>
              <div style={slot(true)}><label style={lbl}>🦈 The Investor's Personality</label><span style={{fontSize:'1.2rem',fontWeight:600,lineHeight:1.4,color:GOLD}}>{data.investor}</span></div>
            </div>
            <button style={btn} onClick={roll}>🎲 Roll New Venture</button>
            <div style={{background:'#0b0f19',padding:20,borderRadius:12,textAlign:'center',marginTop:25,border:'1px solid #1e293b'}}>
              <div style={{fontSize:'3.5rem',fontWeight:800,fontFamily:'monospace',color:(timeLeft===0&&!running)?DGR:'#f1f5f9'}}>{timerLabel}</div>
              <div style={{display:'flex',gap:10,marginTop:10}}>
                <button onClick={startTimer} disabled={running} style={{...btn,background:'#334155',color:'#fff',boxShadow:'none',opacity:running?0.6:1,cursor:running?'default':'pointer'}}>Iniciar pitch</button>
                <button onClick={resetTimer} style={{...btn,background:DGR,color:'#fff',boxShadow:'none'}}>Reiniciar</button>
              </div>
            </div>
          </div>

          <div style={{...card,background:'#111827'}}>
            <h3 style={{color:CY,borderBottom:'2px solid #1e293b',paddingBottom:12,marginTop:0,fontSize:'1.4rem'}}>🎯 Linguistic Evaluation Parameters</h3>
            {[
              ['Grammar Directive:',' Must open with a formal grammatical inversion (e.g., "Not only is this product revolutionary, but..." or "Under no circumstances should you miss...").'],
              ['Idiomatic C1 Output:',' Must drop at least 2 high-level business idioms natively (e.g., "break even", "touch base", "ballpark figure", "ahead of the curve").'],
              ["The Sharks' Attack Style:",' The rest of the class must aggressively question using hypothesis structures: "Supposing your supply chain fails, how would you...?"'],
            ].map(([b,t],i)=>(
              <div key={i} style={{background:'#1e293b',padding:15,borderRadius:8,marginBottom:12,fontSize:'.95rem'}}>
                <span style={{color:GOLD,fontWeight:'bold'}}>{b}</span>{t}
              </div>
            ))}
          </div>
        </div>
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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const NIVEL_ORDER_PT = ['A1','A2','B1','B2','C1','C2'];
const PASS_RATIO_PT  = 0.75; // 75% para avanzar (ej. 6 de 8)
const passNeeded = total => Math.ceil((total || 0) * PASS_RATIO_PT);

function wordSim(a, b) {
  const wa = new Set(a.split(' ').filter(w => w.length > 1));
  const wb = new Set(b.split(' ').filter(w => w.length > 1));
  if (!wa.size || !wb.size) return 0;
  return [...wa].filter(w => wb.has(w)).length / Math.max(wa.size, wb.size);
}

function PlacementTestScreen({ token, userName, alexSpeak, onFinish }) {
  // Test de DIAGNÓSTICO lineal: una sola pasada de preguntas (fácil → difícil).
  const [preguntas,   setPreguntas]   = useState([]);
  const [phase,       setPhase]       = useState('loading'); // loading|intro|question|submitting|error
  const [idx,         setIdx]         = useState(0);
  const [seleccion,   setSeleccion]   = useState(null);
  const [feedback,    setFeedback]    = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [pronResult,  setPronResult]  = useState(null);
  const [errorMsg,    setErrorMsg]    = useState('');
  const answersRef = useRef([]);

  // Cargar el test de diagnóstico (lista ordenada por dificultad)
  useEffect(() => {
    fetch(API_BASE + '/api/placement-test', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(d => {
        if (!d.preguntas) { setErrorMsg(d.msg || 'Error al cargar el test.'); setPhase('error'); return; }
        setPreguntas(d.preguntas);
        setPhase('intro');
      })
      .catch(() => { setErrorMsg('No se pudo conectar al servidor.'); setPhase('error'); });
  }, [token]);

  // Auto-speak para listening y pronunciación al cargar la pregunta
  useEffect(() => {
    if (phase !== 'question' || !preguntas[idx]) return;
    const q = preguntas[idx];
    if ((q.tipo === 'listening' || q.tipo === 'pronunciation') && q.audio) {
      const t = setTimeout(() => alexSpeak(q.audio, 0.8), 500);
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
    const rec = new SR();
    rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 5;
    setIsListening(true);
    rec.onresult = e => {
      setIsListening(false);
      const spokenList = Array.from(e.results[0]).map(r => r.transcript.toLowerCase().trim().replace(/[^a-z\s]/g,''));
      const target = (q.target || '').toLowerCase().trim().replace(/[^a-z\s]/g,'');
      const ok = spokenList.some(s => s.includes(target) || target.includes(s) || wordSim(s, target) >= 0.55);
      resolvePron(ok, q);
    };
    rec.onerror = () => { setIsListening(false); resolvePron(false, q); };
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
      onFinish(d.diagnostico, d.user); // el padre lleva al alumno al Aula 1
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
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7}}>
            <span style={{color:C,fontWeight:700,fontSize:12}}>🎓 Test de diagnóstico</span>
            <span style={{color:'#334155',fontSize:11}}>{idx+1} / {preguntas.length}</span>
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
              <button onClick={() => alexSpeak(q.audio, 0.85)}
                style={{flex:2,display:'flex',alignItems:'center',gap:8,background:`${C}15`,border:`1px solid ${C}35`,borderRadius:12,padding:'10px 14px',cursor:'pointer',color:C,fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:13,justifyContent:'center',transition:'opacity .2s'}}
                onMouseEnter={e=>e.currentTarget.style.opacity='.8'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                🎧 {q.tipo === 'pronunciation' ? 'Escuchar frase' : 'Escuchar'}
              </button>
              <button onClick={() => alexSpeak(q.audio, 0.5)} title="Mr. Alex habla más despacio"
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
  const info = NIVEL_INFO[diag.nivelEstimado] || NIVEL_INFO['A1'];
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

          {/* Nota global + nivel estimado */}
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginBottom:18}}>
            <div style={{flex:'1 1 120px',background:'rgba(255,255,255,.03)',borderRadius:16,padding:'16px 10px',border:'1px solid rgba(255,255,255,.06)'}}>
              <div style={{fontSize:'1.9rem',fontWeight:900,color:colorPct(pctGlobal),lineHeight:1}}>{diag.puntaje}<span style={{fontSize:'1rem',color:'#475569'}}>/{diag.total}</span></div>
              <div style={{fontSize:11,color:'#64748b',marginTop:4}}>aciertos ({pctGlobal}%)</div>
            </div>
            <div style={{flex:'1 1 120px',background:`${info.color}10`,borderRadius:16,padding:'16px 10px',border:`1px solid ${info.color}33`}}>
              <div style={{fontSize:'1.6rem',lineHeight:1}}>{info.emoji}</div>
              <div style={{fontSize:'1.05rem',fontWeight:900,color:info.color,marginTop:2}}>{diag.nivelEstimado}</div>
              <div style={{fontSize:10,color:'#64748b',marginTop:2}}>nivel estimado</div>
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
  const [listening, setListening] = useState(false);
  const [correct,   setCorrect]   = useState(0);
  const [total,     setTotal]     = useState(0);
  const [totalXP,   setTotalXP]   = useState(0);
  const [lvlUp,     setLvlUp]     = useState(false);
  const [showDiag,  setShowDiag]  = useState(false);   // panel de resultados del diagnóstico
  const [tema,      setTema]      = useState(null);
  const [screen2,   setScreen2]   = useState('');
  const [adminVistaNivel, setAdminVistaNivel] = useState(null); // admin: ver aula de cualquier nivel
  const [nivelMenu, setNivelMenu] = useState(false);

  const esAdmin = user?.role === 'admin';
  const nivel = (esAdmin && adminVistaNivel) ? adminVistaNivel : (user?.englishLevel || 'A1');
  const [TOPICS,      setTOPICS]      = useState([]);
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

  // Al llegar al aula recién hecho el diagnóstico, abrir el panel de resultados
  useEffect(()=>{
    if (screen==='curso' && window._diagFresh && user?.diagnostico) {
      window._diagFresh = false;
      setShowDiag(true);
    }
  },[screen,user]);

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
    localStorage.removeItem('token'); window._alexToken = ''; setToken(''); setUser(null);
    setWord(null); setCloudOpen(false); setScreen('home'); setAdminVistaNivel(null);
  };

  // Cierre de sesion automatico tras 1 minuto sin actividad
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
    setTimeout(()=>{
      if (temaObj) {
        const msg = randFn(ALEX_TEMA, temaObj.name);
        setOrbState('speaking'); setBubble('🎯 Tema: ' + temaObj.name + ' — ' + msg); setBubbleType('');
        alexSpeak(temaObj ? temaObj.name : 'Let us begin', 0.85, ()=>setOrbState('idle'));
      } else {
        const msg = rand(ALEX_BIENVENIDA);
        setOrbState('speaking'); setBubble('👋 ' + msg); setBubbleType('');
        alexSpeak(temaObj ? temaObj.name : 'Let us begin', 0.85, ()=>setOrbState('idle'));
      }
    },400);
  };

  const closeCloud = () => {
    setCloudOpen(false); setOrbState('idle'); setWord(null);
    // Guardar posición al salir
    if (tema) fetch(API+'/api/practice/ultimo-tema',{method:'POST',headers:authH(token),body:JSON.stringify({temaId:tema.id})}).catch(()=>{});
    window.speechSynthesis && window.speechSynthesis.cancel();
  };

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
    if (pendientes.length === 0) {
      setBubble('🏆 Ya completaste todas las palabras de este tema! Selecciona el siguiente tema desbloqueado.');
      setBubbleType('ok');
      setOrbState('speaking');
      alexSpeak('Felicitaciones! Completaste todas las palabras de este tema. Selecciona el siguiente tema para continuar.', 0.85, ()=>setOrbState('idle'));
      return;
    }
    // Evitar repetir en sesión usando ref (siempre actualizado)
    const sinUsar = pendientes.filter(w => !usedWordsRef.current.includes(w.en));
    // Si ya usamos todas las pendientes en esta sesión, resetear solo las usadas (no las completadas)
    if (sinUsar.length === 0) usedWordsRef.current = [];
    const pool = sinUsar.length > 0 ? sinUsar : pendientes;
    const w = pool[0];
    usedWordsRef.current = [...usedWordsRef.current, w.en];
    setWord(w);
    setBubble('📖 ' + w.en + ' = ' + w.es + ' — Escucha y repite!'); setBubbleType('');
    setOrbState('speaking');
    // Solo decir la palabra 2 veces, rapido y claro
    alexSpeakBilingual(w.en, w.es, window._alexToken || token, ()=>{
      setOrbState('listening');
      setBubble('🎤 Di: ' + w.en + ' (' + w.es + ')');
    });
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
        alexSpeak(msgSil, 0.85);
      } else if (e.error==='not-allowed') {
        setBubble('🎤 Micrófono bloqueado. Permite el acceso al mic en tu navegador.'); setBubbleType('err');
      } else {
        setBubble('Mic error: '+e.error); setBubbleType('err');
      }
    };
    rec.onresult = async(e) => {
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
          // Cerrar el panel de práctica y mostrar el aula con el siguiente desbloqueado
          setCloudOpen(false);
          setWord(null);
          setOrbState('idle');
          setBubble('🏆 Tema completado! El siguiente tema se desbloqueó.');
          setBubbleType('ok');
          alexSpeak('Felicitaciones! Completaste este tema. El siguiente tema se ha desbloqueado!', 1.0, ()=>{
            setBubble('🎯 Selecciona el siguiente tema para continuar.');
            setBubbleType('');
          });
        } else {
          // Avanzar rapido — solo celebrar brevemente
          setBubble('✅ ' + word.en + ' = ' + word.es + ' — Correcto!'); setBubbleType('ok');
          alexSpeak('Correct.', 0.82, ()=>{
            setTimeout(()=>getWord(), 400);
          });
        }
      } else {
                const msgErr = randFn(ALEX_ERROR, word.en, word.es);
        setBubble('❌ ' + msgErr); setBubbleType('err'); setOrbState('speaking');
        alexSpeakBilingual(word.en, word.es, window._alexToken || '',
          ()=>{ setOrbState('listening'); setBubble('🎤 Otra vez: ' + word.en + ' (' + word.es + ')'); setBubbleType(''); });
      }
    };
    rec.start();
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

  if (screen2==='quiz') return (
    <LevelQuiz
      nivel={nivel}
      token={token}
      onBack={()=>setScreen2('')}
      onPass={()=>{ setScreen2(''); setLvlUp(true); setScreen('curso'); setTimeout(()=>setLvlUp(false),4000); }}
      onUserUpdate={(u)=>setUser(u)}
    />
  );

  if (screen2==='wordrain') return (
    <WordRain
      nivel={nivel}
      token={token}
      vocabData={vocabData}
      onBack={()=>setScreen2('')}
    />
  );

  if (screen2==='memory') return (
    <MemoryGame
      nivel={nivel}
      vocabData={vocabData}
      onBack={()=>setScreen2('')}
    />
  );

  if (screen2==='alibi') return (
    <AlibiGame onBack={()=>setScreen2('')} />
  );

  if (screen2==='crisis') return (
    <CrisisGame onBack={()=>setScreen2('')} />
  );

  if (screen2==='sharktank') return (
    <SharkTankGame onBack={()=>setScreen2('')} />
  );

  if (screen2==='crisisroom') return (
    <CrisisRoomGame onBack={()=>setScreen2('')} />
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
      <Home onEmpezar={()=>setScreen(user ? 'curso' : 'auth')} user={user} onLogout={logout}/>
    </>
  );

  if (screen==='placement') return (
    <PlacementTestScreen
      token={token}
      userName={user?.name || ''}
      alexSpeak={alexSpeak}
      onFinish={(diagnostico, updatedUser) => {
        setUser(updatedUser);
        window._diagFresh = true;        // abre el panel de resultados al llegar al aula
        setScreen('curso');              // todos empiezan en el Aula 1 (A1)
      }}
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
      <div className="aq-bar" style={{background:'linear-gradient(180deg,rgba(13,17,28,.98),rgba(9,11,21,.92))',backdropFilter:'blur(20px)',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 1.8rem',borderBottom:'1px solid rgba(99,102,241,0.18)',position:'sticky',top:0,zIndex:100,boxShadow:'0 6px 24px rgba(0,0,0,.4)'}}>
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
          {user?.role==='admin' && (<>
            <span style={{color:'#334155',fontSize:'.78rem'}}>|</span>
            <span onClick={()=>setScreen2('admin')} style={{color:'#f59e0b',fontSize:'.78rem',padding:'5px 12px',cursor:'pointer',borderRadius:7,background:'rgba(245,158,11,.1)',border:'1px solid rgba(245,158,11,.3)',fontWeight:700,display:'flex',alignItems:'center',gap:5}}>
              🛡️ Admin
            </span>
          </>)}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{background:'rgba(16,185,129,.15)',border:'1px solid rgba(16,185,129,.35)',color:'#10b981',padding:'3px 10px',borderRadius:50,fontSize:'.7rem',fontWeight:700}}>{nivel}</div>
          <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(99,102,241,.08)',border:'1px solid rgba(99,102,241,.2)',padding:'4px 10px 4px 4px',borderRadius:50}}>
            <div style={{width:26,height:26,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.65rem',fontWeight:700,color:'#fff'}}>
              {(user?.username||user?.name||'AC').substring(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{fontSize:'.75rem',fontWeight:600,color:'#e2e8f0'}}>{(user?.username||user?.name||'').split(' ')[0]}</div>
              <div style={{fontSize:'.62rem',color:'#64748b'}}>{xp} XP</div>
            </div>
          </div>
          <button onClick={logout} style={{background:'transparent',border:'1px solid rgba(239,68,68,.3)',color:'#ef4444',padding:'5px 12px',borderRadius:8,cursor:'pointer',fontSize:'.75rem',fontWeight:600}}>Salir</button>
        </div>
      </div>

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

        {/* ── Botón resultados del diagnóstico ─────────────────────────── */}
        {user?.diagnostico && (
          <button onClick={()=>setShowDiag(true)}
            style={{display:'flex',alignItems:'center',gap:10,width:'100%',background:'linear-gradient(135deg,rgba(139,92,246,.12),rgba(99,102,241,.08))',border:'1px solid rgba(139,92,246,.28)',borderRadius:12,padding:'11px 16px',marginBottom:'1rem',cursor:'pointer',color:'#c4b5fd',fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:'.82rem',transition:'background .2s'}}
            onMouseEnter={e=>e.currentTarget.style.background='linear-gradient(135deg,rgba(139,92,246,.2),rgba(99,102,241,.14))'}
            onMouseLeave={e=>e.currentTarget.style.background='linear-gradient(135deg,rgba(139,92,246,.12),rgba(99,102,241,.08))'}>
            <span style={{fontSize:'1.1rem'}}>📊</span>
            <span style={{flex:1,textAlign:'left'}}>Resultados de mi diagnóstico</span>
            <span style={{background:'rgba(139,92,246,.2)',color:'#c4b5fd',borderRadius:8,padding:'2px 9px',fontSize:'.72rem',fontWeight:700}}>Nivel {user.diagnostico.nivelEstimado}</span>
          </button>
        )}

        {/* ── Banner trial ─────────────────────────────────────────────── */}
        {!isPremium && !esAdmin && (trialInfo.expired ? (
          <div style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.3)',borderRadius:14,padding:'16px 20px',marginBottom:'1rem',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
            <span style={{fontSize:'1.5rem'}}>⛔</span>
            <div style={{flex:1,minWidth:200}}>
              <div style={{color:'#f87171',fontWeight:700,fontSize:'.9rem'}}>Tu período de prueba gratuita terminó</div>
              <div style={{color:'#94a3b8',fontSize:'.78rem',marginTop:2}}>Puedes explorar el contenido, pero no avanzar ni ganar XP. Contáctanos para continuar aprendiendo.</div>
            </div>
            <a href="mailto:adcerezov@tecmd.edu.co?subject=Quiero continuar en AulaQuest" style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:9,padding:'8px 18px',fontSize:'.8rem',fontWeight:700,cursor:'pointer',textDecoration:'none',whiteSpace:'nowrap'}}>
              Contactar para continuar
            </a>
          </div>
        ) : trialInfo.daysLeft !== null && (
          <div style={{background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.25)',borderRadius:14,padding:'12px 18px',marginBottom:'1rem',display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontSize:'1.2rem'}}>⏳</span>
            <div style={{flex:1}}>
              <span style={{color:'#fbbf24',fontWeight:700,fontSize:'.82rem'}}>
                {trialInfo.daysLeft === 1 ? 'Te queda 1 día de prueba gratuita' : `Te quedan ${trialInfo.daysLeft} días de prueba gratuita`}
              </span>
              <span style={{color:'#64748b',fontSize:'.75rem',marginLeft:8}}>· Contáctanos para continuar</span>
            </div>
          </div>
        ))}

          <div className="aq-topics" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:'1rem'}}>          {TOPICS.map((t,idx)=>{
            const prog    = progTemas[t.id] || {};
            const completo= prog.completo || false;
            const completadas = prog.completadas || 0;
            const total   = prog.total || (vocabData[t.id]||[]).length || 0;
            // Solo primer tema desbloqueado; los demás requieren que el anterior esté completo
            const desbloqBase = esAdmin ? true : (idx === 0
              ? true
              : (progTemas[TOPICS[idx-1]?.id]?.completo || false));
            // Bloqueo diario: solo un tema por día para usuarios no premium
            const esTemaDelDia = dailyTopicId === t.id;
            const hayTemaDelDia = dailyTopicId !== '';
            const bloqueadoDiario = !isPremium && !esAdmin && desbloqBase && !completo && hayTemaDelDia && !esTemaDelDia;
            const desbloq = desbloqBase && !bloqueadoDiario;
            const pct     = total > 0 ? Math.round((completadas/total)*100) : 0;
            const activo  = tema?.id===t.id;
            return (
              <div key={t.id}
                onClick={()=>{
                  if (!desbloqBase) {
                    setBubble('🔒 Completa el tema anterior primero para desbloquear este.');
                    setBubbleType('err'); return;
                  }
                  if (bloqueadoDiario) {
                    setBubble('🌙 Solo puedes avanzar en un tema por día. ¡Vuelve mañana para continuar!');
                    setBubbleType('err'); return;
                  }
                  setTema(activo?null:t); usedWordsRef.current=[]; setWord(null);
                  if (!activo) openCloud(t);
                }}
                style={{background: completo?'rgba(16,185,129,.08)':activo?'rgba(99,102,241,.15)':'#0f172a',border:'1px solid '+(completo?'rgba(16,185,129,.3)':activo?'rgba(99,102,241,.5)':desbloq?'rgba(99,102,241,.12)':'rgba(99,102,241,.06)'),borderRadius:11,padding:'14px 8px',textAlign:'center',cursor:desbloq?'pointer':'not-allowed',transition:'transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s ease, border-color .25s ease',opacity:desbloq?1:0.45,position:'relative',willChange:'transform',overflow:'hidden'}}
                onMouseEnter={e=>{
                  if(!desbloq) return;
                  e.currentTarget.style.transform='translateY(-8px) scale(1.04)';
                  e.currentTarget.style.boxShadow='0 14px 30px rgba(99,102,241,.35), 0 0 0 1px rgba(99,102,241,.4) inset';
                  e.currentTarget.style.borderColor= completo?'rgba(16,185,129,.6)':'rgba(99,102,241,.6)';
                }}
                onMouseLeave={e=>{
                  e.currentTarget.style.transform='translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow='none';
                  e.currentTarget.style.background= completo?'rgba(16,185,129,.08)':activo?'rgba(99,102,241,.15)':'#0f172a';
                  e.currentTarget.style.borderColor= completo?'rgba(16,185,129,.3)':activo?'rgba(99,102,241,.5)':desbloq?'rgba(99,102,241,.12)':'rgba(99,102,241,.06)';
                }}
                onMouseMove={e=>{
                  if(!desbloq) return;
                  const r=e.currentTarget.getBoundingClientRect();
                  const px=((e.clientX-r.left)/r.width)*100;
                  const py=((e.clientY-r.top)/r.height)*100;
                  e.currentTarget.style.background=`radial-gradient(circle at ${px}% ${py}%, rgba(99,102,241,.25), ${completo?'rgba(16,185,129,.08)':activo?'rgba(99,102,241,.15)':'#0f172a'} 60%)`;
                }}>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(255,255,255,.06),transparent 45%)',pointerEvents:'none'}}/>
                {completo && <div style={{position:'absolute',top:4,right:4,fontSize:'.6rem',background:'rgba(16,185,129,.2)',color:'#10b981',borderRadius:50,padding:'1px 5px',fontWeight:700}}>✓</div>}
                {!desbloqBase && <div style={{position:'absolute',top:4,right:4,fontSize:'.65rem'}}>🔒</div>}
                {bloqueadoDiario && <div style={{position:'absolute',top:4,right:4,fontSize:'.65rem'}} title="Límite diario">🌙</div>}
                <div style={{fontSize:'1.4rem',marginBottom:4}}>{t.icon}</div>
                <div style={{fontSize:'.65rem',color:completo?'#10b981':activo?'#a5b4fc':desbloq?'#64748b':'#334155',fontWeight:activo||completo?600:400,marginBottom:3}}>{t.name}</div>
                {desbloq && total>0 && (
                  <div style={{height:2,background:'rgba(99,102,241,.1)',borderRadius:2,overflow:'hidden',margin:'0 4px'}}>
                    <div style={{height:'100%',width:pct+'%',background:completo?'#10b981':'linear-gradient(90deg,#6366f1,#8b5cf6)',borderRadius:2,transition:'width .4s'}}/>
                  </div>
                )}
                {desbloq && <div style={{fontSize:'.55rem',color:'#475569',marginTop:2}}>{completadas}/{total}</div>}
              </div>
            );
          })}
        </div>
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
        <div style={{background:'linear-gradient(135deg,rgba(99,102,241,.06),rgba(139,92,246,.08))',border:'1px solid rgba(99,102,241,.2)',borderRadius:16,padding:'1.1rem 1.3rem',marginBottom:'1rem',boxShadow:'0 10px 30px rgba(0,0,0,.45)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
            <span style={{fontSize:'1.1rem'}}>💼</span>
            <span style={{fontSize:'.88rem',fontWeight:700,color:'#e2e8f0'}}>Entrevista de Trabajo con IA</span>
            <span style={{background:'rgba(99,102,241,.15)',color:'#a5b4fc',fontSize:'.6rem',fontWeight:700,padding:'2px 7px',borderRadius:50}}>RETO FINAL C2</span>
          </div>
          <p style={{color:'#64748b',fontSize:'.75rem',margin:'0 0 12px'}}>Elige a tu entrevistador y practica en inglés. Recibe feedback en tiempo real.</p>

          {(()=>{
            const ENTREVISTADORES=[
              { id:'interview', nombre:'AI Teacher', sub:'Voz · Gemini', emoji:'🌊', grad:'linear-gradient(135deg,#3b82f6,#8b5cf6,#f43f5e)', accent:'99,102,241' },
              { id:'nexa',      nombre:'NEXA',       sub:'Avatar 3D · Asistente IA', emoji:'🤖', grad:'linear-gradient(135deg,#6fe0ff,#3aa8e8,#b07aff)', accent:'58,168,232' },
              { id:'michael',   nombre:'Michael',    sub:'Avatar 3D · HR Coach', emoji:'👨‍🏫', grad:'linear-gradient(135deg,#d9a07c,#9ec4ee,#35495e)', accent:'158,196,238' },
            ];
            return (
              <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
                {ENTREVISTADORES.map(e=>(
                  <div key={e.id} onClick={()=>setScreen2(e.id)}
                    onMouseEnter={ev=>{ev.currentTarget.style.transform='translateY(-6px)';ev.currentTarget.style.boxShadow=`0 16px 40px rgba(${e.accent},.4)`;}}
                    onMouseLeave={ev=>{ev.currentTarget.style.transform='translateY(0)';ev.currentTarget.style.boxShadow='0 8px 20px rgba(0,0,0,.4)';}}
                    style={{flex:'1 1 200px',minWidth:0,cursor:'pointer',borderRadius:16,overflow:'hidden',border:`1px solid rgba(${e.accent},.3)`,background:'rgba(15,23,42,.6)',boxShadow:'0 8px 20px rgba(0,0,0,.4)',transition:'transform .25s ease, box-shadow .25s ease'}}>
                    <div style={{height:130,background:e.grad,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
                      <span style={{fontSize:'3.4rem',filter:'drop-shadow(0 4px 12px rgba(0,0,0,.5))'}}>{e.emoji}</span>
                      <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 50% 120%,rgba(255,255,255,.25),transparent 60%)'}}/>
                      <span style={{position:'absolute',top:10,right:10,background:'rgba(0,0,0,.35)',backdropFilter:'blur(4px)',color:'#fff',fontSize:'.58rem',fontWeight:700,padding:'3px 8px',borderRadius:50}}>ELEGIR ▶</span>
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

        <div style={{display:'flex',gap:'1rem',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',justifyContent:'center'}}>
        <div style={{flex:'1 1 280px',display:'flex',flexDirection:'column',gap:'1rem'}}>
        {nivel === 'A1' && (()=>{
          const temasCompletados = TOPICS.filter(t => progTemas[t.id]?.completo).length;
          const juegoDesbloqueado = esAdmin || (temasCompletados >= 3);
          const temasRestantes = Math.max(0, 3 - temasCompletados);
          return (
            <div onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-6px)';e.currentTarget.style.boxShadow='0 18px 40px rgba(16,185,129,.25)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 10px 30px rgba(0,0,0,.45)';}} style={{background: juegoDesbloqueado ? 'linear-gradient(135deg,rgba(16,185,129,.08),rgba(6,182,212,.06))' : 'rgba(15,23,42,.5)',border:'1px solid '+(juegoDesbloqueado?'rgba(16,185,129,.25)':'rgba(99,102,241,.08)'),borderRadius:16,padding:'1rem 1.5rem',marginBottom:'1rem',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem',opacity:juegoDesbloqueado?1:0.7,boxShadow:'0 10px 30px rgba(0,0,0,.45)',transition:'transform .25s ease, box-shadow .25s ease'}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{fontSize:'1.1rem'}}>{juegoDesbloqueado?'🃏':'🔒'}</span>
                  <span style={{fontSize:'.88rem',fontWeight:700,color:'#e2e8f0'}}>Empareja las Cartas</span>
                  <span style={{background:juegoDesbloqueado?'rgba(16,185,129,.15)':'rgba(245,158,11,.12)',color:juegoDesbloqueado?'#10b981':'#f59e0b',fontSize:'.6rem',fontWeight:700,padding:'2px 7px',borderRadius:50}}>
                    {juegoDesbloqueado?'MINIJUEGO A1':'BLOQUEADO'}
                  </span>
                </div>
                <p style={{color:'#64748b',fontSize:'.75rem',margin:'0 0 6px'}}>
                  {juegoDesbloqueado
                    ? 'Voltea las cartas y une cada palabra en inglés con su traducción en español. Menos movimientos = más estrellas!'
                    : 'Completa '+temasRestantes+' tema'+(temasRestantes>1?'s':'')+' más con Mr. Alex para desbloquear este juego.'}
                </p>
                {!juegoDesbloqueado && (
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:'.68rem',color:'#475569'}}>Progreso</span>
                      <span style={{fontSize:'.68rem',color:'#6366f1',fontWeight:700}}>{temasCompletados} / 3 temas</span>
                    </div>
                    <div style={{height:4,background:'rgba(99,102,241,.08)',borderRadius:10,overflow:'hidden'}}>
                      <div style={{height:'100%',width:(temasCompletados/3*100)+'%',background:'linear-gradient(90deg,#10b981,#06b6d4)',borderRadius:10,transition:'width .4s'}}/>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={()=>{ if(juegoDesbloqueado) setScreen2('memory'); }}
                style={{flexShrink:0,background:juegoDesbloqueado?'linear-gradient(135deg,#10b981,#06b6d4)':'rgba(30,41,59,.8)',color:juegoDesbloqueado?'#fff':'#334155',border:juegoDesbloqueado?'none':'1px solid rgba(99,102,241,.1)',padding:'10px 20px',borderRadius:10,fontWeight:700,fontSize:'.82rem',cursor:juegoDesbloqueado?'pointer':'not-allowed',whiteSpace:'nowrap',transition:'all .2s'}}>
                {juegoDesbloqueado?'🎮 Jugar':'🔒 Bloqueado'}
              </button>
            </div>
          );
        })()}

        {nivel === 'A2' && (()=>{
          const temasCompletados = TOPICS.filter(t => progTemas[t.id]?.completo).length;
          const juegoDesbloqueado = esAdmin || (temasCompletados >= 3);
          const temasRestantes = 3 - temasCompletados;
          return (
            <div onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-6px)';e.currentTarget.style.boxShadow='0 18px 40px rgba(99,102,241,.3)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 10px 30px rgba(0,0,0,.45)';}} style={{background: juegoDesbloqueado ? 'linear-gradient(135deg,rgba(99,102,241,.08),rgba(139,92,246,.06))' : 'rgba(15,23,42,.5)',border:'1px solid '+(juegoDesbloqueado?'rgba(99,102,241,.25)':'rgba(99,102,241,.08)'),borderRadius:16,padding:'1rem 1.5rem',marginBottom:'1rem',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem',opacity:juegoDesbloqueado?1:0.7,boxShadow:'0 10px 30px rgba(0,0,0,.45)',transition:'transform .25s ease, box-shadow .25s ease'}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span style={{fontSize:'1.1rem'}}>{juegoDesbloqueado?'🌧️':'🔒'}</span>
                  <span style={{fontSize:'.88rem',fontWeight:700,color:'#e2e8f0'}}>Lluvia de Palabras</span>
                  <span style={{background: juegoDesbloqueado?'rgba(99,102,241,.15)':'rgba(245,158,11,.12)',color:juegoDesbloqueado?'#a5b4fc':'#f59e0b',fontSize:'.6rem',fontWeight:700,padding:'2px 7px',borderRadius:50}}>
                    {juegoDesbloqueado ? 'MINIJUEGO' : 'BLOQUEADO'}
                  </span>
                </div>
                <p style={{color:'#64748b',fontSize:'.75rem',margin:'0 0 6px'}}>
                  {juegoDesbloqueado
                    ? 'Practica el vocabulario del nivel '+nivel+' de forma divertida. Atrapa las palabras antes de que caigan!'
                    : 'Completa '+temasRestantes+' tema'+(temasRestantes>1?'s':'')+' más con Mr. Alex para desbloquear este minijuego.'}
                </p>
                {!juegoDesbloqueado && (
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:'.68rem',color:'#475569'}}>Progreso</span>
                      <span style={{fontSize:'.68rem',color:'#6366f1',fontWeight:700}}>{temasCompletados} / 3 temas</span>
                    </div>
                    <div style={{height:4,background:'rgba(99,102,241,.08)',borderRadius:10,overflow:'hidden'}}>
                      <div style={{height:'100%',width:(temasCompletados/3*100)+'%',background:'linear-gradient(90deg,#6366f1,#8b5cf6)',borderRadius:10,transition:'width .4s'}}/>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={()=>{ if(juegoDesbloqueado) setScreen2('wordrain'); }}
                style={{flexShrink:0,background:juegoDesbloqueado?'linear-gradient(135deg,#6366f1,#8b5cf6)':'rgba(30,41,59,.8)',color:juegoDesbloqueado?'#fff':'#334155',border:juegoDesbloqueado?'none':'1px solid rgba(99,102,241,.1)',padding:'10px 20px',borderRadius:10,fontWeight:700,fontSize:'.82rem',cursor:juegoDesbloqueado?'pointer':'not-allowed',whiteSpace:'nowrap',boxShadow:juegoDesbloqueado?'0 0 20px rgba(99,102,241,.25)':'none',transition:'all .2s'}}>
                {juegoDesbloqueado ? '🎮 Jugar' : '🔒 Bloqueado'}
              </button>
            </div>
          );
        })()}

        {['B1','B2','C1','C2'].includes(nivel) && (()=>{
          const CFG = {
            B1: { nombre:'The Alibi Generator', icono:'🕵️', accent:'0,173,181',  txt:'#00adb5', screen:'alibi',    grad:'linear-gradient(135deg,#00adb5,#0a7d82)', desc:'Crea una coartada perfecta y resiste el interrogatorio usando Past Continuous y conectores B1 (because, while, although).' },
            B2: { nombre:'Influencer Crisis Manager', icono:'📢', accent:'168,85,247', txt:'#c4b5fd', screen:'crisis',   grad:'linear-gradient(135deg,#a855f7,#7c3aed)', desc:'Maneja una crisis de relaciones públicas de un influencer usando especulación B2, condicionales mixtos y voz pasiva.' },
            C1: { nombre:'The Startup Shark Tank', icono:'🦈', accent:'6,182,212',  txt:'#67e8f9', screen:'sharktank', grad:'linear-gradient(135deg,#06b6d4,#0891b2)', desc:'Presenta tu startup ante inversionistas usando inversiones formales, idioms de negocios y phrasal verbs C1 bajo presión.' },
            C2: { nombre:'Geopolitical Crisis Room', icono:'🌍', accent:'244,63,94',  txt:'#fda4af', screen:'crisisroom', grad:'linear-gradient(135deg,#f43f5e,#be123c)', desc:'Lidera un comité internacional ante una crisis global usando retórica C2, diplomacia, subjuntivo y condicionales sin "if".' },
          }[nivel];
          const temasCompletados = TOPICS.filter(t => progTemas[t.id]?.completo).length;
          const juegoDesbloqueado = esAdmin || (temasCompletados >= 3);
          const temasRestantes = Math.max(0, 3 - temasCompletados);
          const accent = CFG.accent;
          return (
            <div onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-6px)';e.currentTarget.style.boxShadow=`0 18px 40px rgba(${accent},.3)`;}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 10px 30px rgba(0,0,0,.45)';}} style={{background: juegoDesbloqueado ? `linear-gradient(135deg,rgba(${accent},.08),rgba(${accent},.04))` : 'rgba(15,23,42,.5)',border:'1px solid '+(juegoDesbloqueado?`rgba(${accent},.25)`:'rgba(99,102,241,.08)'),borderRadius:16,padding:'1rem 1.5rem',marginBottom:'1rem',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem',opacity:juegoDesbloqueado?1:0.7,boxShadow:'0 10px 30px rgba(0,0,0,.45)',transition:'transform .25s ease, box-shadow .25s ease'}}>
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

        <div style={{flex:'0 0 auto',display:'flex',flexDirection:'column',alignItems:'center',gap:6,cursor:'pointer',padding:'0 .4rem'}} onClick={()=>openCloud(tema||null)}>
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
          const puedeExamen  = quizHabil && !yaAprobado;
          const temasTotal   = TOPICS.length;
          const temasHechos  = TOPICS.filter(t=>progTemas[t.id]?.completo).length;
          const progExamen   = temasTotal>0 ? Math.round((temasHechos/temasTotal)*100) : 0;

          if (yaAprobado) return (
            <div style={{background:'rgba(16,185,129,.06)',border:'1px solid rgba(16,185,129,.2)',borderRadius:16,padding:'1rem 1.5rem',marginBottom:'1rem',display:'flex',alignItems:'center',gap:12}}>
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
            <div onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-6px)';e.currentTarget.style.boxShadow='0 18px 40px rgba(16,185,129,.25)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 10px 30px rgba(0,0,0,.45)';}} style={{background: puedeExamen ? 'linear-gradient(135deg,rgba(16,185,129,.08),rgba(6,182,212,.06))' : 'rgba(15,23,42,.5)',border:`1px solid ${puedeExamen ? 'rgba(16,185,129,.25)' : 'rgba(99,102,241,.12)'}`,borderRadius:16,padding:'1.2rem 1.5rem',marginBottom:'1rem',boxShadow:'0 10px 30px rgba(0,0,0,.45)',transition:'transform .25s ease, box-shadow .25s ease'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem'}}>
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

      <div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(2,6,23,.85)',opacity:cloudOpen?1:0,pointerEvents:cloudOpen?'all':'none',transition:'opacity .3s',display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem'}}>
        <div style={{background:'#0a0f1e',borderRadius:20,border:'1px solid rgba(99,102,241,.3)',padding:'1.8rem 2rem',width:'100%',maxWidth:'min(600px, 95vw)',transform:cloudOpen?'translateY(0)':'translateY(30px)',transition:'transform .4s cubic-bezier(.22,.61,.36,1)',position:'relative',boxShadow:'0 0 60px rgba(99,102,241,.25)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:'.8rem',fontWeight:700,color:'#6366f1',letterSpacing:'.08em'}}>MR. ALEX</span>
              {tema&&<span style={{background:'rgba(99,102,241,.15)',color:'#a5b4fc',padding:'2px 8px',borderRadius:50,fontSize:'.62rem',fontWeight:700}}>{tema.name}</span>}
              <span style={{background:'rgba(16,185,129,.15)',color:'#10b981',padding:'2px 8px',borderRadius:50,fontSize:'.62rem',fontWeight:700}}>EN VIVO</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {correct>=3&&<span style={{fontSize:'.75rem',fontWeight:700,color:'#f59e0b'}}>Racha {correct}</span>}
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
                    const r=await fetch('https://nexlum-aulaquest.onrender.com/api/tts/speak-slow',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},body:JSON.stringify({text:word.en})});
                    if(r.ok){const blob=await r.blob();const url=URL.createObjectURL(blob);const a=new Audio(url);_currentAudio=a;a.play();}
                    else throw new Error();
                  } catch {
                    const u=new SpeechSynthesisUtterance(word.en);u.lang='en-US';u.rate=0.35;u.pitch=1.0;window.speechSynthesis&&window.speechSynthesis.speak(u);
                  }
                }} style={{background:'none',border:'1px solid rgba(99,102,241,.2)',color:'#64748b',cursor:'pointer',fontSize:'.72rem',padding:'4px 10px',borderRadius:8}}>
                  🐢 Despacio
                </button>
              </div>
            </div>
          ):(
            <div style={{background:'#020617',border:'1px dashed rgba(99,102,241,.2)',borderRadius:14,padding:'1.5rem',textAlign:'center',marginBottom:'1rem',color:'#334155',fontSize:'.85rem'}}>Toca "Nueva palabra" para comenzar</div>
          )}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <button onClick={getWord} style={{border:'none',padding:'12px',borderRadius:12,fontWeight:700,fontSize:'.82rem',cursor:'pointer',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff'}}>Nueva palabra</button>
            <button onClick={startListen} disabled={!word||listening}
              style={{border:'none',padding:'12px',borderRadius:12,fontWeight:700,fontSize:'.82rem',cursor:(!word||listening)?'not-allowed':'pointer',background:listening?'#eab308':'#10b981',color:listening?'#0f172a':'#fff',opacity:!word?0.4:1,animation:listening?'pulseBtn 1s ease-in-out infinite':'none'}}>
              {listening?'Escuchando...':'Pronunciar'}
            </button>
          </div>
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