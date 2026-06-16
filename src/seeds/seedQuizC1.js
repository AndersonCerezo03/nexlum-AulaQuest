const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(()=>{ console.log('✅ MongoDB'); seed(); }).catch(e=>{ console.error(e.message); process.exit(1); });
const Quiz = require('../models/Quiz');
async function seed() {
  await Quiz.deleteOne({ nivel: 'C1' });
  await Quiz.create({
    nivel:'C1', nivelTarget:'C2',
    titulo:'Examen de Certificacion C1 → C2',
    descripcion:'Nivel avanzado. Necesitas 8/10 para avanzar a C2.',
    minScore:8, totalPregs:10,
    preguntas:[
      {q:'What does "perspicacious" mean?', opts:['Confuso','Perspicaz','Arrogante','Timido'], ans:1, tipo:'vocab'},
      {q:'"The building having been completed, work began on the interior." What structure is this?', opts:['Participio pasado','Construccion absoluta','Voz pasiva','Clausula relativa'], ans:1, tipo:'grammar'},
      {q:'What does "ethos" mean in rhetoric?', opts:['Apelacion emocional','Apelacion logica','Credibilidad del orador','Argumento'], ans:2, tipo:'vocab'},
      {q:'What is the difference between "imply" and "infer"?', opts:['Son sinonimos','Imply=el hablante sugiere; Infer=el oyente deduce','Imply=deducir; Infer=sugerir','No hay diferencia'], ans:1, tipo:'vocab'},
      {q:'"Seldom had she seen such dedication." This sentence uses:', opts:['Passive voice','Fronting','Inversion','Ellipsis'], ans:2, tipo:'grammar'},
      {q:'What does "perfidious" mean?', opts:['Generoso','Valiente','Perfido / Traicionero','Sagaz'], ans:2, tipo:'vocab'},
      {q:'What is "hedging language"?', opts:['Lenguaje directo','Lenguaje atenuador / Cauteloso','Lenguaje informal','Lenguaje tecnico'], ans:1, tipo:'grammar'},
      {q:'What does "accountability" mean?', opts:['Contabilidad','Responsabilidad publica','Transparencia','Auditoria'], ans:1, tipo:'vocab'},
      {q:'"It is time we addressed this issue." What mood is used?', opts:['Indicativo','Subjuntivo','Imperativo','Condicional'], ans:1, tipo:'grammar'},
      {q:'What does "nuanced" mean?', opts:['Obvio','Matizado','Exagerado','Simple'], ans:1, tipo:'vocab'},
      {q:'What is a "cleft sentence"?', opts:['Oracion compuesta','Oracion escindida para enfasis','Oracion pasiva','Oracion condicional'], ans:1, tipo:'grammar'},
      {q:'What does "proliferate" mean?', opts:['Disminuir','Cambiar','Proliferar / Multiplicarse','Analizar'], ans:2, tipo:'vocab'},
      {q:'What does "discourse marker" do?', opts:['Cambia el tiempo verbal','Organiza y conecta el discurso','Indica la voz pasiva','Introduce condiciones'], ans:1, tipo:'grammar'},
      {q:'What does "undermine" mean?', opts:['Apoyar','Socavar / Debilitar','Ignorar','Exagerar'], ans:1, tipo:'vocab'},
      {q:'What is "code-switching"?', opts:['Programar en dos idiomas','Cambiar entre idiomas o dialectos segun el contexto','Traducir documentos','Usar jerga'], ans:1, tipo:'vocab'},
    ]
  });
  console.log('✅ Quiz C1 insertado'); mongoose.disconnect();
}