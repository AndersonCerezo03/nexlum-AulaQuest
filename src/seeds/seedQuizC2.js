const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(()=>{ console.log('✅ MongoDB'); seed(); }).catch(e=>{ console.error(e.message); process.exit(1); });
const Quiz = require('../models/Quiz');
async function seed() {
  await Quiz.deleteOne({ nivel: 'C2' });
  await Quiz.create({
    nivel:'C2', nivelTarget:'C2',
    titulo:'Examen Final de Maestria C2',
    descripcion:'El nivel mas alto. Necesitas 9/10 para completar tu certificacion.',
    minScore:9, totalPregs:10,
    preguntas:[
      {q:'What does "perspicacious" mean?', opts:['Confuso','Arrogante','Perspicaz y agudo','Indeciso'], ans:2, tipo:'vocab'},
      {q:'"But for your help, I would have failed." What does this express?', opts:['Gratitud simple','Condicion contrafactual pasada','Obligacion pasada','Posibilidad futura'], ans:1, tipo:'grammar'},
      {q:'What is the difference between "flaunt" and "flout"?', opts:['Son sinonimos','Flaunt=ostentar; Flout=ignorar reglas','Flaunt=ignorar; Flout=ostentar','No se usan en ingles moderno'], ans:1, tipo:'vocab'},
      {q:'What does "litotes" mean in rhetoric?', opts:['Exageracion','Negacion de lo contrario para afirmar','Repeticion al inicio','Contradiccion'], ans:1, tipo:'vocab'},
      {q:'"Under no circumstances would I accept that." This uses:', opts:['Passive inversion','Fronted negative adverb with inversion','Cleft sentence','Subjunctive'], ans:1, tipo:'grammar'},
      {q:'What does "insofar as" mean?', opts:['A pesar de','En la medida en que','Sin embargo','Con respecto a'], ans:1, tipo:'vocab'},
      {q:'What is a "garden path sentence"?', opts:['Oracion poetica','Oracion que lleva a interpretacion erronea','Oracion muy larga','Oracion con metaforas'], ans:1, tipo:'grammar'},
      {q:'What does "Kafkaesque" mean?', opts:['Romantico','Absurdo y burocratico al extremo','Misterioso','Epico'], ans:1, tipo:'vocab'},
      {q:'What does "mutatis mutandis" mean?', opts:['De hecho','Entre otras cosas','Cambiando lo que se deba cambiar','En virtud de'], ans:2, tipo:'vocab'},
      {q:'"Seldom does one encounter such mastery." Identify the grammar feature:', opts:['Passive voice','Subject-auxiliary inversion after negative adverb','Mixed conditional','Nominalization'], ans:1, tipo:'grammar'},
      {q:'What is "anaphora" in rhetoric?', opts:['Silencio dramatico','Repeticion de palabras al inicio de frases','Contradiccion aparente','Exageracion'], ans:1, tipo:'vocab'},
      {q:'What does "Pyrrhic victory" mean?', opts:['Gran victoria','Victoria que cuesta demasiado','Victoria facil','Victoria moral'], ans:1, tipo:'vocab'},
      {q:'What does "cataphoric reference" mean?', opts:['Referencia a algo mencionado antes','Referencia a algo que se menciona despues','Referencia cultural','Referencia implicita'], ans:1, tipo:'grammar'},
      {q:'What is "structural ambiguity"?', opts:['Error gramatical','Palabra con doble significado','Oracion con dos interpretaciones posibles','Frase idiomatica'], ans:2, tipo:'grammar'},
      {q:'"The crux of the matter is..." What does "crux" mean?', opts:['El inicio','El punto clave','El final','El problema'], ans:1, tipo:'vocab'},
    ]
  });
  console.log('✅ Quiz C2 insertado'); mongoose.disconnect();
}