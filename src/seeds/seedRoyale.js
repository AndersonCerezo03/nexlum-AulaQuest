const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('✅ MongoDB conectado'); seed(); })
  .catch(err => { console.error('❌', err.message); process.exit(1); });

const RoyaleChallenge = require('../models/RoyaleChallenge');

const R = [];
const phrasal = (q, qEs, opts, ans, fen, fes, dif=1) => R.push({ tipo:'phrasal', q, qEs, opts, ans, feedback:{en:fen,es:fes}, dif });
const idiom   = (q, qEs, opts, ans, fen, fes, dif=1) => R.push({ tipo:'idiom', q, qEs, opts, ans, feedback:{en:fen,es:fes}, dif });
const para    = (q, qEs, opts, ans, fen, fes, dif=1) => R.push({ tipo:'paraphrase', q, qEs, opts, ans, feedback:{en:fen,es:fes}, dif });
const listen  = (say, opts, ans, fen, fes, dif=1) => R.push({ tipo:'listening', q:'Listen and choose what you heard.', qEs:'Escucha y elige lo que oíste.', say, opts, ans, feedback:{en:fen,es:fes}, dif });

// ── PHRASAL VERBS ──
phrasal('The meeting was ___ because of the storm.', 'La reunión fue ___ por la tormenta.', ['called off','called on','called up','called in'], 0, '"Call off" = to cancel.', '"Call off" = cancelar.');
phrasal('We ran ___ some old friends at the airport.', 'Nos ___ con viejos amigos en el aeropuerto.', ['into','over','down','off'], 0, '"Run into" = to meet by chance.', '"Run into" = encontrarse por casualidad.');
phrasal('Please ___ your shoes before entering.', 'Por favor ___ los zapatos antes de entrar.', ['take off','take on','take up','take in'], 0, '"Take off" = to remove.', '"Take off" = quitarse.');
phrasal('She ___ smoking last year.', 'Ella ___ de fumar el año pasado.', ['gave up','gave in','gave away','gave off'], 0, '"Give up" = to quit / stop.', '"Give up" = dejar / rendirse.');
phrasal('Can you ___ the baby while I cook?', '¿Puedes ___ al bebé mientras cocino?', ['look after','look for','look up','look into'], 0, '"Look after" = to take care of.', '"Look after" = cuidar.');
phrasal('The plane will ___ in ten minutes.', 'El avión ___ en diez minutos.', ['take off','take up','take out','take over'], 0, '"Take off" (plane) = to leave the ground.', '"Take off" (avión) = despegar.');
phrasal('I need to ___ this word in the dictionary.', 'Necesito ___ esta palabra en el diccionario.', ['look up','look after','look out','look down'], 0, '"Look up" = to search for information.', '"Look up" = buscar información.', 2);
phrasal('They ___ a new project last week.', 'Ellos ___ un nuevo proyecto la semana pasada.', ['set up','set off','set in','set out'], 0, '"Set up" = to start / establish.', '"Set up" = montar / establecer.', 2);
phrasal('He ___ his father; they look identical.', 'Él ___ a su padre; son idénticos.', ['takes after','takes off','takes up','takes in'], 0, '"Take after" = to resemble a relative.', '"Take after" = parecerse a un familiar.', 2);
phrasal('We ___ of milk, I have to buy more.', 'Nos ___ la leche, tengo que comprar más.', ['ran out','ran into','ran over','ran up'], 0, '"Run out of" = to have no more left.', '"Run out of" = quedarse sin.', 2);
phrasal('The teacher asked us to ___ the noise.', 'El profesor nos pidió ___ el ruido.', ['cut down on','cut off','cut up','cut in'], 0, '"Cut down on" = to reduce.', '"Cut down on" = reducir.', 3);
phrasal('Don’t ___; we can solve this problem.', 'No ___; podemos resolver este problema.', ['give up','give in','give out','give back'], 0, '"Give up" = to stop trying.', '"Give up" = rendirse.');

