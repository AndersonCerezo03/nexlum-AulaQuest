const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('✅ MongoDB conectado'); seed(); })
  .catch(err => { console.error('❌', err.message); process.exit(1); });

const GrimoireCard = require('../models/GrimoireCard');

const C = [];
let _n = 0;
// dmg card
const D = (school, nombre, valor, seg, q, qEs, opts, ans, fen, fes, extra) =>
  C.push(Object.assign({ cardId: school + '_' + (++_n), school, nombre, tipo: 'damage', valor, rareza: 'common', segundos: seg, reto: { q, qEs, opts, ans, feedback: { en: fen, es: fes }, say: '', accent: '' } }, extra || {}));
// heal card
const H = (nombre, valor, seg, q, qEs, opts, ans, fen, fes) =>
  C.push({ cardId: 'nature_' + (++_n), school: 'nature', nombre, tipo: 'heal', valor, rareza: 'common', segundos: seg, reto: { q, qEs, opts, ans, feedback: { en: fen, es: fes }, say: '', accent: '' } });
// listening card
const L = (nombre, valor, seg, say, accent, opts, ans, fen, fes) =>
  C.push({ cardId: 'shield_' + (++_n), school: 'shield', nombre, tipo: 'damage', valor, rareza: 'rare', segundos: seg, reto: { q: 'Listen and choose what you heard.', qEs: 'Escucha y elige lo que oíste.', opts, ans, feedback: { en: fen, es: fes }, say, accent } });
// legendary idiom
const LEG = (nombre, q, qEs, opts, ans, fen, fes) =>
  C.push({ cardId: 'legendary_' + (++_n), school: 'legendary', nombre, tipo: 'damage', valor: 50, rareza: 'legendary', segundos: 14, reto: { q, qEs, opts, ans, feedback: { en: fen, es: fes }, say: '', accent: '' } });

// 🔥 FIRE — Collocations
D('fire','Heavy Rain',22,11,'Complete: "There was ___ rain all night."','Completa: "There was ___ rain all night."',['heavy','strong','big','hard'],0,'We say HEAVY rain, not strong/big rain.','Se dice HEAVY rain, no strong/big rain.');
D('fire','Make a Decision',22,11,'Complete: "We need to ___ a decision today."','Completa: "We need to ___ a decision today."',['make','do','take','have'],0,'You MAKE a decision (not do).','Se dice MAKE a decision (no do).');
D('fire','Strong Coffee',20,10,'Complete: "I need a ___ coffee to wake up."','Completa: "I need a ___ coffee to wake up."',['strong','heavy','hard','big'],0,'Coffee is STRONG, rain is heavy.','El café es STRONG; la lluvia, heavy.');
D('fire','Deeply Regret',24,11,'Complete: "We ___ regret the inconvenience."','Completa: "We ___ regret the inconvenience."',['deeply','highly','strongly','heavily'],0,'DEEPLY regret is the natural collocation.','DEEPLY regret es la colocación natural.');
D('fire','Highly Unlikely',24,11,'Complete: "It is ___ unlikely to happen."','Completa: "It is ___ unlikely to happen."',['highly','deeply','strongly','hardly'],0,'HIGHLY unlikely / highly likely.','HIGHLY unlikely / highly likely.');
D('fire','Vested Interest',26,12,'Complete: "He has a ___ interest in the deal."','Completa: "He has a ___ interest in the deal."',['vested','invested','vesting','vain'],0,'A VESTED interest = a personal stake.','A VESTED interest = un interés personal.');
D('fire','Foregone Conclusion',28,12,'Complete: "The result was a ___ conclusion."','Completa: "The result was a ___ conclusion."',['foregone','forgone','foregoing','forgotten'],0,'A FOREGONE conclusion = a predictable result.','A FOREGONE conclusion = resultado previsible.');
D('fire','Tall Order',26,12,'Complete: "Finishing today is a ___ order."','Completa: "Finishing today is a ___ order."',['tall','high','big','long'],0,'A TALL order = a difficult demand.','A TALL order = una exigencia difícil.');
D('fire','Narrow Escape',24,11,'Complete: "That was a ___ escape!"','Completa: "That was a ___ escape!"',['narrow','close','thin','tight'],0,'A NARROW escape = you barely made it.','A NARROW escape = te salvaste por poco.');
D('fire','Bitterly Cold',22,10,'Complete: "It was ___ cold outside."','Completa: "It was ___ cold outside."',['bitterly','strongly','heavily','deeply'],0,'BITTERLY cold is the collocation.','BITTERLY cold es la colocación.');

