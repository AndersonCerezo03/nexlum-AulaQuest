const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('✅ MongoDB conectado'); seed(); })
  .catch(err => { console.error('❌', err.message); process.exit(1); });

const Quiz = require('../models/Quiz');

async function seed() {
  await Quiz.deleteOne({ nivel: 'A1' });

  await Quiz.create({
    nivel:       'A1',
    nivelTarget: 'A2',
    titulo:      'Examen de Certificación A1 → A2',
    descripcion: 'Demuestra que dominas el nivel principiante. Necesitas 7/10 para avanzar a A2.',
    minScore:    7,
    totalPregs:  10,
    preguntas: [
      // VOCABULARIO
      { q: '¿Cómo se dice "Hola" en inglés?', opts:['Goodbye','Hello','Please','Sorry'], ans:1, tipo:'vocab' },
      { q: '¿Qué significa "Thank you"?', opts:['Por favor','Lo siento','Gracias','Hola'], ans:2, tipo:'vocab' },
      { q: '¿Cómo se dice "Rojo" en inglés?', opts:['Blue','Green','Red','Black'], ans:2, tipo:'vocab' },
      { q: '¿Qué número es "Seven"?', opts:['Seis','Siete','Ocho','Nueve'], ans:1, tipo:'vocab' },
      { q: '¿Cómo se dice "Madre" en inglés?', opts:['Father','Sister','Mother','Brother'], ans:2, tipo:'vocab' },
      { q: '¿Qué significa "Water"?', opts:['Pan','Agua','Leche','Café'], ans:1, tipo:'vocab' },
      { q: '¿Cómo se dice "Gato" en inglés?', opts:['Dog','Cat','Bird','Fish'], ans:1, tipo:'vocab' },
      // GRAMÁTICA
      { q: 'Completa: "I ___ a student."', opts:['am','is','are','be'], ans:0, tipo:'grammar' },
      { q: 'Completa: "She ___ happy."', opts:['am','is','are','be'], ans:1, tipo:'grammar' },
      { q: 'Completa: "They ___ my friends."', opts:['am','is','are','be'], ans:2, tipo:'grammar' },
      { q: '¿Cuál es el plural de "book"?', opts:['book','bookes','books','books'], ans:2, tipo:'grammar' },
      { q: 'Completa: "He ___ a car."', opts:['have','has','having','haves'], ans:1, tipo:'grammar' },
      // FRASES Y COMPRENSIÓN
      { q: '¿Qué significa "Good morning"?', opts:['Buenas noches','Buenos días','Buenas tardes','Hasta luego'], ans:1, tipo:'listening' },
      { q: '"My name is Ana" significa...', opts:['Tengo un nombre','Mi nombre es Ana','Me llamo así','Soy Ana de'], ans:1, tipo:'listening' },
      { q: '¿Cómo respondes a "How are you?"', opts:['My name is','I am fine','Goodbye','Thank you'], ans:1, tipo:'listening' },
    ]
  });

  console.log('✅ Quiz A1 insertado con 15 preguntas (se toman 10 aleatorias por examen)');
  mongoose.disconnect();
}