// ── IDIOMS ──
idiom('"It costs an arm and a leg" means it is...', '"Cuesta un ojo de la cara" significa que es...', ['very expensive','very cheap','free','broken'], 0, '"An arm and a leg" = very expensive.', '"An arm and a leg" = muy caro.');
idiom('If you "hit the books", you...', 'Si "hit the books", tú...', ['study hard','go to sleep','play sports','watch TV'], 0, '"Hit the books" = to study hard.', '"Hit the books" = estudiar mucho.');
idiom('"Once in a blue moon" means...', '"Once in a blue moon" significa...', ['very rarely','every day','never','always'], 0, '"Once in a blue moon" = very rarely.', '"Once in a blue moon" = muy rara vez.');
idiom('"Break a leg!" before a show means...', '"Break a leg!" antes de un show significa...', ['good luck','be careful','goodbye','hurry up'], 0, '"Break a leg" = good luck.', '"Break a leg" = buena suerte.');
idiom('If something is "a piece of cake", it is...', 'Si algo es "a piece of cake", es...', ['very easy','delicious','difficult','expensive'], 0, '"A piece of cake" = very easy.', '"A piece of cake" = muy fácil.');
idiom('"To feel under the weather" means to feel...', '"Feel under the weather" significa sentirse...', ['sick','happy','cold','tired but fine'], 0, '"Under the weather" = a bit ill.', '"Under the weather" = un poco enfermo.', 2);
idiom('"Let the cat out of the bag" means to...', '"Let the cat out of the bag" significa...', ['reveal a secret','buy a pet','get lost','make noise'], 0, 'It means to reveal a secret by accident.', 'Significa revelar un secreto sin querer.', 2);
idiom('"To be on the same page" means to...', '"Be on the same page" significa...', ['agree / understand each other','read a book','be in class','be late'], 0, 'It means to agree or share understanding.', 'Significa estar de acuerdo o entenderse.', 2);
idiom('"To bite off more than you can chew" means to...', '"Bite off more than you can chew" significa...', ['take on too much','eat too fast','be very hungry','be lazy'], 0, 'It means to take on more than you can handle.', 'Significa asumir más de lo que puedes.', 3);
idiom('"The ball is in your court" means...', '"The ball is in your court" significa...', ['it is your decision now','you play sports','you lost','it is my turn'], 0, 'It means the decision is yours now.', 'Significa que la decisión ahora es tuya.', 3);
idiom('"To cost a fortune" is similar to...', '"Cost a fortune" es parecido a...', ['cost an arm and a leg','a piece of cake','under the weather','hit the books'], 0, 'Both mean very expensive.', 'Ambas significan muy caro.', 2);
idiom('"To call it a day" means to...', '"Call it a day" significa...', ['stop working','start a party','name a date','sleep in'], 0, 'It means to stop working for the day.', 'Significa terminar la jornada.', 2);

// ── PARAPHRASE ──
para('Choose the best paraphrase: "You must submit it by Friday."', 'Elige la mejor paráfrasis de "You must submit it by Friday".', ['The deadline for submission is Friday.','You can submit it after Friday.','Friday is optional for submission.','You submitted it on Friday.'], 0, 'A paraphrase keeps the same meaning with different words.', 'Una paráfrasis mantiene el significado con otras palabras.');
para('Best paraphrase: "She is used to working at night."', 'Mejor paráfrasis de "She is used to working at night".', ['Working at night is normal for her.','She used to work at night but stopped.','She will work at night.','She hates working at night.'], 0, '"Be used to + -ing" = accustomed to something.', '"Be used to + -ing" = acostumbrado a algo.', 2);
para('Best paraphrase: "The event was called off."', 'Mejor paráfrasis de "The event was called off".', ['The event was cancelled.','The event was amazing.','The event started late.','The event was crowded.'], 0, '"Called off" = cancelled.', '"Called off" = cancelado.');
para('Best paraphrase: "He can’t have finished already."', 'Mejor paráfrasis de "He can’t have finished already".', ['It is impossible that he finished so soon.','He definitely finished.','He must finish now.','He will finish soon.'], 0, '"Can’t have + participle" = it was impossible.', '"Can’t have + participio" = era imposible.', 3);
para('Best paraphrase: "I would rather stay home."', 'Mejor paráfrasis de "I would rather stay home".', ['I prefer to stay home.','I must stay home.','I never stay home.','I stayed home.'], 0, '"Would rather" = prefer.', '"Would rather" = preferir.', 2);
para('Best paraphrase: "They put off the decision."', 'Mejor paráfrasis de "They put off the decision".', ['They postponed the decision.','They made the decision.','They cancelled the meeting.','They agreed quickly.'], 0, '"Put off" = postpone.', '"Put off" = posponer.');
para('Best paraphrase: "It’s not worth arguing about."', 'Mejor paráfrasis de "It’s not worth arguing about".', ['Arguing about it has no value.','We should argue more.','It is worth a lot.','Let’s argue now.'], 0, '"Not worth + -ing" = has no value.', '"Not worth + -ing" = no vale la pena.', 2);
para('Best paraphrase: "She managed to fix it."', 'Mejor paráfrasis de "She managed to fix it".', ['She succeeded in fixing it.','She tried but failed.','She broke it.','She will fix it.'], 0, '"Manage to" = succeed in doing something.', '"Manage to" = lograr hacer algo.', 2);
para('Best paraphrase: "You’d better see a doctor."', 'Mejor paráfrasis de "You’d better see a doctor".', ['It is advisable to see a doctor.','You saw a doctor.','You must not see a doctor.','A doctor is better than you.'], 0, '"Had better" = strong advice.', '"Had better" = consejo fuerte.', 3);
para('Best paraphrase: "The show was sold out."', 'Mejor paráfrasis de "The show was sold out".', ['No tickets were left.','The show was free.','The show was cancelled.','The show was empty.'], 0, '"Sold out" = no tickets available.', '"Sold out" = sin entradas disponibles.');