// ❄️ ICE — Nuance (easily confused words)
D('ice','Childlike / Childish',24,12,'"Her ___ wonder was charming." (positive)','"Her ___ wonder was charming." (positivo)',['childlike','childish','childly','childful'],0,'CHILDLIKE = innocent (positive); childish = immature (negative).','CHILDLIKE = inocente (positivo); childish = inmaduro (negativo).');
D('ice','Economic / Economical',26,12,'"A ___ car saves fuel." (money-saving)','"A ___ car saves fuel." (que ahorra)',['economical','economic','economics','economy'],0,'ECONOMICAL = money-saving; economic = about the economy.','ECONOMICAL = que ahorra; economic = de la economía.');
D('ice','Historic / Historical',26,12,'"A ___ moment: the first landing." (important)','"A ___ moment." (importante)',['historic','historical','history','historian'],0,'HISTORIC = important in history; historical = related to the past.','HISTORIC = importante; historical = del pasado.');
D('ice','Sensible / Sensitive',24,12,'"That was a ___ decision." (wise)','"That was a ___ decision." (sensata)',['sensible','sensitive','sensory','sensational'],0,'SENSIBLE = wise; sensitive = easily affected.','SENSIBLE = sensato; sensitive = sensible/susceptible.');
D('ice','Continual / Continuous',26,12,'"___ noise, without any pause." (unbroken)','"___ noise, sin pausa." (ininterrumpido)',['continuous','continual','continuing','contiguous'],0,'CONTINUOUS = unbroken; continual = repeated with gaps.','CONTINUOUS = sin interrupción; continual = repetido con pausas.');
D('ice','Effective / Efficient',24,12,'"An ___ method uses less time." (no waste)','"An ___ method." (sin desperdicio)',['efficient','effective','effect','effectual'],0,'EFFICIENT = no waste; effective = achieves the result.','EFFICIENT = sin desperdicio; effective = que logra el resultado.');
D('ice','Imply / Infer',28,13,'"The speaker ___ that costs would rise." (suggest)','"The speaker ___ that costs would rise." (insinuar)',['implied','inferred','implicated','inflected'],0,'The speaker IMPLIES; the listener INFERS.','El hablante IMPLIES; el oyente INFERS.');
D('ice','Classic / Classical',22,11,'"A ___ symphony by Mozart." (music era)','"A ___ symphony by Mozart." (era musical)',['classical','classic','classy','classed'],0,'CLASSICAL music/era; a classic = a timeless example.','CLASSICAL = música/época; classic = ejemplo atemporal.');
D('ice','Assure / Ensure',26,12,'"Please ___ the door is locked." (make certain)','"Please ___ the door is locked." (asegurarse)',['ensure','assure','insure','endure'],0,'ENSURE = make certain; assure = tell someone confidently.','ENSURE = asegurarse; assure = asegurar a alguien.');
D('ice','Discreet / Discrete',26,12,'"Be ___ about the surprise." (careful/private)','"Be ___ about the surprise." (prudente)',['discreet','discrete','discreetly','discretion'],0,'DISCREET = careful/tactful; discrete = separate.','DISCREET = prudente; discrete = separado.');

