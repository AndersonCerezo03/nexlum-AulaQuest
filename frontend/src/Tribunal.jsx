import { useState, useEffect, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || 'https://nexlum-aulaquest.onrender.com';

// ─── El Tribunal (C2) — juego de retórica (Fase 1: texto, polling) ───
// Paleta y tipografía del prototipo: ink/parchment/oxblood/gold/verdigris,
// Cinzel (display) + Spectral (body) + JetBrains Mono (utilitaria).
const T = {
  ink:'#12100D', panel:'#1B1712', panel2:'#221D16', parchment:'#EEE4CC', pink:'#241B12',
  oxblood:'#7C2E2E', oxbloodB:'#A63D3D', gold:'#C9A24B', goldB:'#E4C36E',
  verdigris:'#3E6259', verdigrisB:'#5A8B7E', muted:'#9C8F78', line:'rgba(201,162,75,0.25)',
};
const DEV = {
  hedging:'Atenuación (hedging)', litotes:'Lítotes', irony:'Ironía', euphemism:'Eufemismo',
  hyperbole:'Hipérbole', rhetorical_question:'Pregunta retórica', nominalization:'Nominalización',
};
const REG = { formal:'Formal', academic:'Académico', diplomatic:'Diplomático' };
const FONTS = "@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Spectral:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;600&display=swap');";

export default function TribunalGame({ token, user, onBack }) {
  const myId = String(user?._id || user?.id || '');
  const [ui, setUi]     = useState('menu');   // menu | lobby | round | final
  const [err, setErr]   = useState('');
  const [code, setCode] = useState('');
  const [joinCode, setJoin] = useState('');
  const [matchId, setMatchId] = useState('');
  const [match, setMatch] = useState(null);
  const [roundId, setRoundId] = useState('');
  const [round, setRound] = useState(null);
  const [board, setBoard] = useState(null);
  // borradores
  const [argDraft, setArg] = useState('');
  const [qDraft, setQ] = useState('');
  const [aDraft, setA] = useState('');
  const [tags, setTags] = useState([]);
  const [bluff, setBluff] = useState(null);
  const [regBreak, setRegBreak] = useState(null);
  const [busy, setBusy] = useState(false);
  const pollRef = useRef(null);
  const authH = { 'Content-Type':'application/json', Authorization:'Bearer '+token };

  const post = async (u, b) => { const r = await fetch(API+u, { method:'POST', headers:authH, body:JSON.stringify(b||{}) }); return r.json(); };
  const get  = async (u) => { const r = await fetch(API+u, { headers:authH }); return r.ok ? r.json() : null; };

  // Polling: estado de la sala + ronda actual
  useEffect(() => {
    if (!code) return;
    const poll = async () => {
      const m = await get('/api/tribunal/match/'+code);
      if (m) { setMatch(m); if (m.currentRoundId && String(m.currentRoundId)!==roundId) setRoundId(String(m.currentRoundId)); }
      const rid = (m && m.currentRoundId) ? String(m.currentRoundId) : roundId;
      if (rid) { const r = await get('/api/tribunal/round/'+rid); if (r) { setRound(r); setUi(u=>u==='menu'||u==='lobby'? 'round':u); } }
      else if (m) setUi(u=>u==='menu'?'lobby':u);
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => clearInterval(pollRef.current);
  }, [code, roundId]);

  // reset de borradores al cambiar de fase/ronda
  useEffect(() => { setArg(''); setQ(''); setA(''); setTags([]); setBluff(null); setRegBreak(null); }, [round?.roundId, round?.phase]);

  const crear = async () => { setErr(''); const d = await post('/api/tribunal/match'); if (d.ok){ setCode(d.code); setMatchId(d.matchId); setUi('lobby'); } else setErr(d.msg||'Error'); };
  const unirse = async () => { setErr(''); if(!/^\d{4}$/.test(joinCode)){ setErr('Código de 4 dígitos'); return;} const d = await post('/api/tribunal/match/'+joinCode+'/join'); if(d.ok){ setCode(joinCode); setMatchId(d.matchId); setUi('lobby'); } else setErr(d.msg||'Error'); };
  const iniciar = async () => { setBusy(true); const d = await post('/api/tribunal/match/'+matchId+'/start-round'); if(!d.ok) setErr(d.msg||'Error'); setBusy(false); };
  const act = async (u, b) => { setBusy(true); const d = await post(u, b); if(!d.ok && d.msg) setErr(d.msg); setBusy(false); return d; };
  const verFinal = async () => { const lb = await get('/api/tribunal/leaderboard'); setBoard(lb?lb.top:[]); setUi('final'); };

  const S = {
    page:{ minHeight:'100vh', background:`radial-gradient(1200px 700px at 50% -5%, #241B14, ${T.ink} 60%)`, color:T.parchment, fontFamily:"'Spectral', serif", paddingBottom:'2rem' },
    wrap:{ maxWidth:600, margin:'0 auto', padding:'0 16px' },
    card:{ background:`linear-gradient(180deg, ${T.panel}, ${T.panel2})`, border:'1px solid '+T.line, borderRadius:14, padding:'1.2rem', boxShadow:'0 20px 50px rgba(0,0,0,.55)' },
    disp:{ fontFamily:"'Cinzel', serif" }, mono:{ fontFamily:"'JetBrains Mono', monospace" },
    btn:{ border:'2px solid '+T.gold, borderRadius:10, padding:'12px 20px', fontWeight:700, cursor:'pointer', fontFamily:"'Cinzel', serif", letterSpacing:'.03em', background:`linear-gradient(180deg, ${T.goldB}, ${T.gold})`, color:T.ink },
    ghost:{ border:'1px solid '+T.line, borderRadius:10, padding:'11px 18px', fontWeight:600, cursor:'pointer', background:'transparent', color:T.goldB, fontFamily:"'Cinzel', serif" },
    input:{ width:'100%', boxSizing:'border-box', background:T.parchment, color:T.pink, border:'1px solid '+T.gold, borderRadius:10, padding:'12px 14px', fontFamily:"'Spectral', serif", fontSize:'.95rem', outline:'none' },
  };
  const header = (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 0 12px', borderBottom:'1px solid '+T.line, marginBottom:16 }}>
      <button onClick={onBack} style={{ ...S.ghost, padding:'6px 12px', fontSize:'.72rem' }}>← Salir</button>
      <div style={{ ...S.disp, fontSize:'1.15rem', color:T.goldB, letterSpacing:'.08em' }}>⚖️ EL TRIBUNAL</div>
      <span style={{ ...S.mono, fontSize:'.6rem', color:T.muted }}>C2 · RETÓRICA</span>
    </div>
  );
  const errBox = err && <div style={{ background:'rgba(179,63,63,.15)', border:'1px solid rgba(179,63,63,.5)', borderRadius:10, padding:'9px 14px', margin:'8px 0', color:'#e6a5a5', fontSize:'.82rem' }}>{err}</div>;
  const Bar = ({ label, val, color }) => (
    <div style={{ marginBottom:6 }}>
      <div style={{ display:'flex', justifyContent:'space-between', ...S.mono, fontSize:'.6rem', color:T.muted }}><span>{label}</span><span>{val}</span></div>
      <div style={{ height:8, background:'rgba(0,0,0,.35)', borderRadius:6, overflow:'hidden', border:'1px solid '+T.line }}><div style={{ height:'100%', width:val+'%', background:color, borderRadius:6, transition:'width .5s' }}/></div>
    </div>
  );
  const roles = { advocate:'Abogado', cross_examiner:'Interrogador', jury:'Jurado' };

  // ═══ MENU ═══
  if (ui === 'menu') return (
    <div style={S.page}><style>{FONTS}</style><div style={S.wrap}>
      {header}{errBox}
      <div style={{ textAlign:'center', margin:'1rem 0 1.4rem' }}>
        <div style={{ fontSize:'2.6rem' }}>⚖️</div>
        <h2 style={{ ...S.disp, margin:'6px 0 2px', color:T.goldB, fontWeight:700 }}>El Tribunal de la Retórica</h2>
        <p style={{ color:T.muted, fontSize:'.86rem', margin:0 }}>Cumple un mandato retórico secreto, engaña al jurado o desenmascara al abogado. 2-4 jugadores.</p>
      </div>
      <div style={{ ...S.card, marginBottom:12, textAlign:'center' }}>
        <div style={{ ...S.disp, color:T.parchment, marginBottom:8 }}>Convocar sesión</div>
        <button onClick={crear} style={{ ...S.btn, width:'100%' }}>Crear sala</button>
      </div>
      <div style={{ ...S.card, textAlign:'center' }}>
        <div style={{ ...S.disp, color:T.parchment, marginBottom:8 }}>Unirse con código</div>
        <input value={joinCode} onChange={e=>setJoin(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="0000" inputMode="numeric"
          style={{ ...S.input, textAlign:'center', letterSpacing:'.4em', fontSize:'1.3rem', width:150, margin:'0 auto 10px', display:'block', ...S.mono }}/>
        <button onClick={unirse} style={{ ...S.ghost, width:'100%' }}>Entrar</button>
      </div>
    </div></div>
  );

  // ═══ LOBBY ═══
  if (ui === 'lobby' && match) {
    const soyHost = String(match.hostUserId) === myId;
    return (
      <div style={S.page}><style>{FONTS}</style><div style={S.wrap}>
        {header}{errBox}
        <div style={{ ...S.card, textAlign:'center', marginBottom:14 }}>
          <div style={{ ...S.mono, fontSize:'.62rem', color:T.muted }}>CÓDIGO DE LA SALA</div>
          <div style={{ ...S.disp, fontSize:'2.4rem', color:T.goldB, letterSpacing:'.3em', paddingLeft:'.3em' }}>{match.code}</div>
          <div style={{ color:T.muted, fontSize:'.72rem' }}>Comparte el código (2-4 jugadores)</div>
        </div>
        <div style={{ ...S.card, marginBottom:14 }}>
          <div style={{ ...S.disp, fontSize:'.9rem', color:T.parchment, marginBottom:10 }}>Litigantes ({match.players.length}/4)</div>
          {match.players.map((p,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:i<match.players.length-1?'1px solid '+T.line:'none' }}>
              <div style={{ width:30, height:30, borderRadius:'50%', border:'1px solid '+T.gold, display:'flex', alignItems:'center', justifyContent:'center', ...S.mono, fontSize:'.65rem', color:T.goldB }}>{(p.name||'?').slice(0,2).toUpperCase()}</div>
              <span style={{ flex:1, fontWeight:600 }}>{p.name}{String(p.userId)===myId?' (tú)':''}</span>
              {String(p.userId)===String(match.hostUserId) && <span title="Anfitrión">👑</span>}
            </div>
          ))}
        </div>
        {soyHost
          ? <button onClick={iniciar} disabled={busy||match.players.length<2} style={{ ...S.btn, width:'100%', opacity:(busy||match.players.length<2)?.5:1 }}>{match.players.length<2?'Esperando jugadores…':'Iniciar el juicio'}</button>
          : <div style={{ textAlign:'center', color:T.muted, fontSize:'.82rem' }}>Esperando a que el anfitrión inicie…</div>}
      </div></div>
    );
  }

  // ═══ FINAL ═══
  if (ui === 'final') return (
    <div style={S.page}><style>{FONTS}</style><div style={S.wrap}>
      {header}
      <div style={{ ...S.card, textAlign:'center', marginBottom:14 }}>
        <div style={{ fontSize:'2rem' }}>🏛️</div>
        <h2 style={{ ...S.disp, color:T.goldB, margin:'4px 0' }}>Ranking de la Corte</h2>
      </div>
      <div style={S.card}>
        {(!board||!board.length) && <div style={{ color:T.muted, fontSize:'.82rem', textAlign:'center' }}>Aún no hay veredictos registrados.</div>}
        {(board||[]).map((r,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:i<board.length-1?'1px solid '+T.line:'none' }}>
            <span style={{ ...S.disp, width:22, color:i<3?T.goldB:T.muted }}>{i+1}</span>
            <span style={{ flex:1, fontWeight:600 }}>{r.name}</span>
            <span style={{ ...S.mono, fontSize:'.68rem', color:T.verdigrisB }}>{r.rankTitle}</span>
            <span style={{ ...S.disp, color:T.goldB, width:36, textAlign:'right' }}>{r.avg}</span>
          </div>
        ))}
      </div>
      <button onClick={()=>{ setUi('menu'); setCode(''); setMatch(null); setRound(null); setRoundId(''); }} style={{ ...S.btn, width:'100%', marginTop:14 }}>Nueva sesión</button>
    </div></div>
  );

  // ═══ RONDA ═══
  if (ui === 'round' && round) {
    const soyAdvocate = String(round.advocateUserId) === myId;
    const soyInterrog = String(round.crossExaminerUserId) === myId;
    const soyHost = String(round.hostUserId) === myId;
    const yo = (round.players||[]).find(p=>String(p.userId)===myId);
    const miRol = yo ? yo.role : 'jury';
    const toggleTag = (d) => setTags(t=> t.includes(d) ? t.filter(x=>x!==d) : [...t,d]);

    return (
      <div style={S.page}><style>{FONTS}</style><div style={S.wrap}>
        {header}{errBox}
        {/* Caso */}
        <div style={{ ...S.card, marginBottom:14, borderColor:'rgba(201,162,75,.4)' }}>
          <div style={{ ...S.mono, fontSize:'.6rem', color:T.gold, letterSpacing:'.1em' }}>CASO · Ronda {round.currentRoundIndex+1}/{round.totalRounds} · Tú eres <b style={{color:T.goldB}}>{roles[miRol]}</b></div>
          <div style={{ ...S.disp, fontSize:'1.05rem', color:T.parchment, margin:'6px 0 4px' }}>{round.caseTitle}</div>
          <div style={{ color:T.muted, fontSize:'.85rem', lineHeight:1.6 }}>{round.caseText}</div>
        </div>

        {/* Mandato secreto (solo advocate) */}
        {round.mandate && round.phase!=='verdict' && (
          <div style={{ ...S.card, marginBottom:14, background:`repeating-linear-gradient(45deg, rgba(124,46,46,.18) 0 12px, rgba(166,61,61,.14) 12px 24px)`, border:'2px solid '+T.gold }}>
            <div style={{ ...S.mono, fontSize:'.6rem', color:T.goldB, letterSpacing:'.1em' }}>🔒 TU MANDATO SECRETO (nadie más lo ve)</div>
            <div style={{ marginTop:6, fontSize:'.9rem' }}>Usa: <b style={{color:T.goldB}}>{round.mandate.requiredDevices.map(d=>DEV[d]||d).join(' + ')}</b></div>
            <div style={{ fontSize:'.85rem' }}>Registro: <b>{REG[round.mandate.registerTarget]}</b> · Bluff: <b>{round.mandate.requiresBluff?'SÍ (afirma algo falso con autoridad)':'no'}</b></div>
            {round.mandate.requiresBluff && round.mandate.bluffInstruction && <div style={{ fontSize:'.78rem', color:'#e0b0b0', marginTop:4, fontStyle:'italic' }}>{round.mandate.bluffInstruction}</div>}
          </div>
        )}

        {/* Transcript del argumento */}
        {round.transcript && (
          <div style={{ ...S.card, marginBottom:14 }}>
            <div style={{ ...S.mono, fontSize:'.6rem', color:T.muted }}>ARGUMENTO DEL ABOGADO</div>
            <div style={{ fontSize:'.9rem', lineHeight:1.6, marginTop:4, fontStyle:'italic' }}>“{round.transcript}”</div>
            {round.crossExamQuestion && <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid '+T.line }}><div style={{ ...S.mono, fontSize:'.58rem', color:T.gold }}>CONTRA-INTERROGATORIO</div><div style={{ fontSize:'.85rem' }}><b>P:</b> {round.crossExamQuestion}</div>{round.crossExamAnswer && <div style={{ fontSize:'.85rem' }}><b>R:</b> {round.crossExamAnswer}</div>}</div>}
          </div>
        )}

        {/* ── Acciones por fase ── */}
        {round.phase==='arguing' && soyAdvocate && (
          <div style={S.card}>
            <div style={{ ...S.disp, color:T.parchment, marginBottom:8 }}>Redacta tu argumento</div>
            <textarea value={argDraft} onChange={e=>setArg(e.target.value)} rows={5} placeholder="Presenta tu caso cumpliendo el mandato en secreto…" style={{ ...S.input, resize:'vertical' }}/>
            <button onClick={()=>act('/api/tribunal/round/'+round.roundId+'/submit-argument',{transcript:argDraft})} disabled={busy||argDraft.trim().length<10} style={{ ...S.btn, width:'100%', marginTop:10, opacity:(busy||argDraft.trim().length<10)?.5:1 }}>Presentar ante la Corte</button>
          </div>
        )}
        {round.phase==='arguing' && !soyAdvocate && <div style={{ ...S.card, textAlign:'center', color:T.muted }}>El Abogado prepara su argumento en secreto…</div>}

        {round.phase==='cross_exam' && soyInterrog && !round.crossExamQuestion && (
          <div style={S.card}>
            <div style={{ ...S.disp, color:T.parchment, marginBottom:8 }}>Tu contra-interrogatorio</div>
            <input value={qDraft} onChange={e=>setQ(e.target.value)} placeholder="Haz una pregunta que ponga a prueba al Abogado…" style={S.input}/>
            <button onClick={()=>act('/api/tribunal/round/'+round.roundId+'/submit-cross-question',{question:qDraft})} disabled={busy||qDraft.trim().length<5} style={{ ...S.btn, width:'100%', marginTop:10, opacity:(busy||qDraft.trim().length<5)?.5:1 }}>Preguntar</button>
          </div>
        )}
        {round.phase==='cross_exam' && soyAdvocate && round.crossExamQuestion && !round.crossExamAnswer && (
          <div style={S.card}>
            <div style={{ ...S.disp, color:T.parchment, marginBottom:8 }}>Responde manteniendo tu registro</div>
            <textarea value={aDraft} onChange={e=>setA(e.target.value)} rows={3} placeholder="Responde con aplomo, sin romper tu registro…" style={{ ...S.input, resize:'vertical' }}/>
            <button onClick={()=>act('/api/tribunal/round/'+round.roundId+'/submit-cross-answer',{answer:aDraft})} disabled={busy||aDraft.trim().length<5} style={{ ...S.btn, width:'100%', marginTop:10, opacity:(busy||aDraft.trim().length<5)?.5:1 }}>Responder</button>
          </div>
        )}
        {round.phase==='cross_exam' && !( (soyInterrog&&!round.crossExamQuestion) || (soyAdvocate&&round.crossExamQuestion&&!round.crossExamAnswer) ) && <div style={{ ...S.card, textAlign:'center', color:T.muted }}>Contra-interrogatorio en curso…</div>}

        {round.phase==='jury_voting' && !soyAdvocate && !round.iVoted && (
          <div style={S.card}>
            <div style={{ ...S.disp, color:T.parchment, marginBottom:8 }}>Tu veredicto de jurado</div>
            <div style={{ ...S.mono, fontSize:'.58rem', color:T.muted, marginBottom:6 }}>¿Qué recursos retóricos detectas?</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:12 }}>
              {Object.keys(DEV).map(d=>(
                <button key={d} onClick={()=>toggleTag(d)} style={{ padding:'6px 11px', borderRadius:50, cursor:'pointer', fontSize:'.72rem', fontFamily:"'Spectral',serif", border:'1px solid '+(tags.includes(d)?T.goldB:T.line), background:tags.includes(d)?'rgba(201,162,75,.2)':'transparent', color:tags.includes(d)?T.goldB:T.muted }}>{DEV[d]}</button>
              ))}
            </div>
            <div style={{ display:'flex', gap:12, marginBottom:12, flexWrap:'wrap' }}>
              <div><div style={{ ...S.mono, fontSize:'.58rem', color:T.muted, marginBottom:4 }}>¿Hubo un Bluff?</div>{[['Sí',true],['No',false]].map(([l,v])=>(<button key={l} onClick={()=>setBluff(v)} style={{ padding:'5px 12px', marginRight:6, borderRadius:8, cursor:'pointer', border:'1px solid '+(bluff===v?T.oxbloodB:T.line), background:bluff===v?'rgba(166,61,61,.25)':'transparent', color:bluff===v?'#e6b3b3':T.muted, fontFamily:"'Spectral',serif" }}>{l}</button>))}</div>
              <div><div style={{ ...S.mono, fontSize:'.58rem', color:T.muted, marginBottom:4 }}>¿Quiebre de registro?</div>{[['Sí',true],['No',false]].map(([l,v])=>(<button key={l} onClick={()=>setRegBreak(v)} style={{ padding:'5px 12px', marginRight:6, borderRadius:8, cursor:'pointer', border:'1px solid '+(regBreak===v?T.verdigrisB:T.line), background:regBreak===v?'rgba(90,139,126,.25)':'transparent', color:regBreak===v?'#a9d3c8':T.muted, fontFamily:"'Spectral',serif" }}>{l}</button>))}</div>
            </div>
            <button onClick={()=>act('/api/tribunal/round/'+round.roundId+'/submit-jury-vote',{taggedDevices:tags,bluffVote:!!bluff,registerBreakVote:!!regBreak})} disabled={busy||bluff===null||regBreak===null} style={{ ...S.btn, width:'100%', opacity:(busy||bluff===null||regBreak===null)?.5:1 }}>Emitir voto</button>
          </div>
        )}
        {round.phase==='jury_voting' && (soyAdvocate || round.iVoted) && <div style={{ ...S.card, textAlign:'center', color:T.muted }}>El jurado delibera… ({round.votesCount}/{round.juryTotal})</div>}

        {/* ── VEREDICTO ── */}
        {round.phase==='verdict' && round.verdict && (()=>{ const v=round.verdict; const o=(round.outcomes||{})[myId]; return (
          <div>
            <div style={{ ...S.card, marginBottom:14, textAlign:'center', border:'2px solid '+T.gold }}>
              <div style={{ width:64, height:64, margin:'0 auto 8px', borderRadius:'50%', background:`radial-gradient(circle at 35% 30%, ${T.oxbloodB}, ${T.oxblood})`, border:'2px solid '+T.gold, display:'flex', alignItems:'center', justifyContent:'center', ...S.disp, fontSize:'1.4rem', color:T.parchment, boxShadow:'0 6px 20px rgba(0,0,0,.5)' }}>⚖️</div>
              <div style={{ ...S.disp, color:T.goldB, fontSize:'1.1rem' }}>Veredicto del Magistrado</div>
              <div style={{ color:T.muted, fontSize:'.82rem', marginTop:6, fontStyle:'italic' }}>{v.shortRationale}</div>
            </div>
            <div style={{ ...S.card, marginBottom:14 }}>
              <div style={{ ...S.mono, fontSize:'.6rem', color:T.gold, marginBottom:6 }}>ANÁLISIS</div>
              <div style={{ fontSize:'.85rem', marginBottom:4 }}>Recursos realmente usados: <b style={{color:T.goldB}}>{v.actualDevicesUsed.map(d=>DEV[d]||d).join(', ')||'ninguno'}</b></div>
              <div style={{ fontSize:'.82rem', color:T.muted }}>Fidelidad al mandato: {v.mandateFidelity} · Bluff: {v.bluffWasPresent?'sí':'no'} ({v.bluffExecutionScore}) · Registro: {v.registerBreakOccurred?'quebrado':'consistente'} ({v.registerConsistencyScore}) · Aplomo: {v.crossExamComposureScore} · Dificultad: {v.magistrateConfidence}</div>
              {o && <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid '+T.line, fontSize:'.82rem' }}>{o.role==='advocate' ? <>Tu desempeño como Abogado — compuesto {o.composite}. </> : <>Como Jurado — detección {o.detectionScore}, bluff {o.bluffCorrect?'✓':'✗'}, registro {o.registerCorrect?'✓':'✗'}, calibración {o.calibration}. </>}<span style={{color:T.goldB}}>ΔE {o.dEthos>=0?'+':''}{o.dEthos} · ΔP {o.dPathos>=0?'+':''}{o.dPathos} · ΔL {o.dLogos>=0?'+':''}{o.dLogos}</span></div>}
            </div>
            <div style={{ ...S.card, marginBottom:14 }}>
              <div style={{ ...S.mono, fontSize:'.6rem', color:T.gold, marginBottom:8 }}>TRIBUNAL — Ethos / Pathos / Logos</div>
              {(round.players||[]).map((p,i)=>(
                <div key={i} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:'.8rem', fontWeight:600, marginBottom:3 }}>{p.name}{String(p.userId)===myId?' (tú)':''}</div>
                  <Bar label="Ethos" val={p.ethos} color={`linear-gradient(90deg,${T.oxblood},${T.oxbloodB})`}/>
                  <Bar label="Pathos" val={p.pathos} color={`linear-gradient(90deg,${T.verdigris},${T.verdigrisB})`}/>
                  <Bar label="Logos" val={p.logos} color={`linear-gradient(90deg,${T.gold},${T.goldB})`}/>
                </div>
              ))}
            </div>
            {round.matchStatus==='finished'
              ? <button onClick={verFinal} style={{ ...S.btn, width:'100%' }}>Ver ranking final 🏛️</button>
              : soyHost
                ? <button onClick={iniciar} disabled={busy} style={{ ...S.btn, width:'100%', opacity:busy?.5:1 }}>Siguiente ronda →</button>
                : <div style={{ textAlign:'center', color:T.muted, fontSize:'.82rem' }}>Esperando la siguiente ronda…</div>}
          </div>
        );})()}
      </div></div>
    );
  }

  return <div style={S.page}><style>{FONTS}</style><div style={S.wrap}>{header}{errBox}<div style={{ textAlign:'center', color:T.muted, marginTop:'3rem' }}>Convocando la Corte…</div></div></div>;
}