// ── LISTENING (TTS del navegador) ──
listen('I’ve been looking forward to this trip for months.', ['I’ve been looking forward to this trip for months.','I’ve been looking for this trip for months.','I looked forward this trip for months.'], 0, '"Look forward to + -ing/noun" = to be excited about.', '"Look forward to" = esperar con ilusión.');
listen('If I had known, I would have told you.', ['If I had known, I would have told you.','If I know, I will tell you.','If I knew, I would tell you.'], 0, 'Third conditional: If + had + participle, would have + participle.', 'Tercer condicional: If + had + participio, would have + participio.', 3);
listen('She said she had already finished the report.', ['She said she had already finished the report.','She says she already finishes the report.','She said she has already finished the report.'], 0, 'Reported speech shifts present perfect to past perfect.', 'El estilo indirecto pasa el presente perfecto a pasado perfecto.', 2);
listen('We could meet up later if you are free.', ['We could meet up later if you are free.','We could meet out later if you are free.','We should meet up late if you free.'], 0, '"Meet up" = to get together.', '"Meet up" = quedar / reunirse.');
listen('The keys must have fallen out of my pocket.', ['The keys must have fallen out of my pocket.','The keys must fall out of my pocket.','The keys must have fallen off my pocket.'], 0, '"Must have + participle" = logical deduction about the past.', '"Must have + participio" = deducción lógica del pasado.', 2);
listen('I’m thinking of taking up painting.', ['I’m thinking of taking up painting.','I’m thinking of taking off painting.','I think to take up painting.'], 0, '"Take up" = to start a hobby.', '"Take up" = empezar un pasatiempo.', 2);
listen('By the time we arrived, the film had started.', ['By the time we arrived, the film had started.','By the time we arrive, the film starts.','By the time we arrived, the film has started.'], 0, 'Past perfect for the earlier of two past actions.', 'Pasado perfecto para la acción más antigua de dos pasadas.', 3);
listen('You shouldn’t have spent so much money.', ['You shouldn’t have spent so much money.','You shouldn’t spend so much money.','You mustn’t have spent so much money.'], 0, '"Shouldn’t have + participle" = criticism of a past action.', '"Shouldn’t have + participio" = crítica de una acción pasada.', 2);
listen('He’s really into playing chess these days.', ['He’s really into playing chess these days.','He’s really in to play chess these days.','He’s really into play chess these days.'], 0, '"Be into + -ing" = to like a lot.', '"Be into + -ing" = gustar mucho.', 2);
listen('Would you mind opening the window?', ['Would you mind opening the window?','Would you mind to open the window?','Do you mind open the window?'], 0, '"Would you mind + -ing?" = polite request.', '"Would you mind + -ing?" = petición educada.');
listen('They ended up cancelling the whole trip.', ['They ended up cancelling the whole trip.','They ended up to cancel the whole trip.','They end up cancelling the whole trip.'], 0, '"End up + -ing" = to finally do something.', '"End up + -ing" = terminar haciendo algo.', 2);
listen('I wish I had studied harder for the exam.', ['I wish I had studied harder for the exam.','I wish I studied harder for the exam.','I wish I have studied harder for the exam.'], 0, '"Wish + past perfect" = regret about the past.', '"Wish + pasado perfecto" = arrepentimiento del pasado.', 3);

async function seed() {
  await RoyaleChallenge.deleteMany({});
  await RoyaleChallenge.insertMany(R);
  const porTipo = R.reduce((a, c) => { a[c.tipo] = (a[c.tipo] || 0) + 1; return a; }, {});
  console.log(`✅ Royale: ${R.length} retos B2 insertados`, porTipo);
  mongoose.disconnect();
}
