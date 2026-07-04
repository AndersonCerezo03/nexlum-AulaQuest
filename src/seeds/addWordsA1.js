const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('✅ MongoDB conectado'); run(); })
  .catch(err => { console.error('❌', err.message); process.exit(1); });

const Curso = mongoose.model('Curso', new mongoose.Schema({ nivel: String, temas: Array }, { collection: 'cursos' }));

// Palabras extra por tema (se agregan sin duplicar) — más práctica por ejercicio.
const EXTRA = {
  greetings: [{en:'How are you?',es:'¿Cómo estás?'},{en:'Fine, thank you',es:'Bien, gracias'},{en:'What is your name?',es:'¿Cómo te llamas?'},{en:'My name is...',es:'Me llamo...'},{en:'See you later',es:'Nos vemos luego'},{en:'Have a nice day',es:'Que tengas buen día'},{en:'Good evening',es:'Buenas noches (saludo)'}],
  numbers: [{en:'Thirteen',es:'Trece'},{en:'Fourteen',es:'Catorce'},{en:'Fifteen',es:'Quince'},{en:'Sixteen',es:'Dieciséis'},{en:'Thirty',es:'Treinta'},{en:'Forty',es:'Cuarenta'},{en:'Fifty',es:'Cincuenta'}],
  colors: [{en:'Light blue',es:'Celeste'},{en:'Dark',es:'Oscuro'},{en:'Light',es:'Claro'},{en:'Colorful',es:'Colorido'},{en:'Beige',es:'Beige'},{en:'Turquoise',es:'Turquesa'}],
  family: [{en:'Uncle',es:'Tío'},{en:'Aunt',es:'Tía'},{en:'Cousin',es:'Primo/a'},{en:'Husband',es:'Esposo'},{en:'Wife',es:'Esposa'},{en:'Grandfather',es:'Abuelo'},{en:'Grandmother',es:'Abuela'}],
  food: [{en:'Rice',es:'Arroz'},{en:'Chicken',es:'Pollo'},{en:'Cheese',es:'Queso'},{en:'Juice',es:'Jugo'},{en:'Soup',es:'Sopa'},{en:'Salad',es:'Ensalada'},{en:'Breakfast',es:'Desayuno'}],
  body: [{en:'Shoulder',es:'Hombro'},{en:'Knee',es:'Rodilla'},{en:'Finger',es:'Dedo'},{en:'Tooth',es:'Diente'},{en:'Neck',es:'Cuello'},{en:'Chest',es:'Pecho'}],
  animals: [{en:'Horse',es:'Caballo'},{en:'Cow',es:'Vaca'},{en:'Duck',es:'Pato'},{en:'Rabbit',es:'Conejo'},{en:'Sheep',es:'Oveja'},{en:'Frog',es:'Rana'}],
  objects: [{en:'Chair',es:'Silla'},{en:'Table',es:'Mesa'},{en:'Lamp',es:'Lámpara'},{en:'Mirror',es:'Espejo'},{en:'Clock',es:'Reloj (de pared)'},{en:'Curtain',es:'Cortina'}],
  verbs: [{en:'To open',es:'Abrir'},{en:'To close',es:'Cerrar'},{en:'To buy',es:'Comprar'},{en:'To give',es:'Dar'},{en:'To bring',es:'Traer'},{en:'To listen',es:'Escuchar'}],
  adjectives: [{en:'Empty',es:'Vacío'},{en:'Full',es:'Lleno'},{en:'Clean',es:'Limpio'},{en:'Dirty',es:'Sucio'},{en:'Strong',es:'Fuerte'},{en:'Weak',es:'Débil'}],
  prepositions: [{en:'Between',es:'Entre'},{en:'Behind',es:'Detrás de'},{en:'In front of',es:'Enfrente de'},{en:'Next to',es:'Al lado de'},{en:'Above',es:'Encima de'},{en:'Below',es:'Debajo de'}],
  grammar: [{en:'This is',es:'Esto es'},{en:'These are',es:'Estos son'},{en:'There is',es:'Hay (singular)'},{en:'There are',es:'Hay (plural)'},{en:'I have',es:'Yo tengo'},{en:'I do not have',es:'No tengo'}],
  days_months: [{en:'Wednesday',es:'Miércoles'},{en:'Thursday',es:'Jueves'},{en:'Saturday',es:'Sábado'},{en:'January',es:'Enero'},{en:'July',es:'Julio'},{en:'December',es:'Diciembre'},{en:'Weekend',es:'Fin de semana'}],
  time: [{en:"It's noon",es:'Es mediodía'},{en:'Half past',es:'Y media'},{en:'Quarter to',es:'Menos cuarto'},{en:'Early',es:'Temprano'},{en:'Late',es:'Tarde'},{en:'What time is it?',es:'¿Qué hora es?'}],
  weather: [{en:'Snowy',es:'Nevado'},{en:'Foggy',es:'Con niebla'},{en:'Warm',es:'Templado'},{en:'Cool',es:'Fresco'},{en:'Storm',es:'Tormenta'},{en:'Umbrella',es:'Paraguas'}],
  clothes: [{en:'Shoes',es:'Zapatos'},{en:'Socks',es:'Calcetines'},{en:'Jacket',es:'Chaqueta'},{en:'Dress',es:'Vestido'},{en:'Hat',es:'Sombrero'},{en:'Gloves',es:'Guantes'}],
  jobs: [{en:'Nurse',es:'Enfermero/a'},{en:'Waiter',es:'Mesero'},{en:'Farmer',es:'Granjero'},{en:'Police officer',es:'Policía'},{en:'Firefighter',es:'Bombero'},{en:'Pilot',es:'Piloto'}],
  places: [{en:'Bakery',es:'Panadería'},{en:'Pharmacy',es:'Farmacia'},{en:'Library',es:'Biblioteca'},{en:'Market',es:'Mercado'},{en:'Beach',es:'Playa'},{en:'Church',es:'Iglesia'}],
  transport: [{en:'Bicycle',es:'Bicicleta'},{en:'Motorcycle',es:'Motocicleta'},{en:'Boat',es:'Barco'},{en:'Airplane',es:'Avión'},{en:'Truck',es:'Camión'},{en:'Ship',es:'Barco grande'}],
  verb_tobe: [{en:'We are',es:'Nosotros somos/estamos'},{en:'You are',es:'Tú eres/estás'},{en:'It is',es:'Es/Está (cosa)'},{en:'Am I...?',es:'¿Soy/Estoy...?'},{en:'Is he...?',es:'¿Es/Está él...?'},{en:'They are not',es:'Ellos no son/están'}],
  phrases: [{en:'I understand',es:'Entiendo'},{en:"I don't understand",es:'No entiendo'},{en:'Can you help me?',es:'¿Puedes ayudarme?'},{en:'How much is it?',es:'¿Cuánto cuesta?'},{en:'Excuse me',es:'Disculpe'},{en:'I am sorry',es:'Lo siento'}],
};

async function run() {
  const curso = await Curso.findOne({ nivel: 'A1' });
  if (!curso) { console.error('No hay curso A1'); process.exit(1); }
  let añadidas = 0;
  curso.temas.forEach(t => {
    const extra = EXTRA[t.id]; if (!extra) return;
    const set = new Set((t.vocabulario || []).map(w => w.en.toLowerCase()));
    extra.forEach(w => { if (!set.has(w.en.toLowerCase())) { t.vocabulario.push(w); set.add(w.en.toLowerCase()); añadidas++; } });
  });
  curso.markModified('temas');
  await curso.save();
  const total = curso.temas.reduce((a, t) => a + (t.vocabulario || []).length, 0);
  console.log(`✅ A1: ${añadidas} palabras nuevas agregadas · total ahora ${total} palabras en ${curso.temas.length} temas`);
  mongoose.disconnect();
}
