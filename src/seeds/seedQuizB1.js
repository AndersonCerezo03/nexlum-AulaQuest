const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(()=>{ console.log('✅ MongoDB'); seed(); }).catch(e=>{ console.error(e.message); process.exit(1); });
const Quiz = require('../models/Quiz');
async function seed() {
  await Quiz.deleteOne({ nivel: 'B1' });
  await Quiz.create({
    nivel:'B1', nivelTarget:'B2',
    titulo:'Examen de Certificacion B1 → B2',
    descripcion:'Demuestra dominio intermedio. Necesitas 7/10 para avanzar a B2.',
    minScore:7, totalPregs:10,
    preguntas:[
      {q:'What does "sustainable" mean?', opts:['Costoso','Sostenible','Temporal','Fragil'], ans:1, tipo:'vocab'},
      {q:'Choose the correct sentence:', opts:['I am used to wake up early','I am used to waking up early','I used to waking up early','I am use to wake up early'], ans:1, tipo:'grammar'},
      {q:'What does "Although" express?', opts:['Causa','Consecuencia','Contraste','Condicion'], ans:2, tipo:'vocab'},
      {q:'Complete: "If I ___ more time, I would learn piano."', opts:['have','had','will have','would have'], ans:1, tipo:'grammar'},
      {q:'What is a "scholarship"?', opts:['Horario','Beca','Titulo','Tesis'], ans:1, tipo:'vocab'},
      {q:'What does "deforestation" mean?', opts:['Reforestacion','Contaminacion','Deforestacion','Inundacion'], ans:2, tipo:'vocab'},
      {q:'Complete: "The report ___ by the team last week."', opts:['wrote','was written','has written','is written'], ans:1, tipo:'grammar'},
      {q:'"I would rather stay home." What does this mean?', opts:['Debo quedarme','Prefiero quedarme','Puedo quedarme','Suelo quedarme'], ans:1, tipo:'grammar'},
      {q:'What does "Nevertheless" mean?', opts:['Ademas','Por lo tanto','Sin embargo','Aunque'], ans:2, tipo:'vocab'},
      {q:'What is "carbon footprint"?', opts:['Huella dactilar','Huella de carbono','Contaminacion','Energia'], ans:1, tipo:'vocab'},
      {q:'Complete: "She ___ here for 5 years by next month."', opts:['will work','will have worked','has worked','worked'], ans:1, tipo:'grammar'},
      {q:'What does "peer review" mean?', opts:['Revision por pares','Entrevista','Examen oral','Publicacion'], ans:0, tipo:'vocab'},
      {q:'"It is worth doing." What structure is this?', opts:['Infinitivo','Gerundio','Participio','Modal'], ans:1, tipo:'grammar'},
      {q:'What does "biodiversity" mean?', opts:['Contaminacion','Biodiversidad','Ecosistema','Especie'], ans:1, tipo:'vocab'},
      {q:'What does "Consequently" mean?', opts:['Sin embargo','Por consiguiente','Ademas','Aunque'], ans:1, tipo:'vocab'},
    ]
  });
  console.log('✅ Quiz B1 insertado'); mongoose.disconnect();
}