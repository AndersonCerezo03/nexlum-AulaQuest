const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(()=>{ console.log('✅ MongoDB'); seed(); }).catch(e=>{ console.error(e.message); process.exit(1); });
const Quiz = require('../models/Quiz');
async function seed() {
  await Quiz.deleteOne({ nivel: 'B2' });
  await Quiz.create({
    nivel:'B2', nivelTarget:'C1',
    titulo:'Examen de Certificacion B2 → C1',
    descripcion:'Nivel intermedio alto. Necesitas 7/10 para avanzar a C1.',
    minScore:7, totalPregs:10,
    preguntas:[
      {q:'What does "stakeholder" mean?', opts:['Inversionista','Parte interesada','Gerente','Cliente'], ans:1, tipo:'vocab'},
      {q:'"Had I known, I would have acted differently." This is a:', opts:['First conditional','Second conditional','Third conditional','Mixed conditional'], ans:2, tipo:'grammar'},
      {q:'What does "fallacy" mean?', opts:['Argumento','Falacia','Premisa','Evidencia'], ans:1, tipo:'vocab'},
      {q:'What is the meaning of "break a leg"?', opts:['Romperse la pierna','Buena suerte','Rendirse','Correr'], ans:1, tipo:'vocab'},
      {q:'"The contract ___ terminated last month." Complete:', opts:['was','has been','is','were'], ans:0, tipo:'grammar'},
      {q:'What does "GDP" stand for?', opts:['Producto interior bruto','Tasa de interes','Inflacion','Deficit'], ans:0, tipo:'vocab'},
      {q:'What does "notwithstanding" mean?', opts:['Ademas','Sin embargo / No obstante','Por lo tanto','Aunque'], ans:1, tipo:'vocab'},
      {q:'"She could have told me." What does this express?', opts:['Obligacion pasada','Posibilidad pasada no realizada','Habito pasado','Condicion futura'], ans:1, tipo:'grammar'},
      {q:'What is "outsourcing"?', opts:['Expansion','Subcontratacion','Fusion','Inversion'], ans:1, tipo:'vocab'},
      {q:'What does "juxtaposition" mean?', opts:['Metafora','Ironia','Yuxtaposicion','Hiperbole'], ans:2, tipo:'vocab'},
      {q:'"It is widely believed that..." uses:', opts:['Active voice','Passive voice','Conditional','Reported speech'], ans:1, tipo:'grammar'},
      {q:'What does "paradigm" mean?', opts:['Ejemplo','Paradigma','Hipotesis','Conclusion'], ans:1, tipo:'vocab'},
      {q:'What does "leverage" mean in business?', opts:['Perdida','Apalancamiento / Influencia','Ganancia','Inversion'], ans:1, tipo:'vocab'},
      {q:'"Not only did he fail, but he also lied." This is an example of:', opts:['Inversion','Passive voice','Cleft sentence','Ellipsis'], ans:0, tipo:'grammar'},
      {q:'What does "disinformation" mean?', opts:['Falta de informacion','Desinformacion deliberada','Censura','Propaganda'], ans:1, tipo:'vocab'},
    ]
  });
  console.log('✅ Quiz B2 insertado'); mongoose.disconnect();
}