// ⚡ LIGHTNING — Advanced structures
D('lightning','Negative Inversion',30,13,'"Never ___ such a storm."','"Never ___ such a storm."',['have I seen','I have seen','I saw','did I saw'],0,'After a negative adverb, invert: Never HAVE I SEEN.','Tras un adverbio negativo hay inversión: Never HAVE I SEEN.');
D('lightning','Cleft Sentence',28,13,'"It ___ who solved it, not Ana."','"It ___ who solved it, not Ana."',['was John','John was','is John','was John he'],0,'Cleft for emphasis: It WAS John who...','Oración escindida: It WAS John who...');
D('lightning','Subjunctive',30,13,'"I suggest that he ___ present."','"I suggest that he ___ present."',['be','is','was','being'],0,'Mandative subjunctive uses the base form: that he BE.','El subjuntivo usa la forma base: that he BE.');
D('lightning','Not Until',30,14,'"Not until midnight ___ the truth."','"Not until midnight ___ the truth."',['did we learn','we learned','we did learn','had we learn'],0,'"Not until..." triggers inversion: DID we learn.','"Not until..." exige inversión: DID we learn.');
D('lightning','Third Conditional Inv.',30,14,'"___ known, I would have helped."','"___ known, I would have helped."',['Had I','If I have','Have I','Did I'],0,'Inverted 3rd conditional: HAD I known = If I had known.','3er condicional invertido: HAD I known.');
D('lightning','Rarely Does',28,13,'"Rarely ___ such talent."','"Rarely ___ such talent."',['does one see','one sees','one does see','sees one'],0,'Fronted "rarely" needs inversion: DOES one see.','"Rarely" al frente exige inversión: DOES one see.');
D('lightning','So + Adjective',30,14,'"So great ___ that all stood up."','"So great ___ that all stood up."',['was the applause','the applause was','the applause is','were the applause'],0,'"So + adj" fronted → inversion: So great WAS the applause.','"So + adj" al frente → inversión: So great WAS...');
D('lightning','Only Then',28,13,'"Only then ___ the risk."','"Only then ___ the risk."',['did she grasp','she grasped','she did grasp','had she grasp'],0,'"Only then" → inversion: DID she grasp.','"Only then" → inversión: DID she grasp.');
D('lightning','Were It Not For',30,14,'"___ your help, we would fail."','"___ your help, we would fail."',['Were it not for','If it not for','Was it not for','Had it not for'],0,'"Were it not for" = If it were not for.','"Were it not for" = If it were not for.');
D('lightning','No Sooner',30,14,'"No sooner ___ than it rained."','"No sooner ___ than it rained."',['had we left','we had left','did we leave','we left'],0,'"No sooner HAD we left... than..." (inversion + than).','"No sooner HAD we left... than..." (inversión + than).');

// 🌿 NATURE — Register (heal)
H('Polite Request',26,12,'Formal version of "Gimme the report."','Versión formal de "Gimme the report."',['Could you send me the report, please?','Give me report now.','I want the report.','Report, now.'],0,'Formal register uses modals: Could you...please.','El registro formal usa modales: Could you...please.');
H('Softening Bad News',26,12,'Most diplomatic: telling a client no.','Más diplomático para decir "no" a un cliente.',['I’m afraid that won’t be possible.','No, we can’t.','That’s a no.','Impossible.'],0,'"I’m afraid..." softens a refusal.','"I’m afraid..." suaviza una negativa.');
H('Formal Email Open',24,11,'Best formal opening line.','Mejor apertura formal.',['I am writing to enquire about...','Hey, quick question...','What’s up, I need...','Yo, about that...'],0,'Formal emails use "I am writing to...".','Los correos formales usan "I am writing to...".');
H('Diplomatic Disagreement',28,13,'Disagree politely in a meeting.','Discrepar con cortesía en una reunión.',['I see your point, but I’d suggest...','You’re wrong.','That’s a bad idea.','No way.'],0,'"I see your point, but..." keeps it collaborative.','"I see your point, but..." mantiene la colaboración.');
H('Formal Gratitude',24,11,'Formal "thanks a lot".','"Thanks a lot" en formal.',['I greatly appreciate your assistance.','Thanks a bunch!','Ta!','Cheers, mate.'],0,'Formal: "I greatly appreciate...".','Formal: "I greatly appreciate...".');
H('Hedging Language',26,12,'Academic hedging for a claim.','Atenuación académica de una afirmación.',['The data suggests that...','The data proves 100%...','It’s obviously...','Everyone knows...'],0,'Academic writing hedges: "suggests", "may indicate".','La escritura académica atenúa: "suggests", "may indicate".');
H('Formal Apology',26,12,'Formal apology to a customer.','Disculpa formal a un cliente.',['Please accept our sincere apologies.','Sorry about that!','My bad.','Oops.'],0,'Formal: "Please accept our sincere apologies.".','Formal: "Please accept our sincere apologies.".');
H('Tentative Suggestion',26,12,'Suggest an idea tentatively.','Sugerir una idea con tacto.',['Might it be worth considering...?','Do this.','You must...','It has to be...'],0,'"Might it be worth...?" is tentative and polite.','"Might it be worth...?" es tentativo y cortés.');
H('Formal Conclusion',24,11,'Formal way to conclude.','Forma formal de concluir.',['In light of the above, we recommend...','So yeah, do it.','Anyway, that’s it.','And that’s that.'],0,'Formal linkers: "In light of the above...".','Conectores formales: "In light of the above...".');
H('Reassurance',24,11,'Reassure a worried colleague formally.','Tranquilizar formalmente a un colega.',['Rest assured, we will handle it.','Chill, it’s fine.','Don’t worry, whatever.','Meh, it’s okay.'],0,'"Rest assured..." is formal reassurance.','"Rest assured..." es tranquilizar formal.');

