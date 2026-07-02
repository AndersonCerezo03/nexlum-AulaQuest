const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('✅ MongoDB conectado'); seed(); })
  .catch(err => { console.error('❌', err.message); process.exit(1); });

const ArenaQuestion = require('../models/ArenaQuestion');

// 24 preguntas A1 variadas (texto e ícono) con tarjeta de aprendizaje.
const PREGUNTAS = [
  // ── Saludos ──
  { tema:'greetings', q:'¿Cómo se dice "Hola" en inglés?', opts:['Hello','Goodbye','Please','Sorry'], ans:0,
    learn:{ word:'Hello', pron:'je-LÓU', meaning:'Hola', example:'Hello! How are you?' } },
  { tema:'greetings', q:'¿Qué significa "Thank you"?', opts:['Por favor','Gracias','Lo siento','Adiós'], ans:1,
    learn:{ word:'Thank you', pron:'zénk-iu', meaning:'Gracias', example:'Thank you for your help.' } },
  { tema:'greetings', q:'¿Qué significa "Good morning"?', opts:['Buenas noches','Buenos días','Buenas tardes','Adiós'], ans:1,
    learn:{ word:'Good morning', pron:'gud MÓR-ning', meaning:'Buenos días', example:'Good morning, teacher!' } },
  { tema:'greetings', q:'¿Cómo se dice "Adiós"?', opts:['Hello','Goodbye','Welcome','Please'], ans:1,
    learn:{ word:'Goodbye', pron:'gud-BÁI', meaning:'Adiós', example:'Goodbye! See you tomorrow.' } },

  // ── Colores ──
  { tema:'colors', icon:'🟥', q:'¿De qué color es 🟥?', opts:['Blue','Red','Green','Yellow'], ans:1,
    learn:{ word:'Red', pron:'red', meaning:'Rojo', example:'The apple is red.' } },
  { tema:'colors', icon:'🟦', q:'¿De qué color es 🟦?', opts:['Green','Blue','Black','White'], ans:1,
    learn:{ word:'Blue', pron:'blu', meaning:'Azul', example:'The sky is blue.' } },
  { tema:'colors', q:'¿Qué significa "Green"?', opts:['Amarillo','Verde','Negro','Blanco'], ans:1,
    learn:{ word:'Green', pron:'grin', meaning:'Verde', example:'The grass is green.' } },

  // ── Números ──
  { tema:'numbers', q:'¿Qué número es "Seven"?', opts:['Seis','Siete','Ocho','Nueve'], ans:1,
    learn:{ word:'Seven', pron:'SÉ-ven', meaning:'Siete', example:'I have seven books.' } },
  { tema:'numbers', icon:'3️⃣', q:'¿Qué número es 3️⃣?', opts:['Two','Three','Five','Ten'], ans:1,
    learn:{ word:'Three', pron:'zri', meaning:'Tres', example:'I see three cats.' } },
  { tema:'numbers', q:'¿Cómo se dice "Diez"?', opts:['Nine','Ten','Twelve','Eight'], ans:1,
    learn:{ word:'Ten', pron:'ten', meaning:'Diez', example:'Count to ten.' } },

  // ── Familia ──
  { tema:'family', q:'¿Cómo se dice "Madre"?', opts:['Father','Mother','Sister','Brother'], ans:1,
    learn:{ word:'Mother', pron:'MÁ-der', meaning:'Madre', example:'My mother is kind.' } },
  { tema:'family', q:'¿Qué significa "Brother"?', opts:['Hermana','Hermano','Padre','Hijo'], ans:1,
    learn:{ word:'Brother', pron:'BRÁ-der', meaning:'Hermano', example:'My brother is tall.' } },
  { tema:'family', q:'¿Cómo se dice "Padre"?', opts:['Father','Mother','Uncle','Son'], ans:0,
    learn:{ word:'Father', pron:'FÁ-der', meaning:'Padre', example:'My father works a lot.' } },

  // ── Animales ──
  { tema:'animals', icon:'🐱', q:'¿Qué animal es 🐱?', opts:['Dog','Cat','Bird','Fish'], ans:1,
    learn:{ word:'Cat', pron:'kat', meaning:'Gato', example:'The cat is black.' } },
  { tema:'animals', icon:'🐶', q:'¿Qué animal es 🐶?', opts:['Cat','Dog','Cow','Horse'], ans:1,
    learn:{ word:'Dog', pron:'dog', meaning:'Perro', example:'The dog is big.' } },
  { tema:'animals', q:'¿Cómo se dice "Pájaro"?', opts:['Fish','Bird','Duck','Cat'], ans:1,
    learn:{ word:'Bird', pron:'berd', meaning:'Pájaro', example:'The bird can fly.' } },

  // ── Comida ──
  { tema:'food', icon:'🍎', q:'¿Qué es 🍎?', opts:['Apple','Bread','Milk','Egg'], ans:0,
    learn:{ word:'Apple', pron:'Á-pol', meaning:'Manzana', example:'I eat an apple.' } },
  { tema:'food', q:'¿Qué significa "Water"?', opts:['Pan','Agua','Leche','Café'], ans:1,
    learn:{ word:'Water', pron:'UÓ-ter', meaning:'Agua', example:'I drink water.' } },
  { tema:'food', icon:'🍞', q:'¿Qué es 🍞?', opts:['Bread','Rice','Meat','Fish'], ans:0,
    learn:{ word:'Bread', pron:'bred', meaning:'Pan', example:'I like bread.' } },

  // ── Días y clima ──
  { tema:'days_months', q:'¿Cómo se dice "Lunes"?', opts:['Sunday','Monday','Friday','Tuesday'], ans:1,
    learn:{ word:'Monday', pron:'MÁN-dei', meaning:'Lunes', example:'Monday is busy.' } },
  { tema:'weather', icon:'☀️', q:'¿Qué clima es ☀️?', opts:['Rainy','Sunny','Cloudy','Windy'], ans:1,
    learn:{ word:'Sunny', pron:'SÁ-ni', meaning:'Soleado', example:'It is sunny today.' } },
  { tema:'weather', icon:'🌧️', q:'¿Qué clima es 🌧️?', opts:['Sunny','Rainy','Snowy','Windy'], ans:1,
    learn:{ word:'Rainy', pron:'RÉI-ni', meaning:'Lluvioso', example:'It is rainy now.' } },

  // ── Verbo to be ──
  { tema:'verb_tobe', q:'Completa: "I ___ a student."', opts:['am','is','are','be'], ans:0,
    learn:{ word:'I am', pron:'ai am', meaning:'Yo soy/estoy', example:'I am a student.' } },
  { tema:'verb_tobe', q:'Completa: "She ___ happy."', opts:['am','is','are','be'], ans:1,
    learn:{ word:'She is', pron:'shi is', meaning:'Ella es/está', example:'She is happy.' } },
];

async function seed() {
  await ArenaQuestion.deleteMany({ nivel: 'A1' });
  const docs = PREGUNTAS.map(p => Object.assign({ nivel: 'A1', icon: '', image: '' }, p));
  await ArenaQuestion.insertMany(docs);
  console.log(`✅ Arena A1: ${docs.length} preguntas insertadas en la colección "arenaquestions"`);
  mongoose.disconnect();
}
