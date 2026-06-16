const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('✅ MongoDB conectado'); seed(); })
  .catch(err => { console.error('❌', err.message); process.exit(1); });

const Quiz = require('../models/Quiz');

async function seed() {
  await Quiz.deleteOne({ nivel: 'A2' });

  await Quiz.create({
    nivel:       'A2',
    nivelTarget: 'B1',
    titulo:      'Examen de Certificación A2 → B1',
    descripcion: 'Demuestra que dominas el nivel elemental. Necesitas 7/10 para avanzar a B1.',
    minScore:    7,
    totalPregs:  10,
    preguntas: [
      // VOCABULARIO
      { q: 'What does "delay" mean?', opts:['Salida','Llegada','Retraso','Andén'], ans:2, tipo:'vocab' },
      { q: 'What is a "fitting room"?', opts:['Caja registradora','Probador','Pasillo','Descuento'], ans:1, tipo:'vocab' },
      { q: 'What does "crowded" mean?', opts:['Tranquilo','Ruidoso','Concurrido','Moderno'], ans:2, tipo:'vocab' },
      { q: 'What is a "prescription"?', opts:['Cita médica','Alergia','Receta médica','Pastilla'], ans:2, tipo:'vocab' },
      { q: 'What does "salary" mean?', opts:['Entrevista','Ascenso','Reunión','Salario'], ans:3, tipo:'vocab' },
      // GRAMÁTICA
      { q: 'Complete: "I ___ to the store yesterday."', opts:['go','goes','went','going'], ans:2, tipo:'grammar' },
      { q: 'Which is correct for future plans?', opts:['I go to travel','I am going to travel','I travel tomorrow','I will to travel'], ans:1, tipo:'grammar' },
      { q: 'Complete: "___ you like some coffee?"', opts:['Do','Would','Could','Should'], ans:1, tipo:'grammar' },
      { q: 'Complete: "There ___ a lot of people at the mall."', opts:['is','are','were','was'], ans:1, tipo:'grammar' },
      { q: 'What is the past of "buy"?', opts:['Buyed','Boughted','Bought','Buyed'], ans:2, tipo:'grammar' },
      // FRASES Y COMPRENSIÓN
      { q: '"Could you help me?" — What type of sentence is this?', opts:['Una orden','Una petición formal','Una pregunta de vocabulario','Una negación'], ans:1, tipo:'listening' },
      { q: 'What does "as soon as possible" mean?', opts:['Tarde o temprano','Lo antes posible','De vez en cuando','Hace mucho tiempo'], ans:1, tipo:'listening' },
      { q: 'Complete: "How long ___ it take to get there?"', opts:['is','does','do','are'], ans:1, tipo:'grammar' },
      { q: 'What is the past of "sleep"?', opts:['Sleeped','Slept','Slepped','Sleeping'], ans:1, tipo:'grammar' },
      { q: '"I have been here before." This sentence is in...', opts:['Simple present','Simple past','Present perfect','Future'], ans:2, tipo:'grammar' },
    ]
  });

  console.log('✅ Quiz A2 insertado con 15 preguntas (se toman 10 aleatorias por examen)');
  mongoose.disconnect();
}