// 🛡️ SHIELD — Listening (accents en-GB / en-AU, natural speed)
L('British Block',24,10,'I reckon we ought to have a proper chat about it.','en-GB',['I reckon we ought to have a proper chat about it.','I reckon we out to have a proper chat about it.','I reckon we ought to have a proper shot about it.'],0,'"I reckon" (I think) + "ought to" are common in BrE.','"I reckon" (creo) + "ought to" son comunes en inglés británico.');
L('Aussie Guard',24,10,'No worries, I’ll sort it out this arvo.','en-AU',['No worries, I’ll sort it out this arvo.','No worries, I’ll sort it out this after.','No worry, I’ll sort it out this arvo.'],0,'"Arvo" = afternoon (Australian slang).','"Arvo" = afternoon (jerga australiana).');
L('RP Ward',26,11,'Rather than complain, she simply got on with it.','en-GB',['Rather than complain, she simply got on with it.','Rather than complain, she simply got on with them.','Rather then complain, she simply got on with it.'],0,'"Get on with it" = continue/proceed. "Rather than" + base verb.','"Get on with it" = continuar. "Rather than" + verbo base.');
L('London Barrier',26,11,'To be fair, it was a bit of a shambles, wasn’t it?','en-GB',['To be fair, it was a bit of a shambles, wasn’t it?','To be fair, it was a bit of a shame, wasn’t it?','To be fair, it was a bit of a shambles, weren’t it?'],0,'"A shambles" = a mess (BrE). Tag question: wasn’t it.','"A shambles" = un desastre. Coletilla: wasn’t it.');
L('Outback Aegis',26,11,'She’s flat out like a lizard drinking, mate.','en-AU',['She’s flat out like a lizard drinking, mate.','She’s flat out like a wizard drinking, mate.','She’s flat out like a lizard sinking, mate.'],0,'"Flat out" = extremely busy (AusE idiom).','"Flat out" = muy ocupado (modismo australiano).');
L('Manchester Wall',28,12,'Had I known it was dear, I’d not have bought it.','en-GB',['Had I known it was dear, I’d not have bought it.','Had I known it was there, I’d not have bought it.','Have I known it was dear, I’d not have bought it.'],0,'"Dear" = expensive (BrE) + inverted 3rd conditional.','"Dear" = caro (británico) + 3er condicional invertido.');

// ⭐ LEGENDARY — Rare idioms (50 dmg)
LEG('Storm in a Teacup','"A storm in a teacup" means...','"A storm in a teacup" significa...',['a big fuss about something trivial','a real disaster','a sudden weather change','a calm situation'],0,'A lot of fuss over something unimportant.','Mucho alboroto por algo trivial.');
LEG('Spanner in the Works','"To throw a spanner in the works" means to...','"Throw a spanner in the works" significa...',['sabotage / disrupt a plan','fix a machine','work very hard','finish early'],0,'To cause a problem that stops progress.','Estropear o entorpecer un plan.');
LEG('Wild Goose Chase','"A wild goose chase" is...','"A wild goose chase" es...',['a hopeless, pointless search','a fun hunting trip','a quick errand','a clever trick'],0,'A futile pursuit with no result.','Una búsqueda inútil y sin resultado.');
LEG('Let Sleeping Dogs Lie','"Let sleeping dogs lie" advises you to...','"Let sleeping dogs lie" aconseja...',['not disturb a settled situation','wake up early','care for pets','avoid all conflict forever'],0,'Don’t provoke trouble that is currently quiet.','No remover un problema que está tranquilo.');
LEG('The Last Straw','"The last straw" is...','"The last straw" es...',['the final small problem that breaks patience','the best moment','a lucky break','the first mistake'],0,'The final minor thing that makes you snap.','La gota que colma el vaso.');

async function seed() {
  await GrimoireCard.deleteMany({});
  await GrimoireCard.insertMany(C);
  const bySchool = C.reduce((a, c) => { a[c.school] = (a[c.school] || 0) + 1; return a; }, {});
  console.log(`✅ Grimoire: ${C.length} cartas insertadas`, bySchool);
  mongoose.disconnect();
}
