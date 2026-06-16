const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('✅ MongoDB conectado'); seed(); })
  .catch(err => { console.error('❌', err.message); process.exit(1); });

async function seed() {
  const db = mongoose.connection;
  await new Promise(r => db.once('open', r));
  await db.collection('cursos').deleteOne({ nivel: 'A1' });
  await db.collection('cursos').insertOne({
    nivel: 'A1',
    temas: [
      {
        id: 'greetings', titulo: 'Saludos y despedidas', icono: '👋',
        vocabulario: [
          { en: 'Hello',        es: 'Hola' },
          { en: 'Goodbye',      es: 'Adios' },
          { en: 'Good morning', es: 'Buenos dias' },
          { en: 'Good afternoon',es:'Buenas tardes' },
          { en: 'Good night',   es: 'Buenas noches' },
          { en: 'Please',       es: 'Por favor' },
          { en: 'Thank you',    es: 'Gracias' },
          { en: 'Sorry',        es: 'Lo siento' },
          { en: 'Yes',          es: 'Si' },
          { en: 'No',           es: 'No' },
          { en: 'Welcome',      es: 'Bienvenido' },
          { en: 'Excuse me',    es: 'Disculpa' },
        ]
      },
      {
        id: 'numbers', titulo: 'Numeros del 1 al 20', icono: '🔢',
        vocabulario: [
          { en: 'One',    es: 'Uno' },
          { en: 'Two',    es: 'Dos' },
          { en: 'Three',  es: 'Tres' },
          { en: 'Four',   es: 'Cuatro' },
          { en: 'Five',   es: 'Cinco' },
          { en: 'Six',    es: 'Seis' },
          { en: 'Seven',  es: 'Siete' },
          { en: 'Eight',  es: 'Ocho' },
          { en: 'Nine',   es: 'Nueve' },
          { en: 'Ten',    es: 'Diez' },
          { en: 'Eleven', es: 'Once' },
          { en: 'Twelve', es: 'Doce' },
          { en: 'Twenty', es: 'Veinte' },
          { en: 'Hundred',es: 'Cien' },
        ]
      },
      {
        id: 'colors', titulo: 'Colores', icono: '🎨',
        vocabulario: [
          { en: 'Red',    es: 'Rojo' },
          { en: 'Blue',   es: 'Azul' },
          { en: 'Green',  es: 'Verde' },
          { en: 'Yellow', es: 'Amarillo' },
          { en: 'White',  es: 'Blanco' },
          { en: 'Black',  es: 'Negro' },
          { en: 'Pink',   es: 'Rosado' },
          { en: 'Orange', es: 'Naranja' },
          { en: 'Purple', es: 'Morado' },
          { en: 'Brown',  es: 'Marron' },
          { en: 'Gray',   es: 'Gris' },
        ]
      },
      {
        id: 'family', titulo: 'Familia', icono: '👨‍👩‍👧',
        vocabulario: [
          { en: 'Mother',      es: 'Madre' },
          { en: 'Father',      es: 'Padre' },
          { en: 'Brother',     es: 'Hermano' },
          { en: 'Sister',      es: 'Hermana' },
          { en: 'Son',         es: 'Hijo' },
          { en: 'Daughter',    es: 'Hija' },
          { en: 'Baby',        es: 'Bebe' },
          { en: 'Grandmother', es: 'Abuela' },
          { en: 'Grandfather', es: 'Abuelo' },
          { en: 'Friend',      es: 'Amigo' },
        ]
      },
      {
        id: 'food', titulo: 'Comida y bebida', icono: '🍎',
        vocabulario: [
          { en: 'Water',   es: 'Agua' },
          { en: 'Bread',   es: 'Pan' },
          { en: 'Milk',    es: 'Leche' },
          { en: 'Apple',   es: 'Manzana' },
          { en: 'Rice',    es: 'Arroz' },
          { en: 'Egg',     es: 'Huevo' },
          { en: 'Coffee',  es: 'Cafe' },
          { en: 'Juice',   es: 'Jugo' },
          { en: 'Meat',    es: 'Carne' },
          { en: 'Soup',    es: 'Sopa' },
          { en: 'Chicken', es: 'Pollo' },
          { en: 'Sugar',   es: 'Azucar' },
        ]
      },
      {
        id: 'body', titulo: 'Partes del cuerpo', icono: '🧍',
        vocabulario: [
          { en: 'Head',  es: 'Cabeza' },
          { en: 'Eye',   es: 'Ojo' },
          { en: 'Nose',  es: 'Nariz' },
          { en: 'Mouth', es: 'Boca' },
          { en: 'Ear',   es: 'Oreja' },
          { en: 'Hand',  es: 'Mano' },
          { en: 'Foot',  es: 'Pie' },
          { en: 'Arm',   es: 'Brazo' },
          { en: 'Leg',   es: 'Pierna' },
          { en: 'Heart', es: 'Corazon' },
        ]
      },
      {
        id: 'animals', titulo: 'Animales', icono: '🐶',
        vocabulario: [
          { en: 'Dog',      es: 'Perro' },
          { en: 'Cat',      es: 'Gato' },
          { en: 'Bird',     es: 'Pajaro' },
          { en: 'Fish',     es: 'Pez' },
          { en: 'Horse',    es: 'Caballo' },
          { en: 'Cow',      es: 'Vaca' },
          { en: 'Lion',     es: 'Leon' },
          { en: 'Elephant', es: 'Elefante' },
          { en: 'Rabbit',   es: 'Conejo' },
          { en: 'Snake',    es: 'Serpiente' },
        ]
      },
      {
        id: 'objects', titulo: 'Objetos del hogar', icono: '🏠',
        vocabulario: [
          { en: 'Door',   es: 'Puerta' },
          { en: 'Window', es: 'Ventana' },
          { en: 'Chair',  es: 'Silla' },
          { en: 'Table',  es: 'Mesa' },
          { en: 'Bed',    es: 'Cama' },
          { en: 'Book',   es: 'Libro' },
          { en: 'Phone',  es: 'Telefono' },
          { en: 'Lamp',   es: 'Lampara' },
          { en: 'Bag',    es: 'Bolsa' },
          { en: 'Key',    es: 'Llave' },
        ]
      },
      {
        id: 'verbs', titulo: 'Verbos esenciales', icono: '⚡',
        vocabulario: [
          { en: 'Go',         es: 'Ir' },
          { en: 'Come',       es: 'Venir' },
          { en: 'Eat',        es: 'Comer' },
          { en: 'Drink',      es: 'Beber' },
          { en: 'Sleep',      es: 'Dormir' },
          { en: 'Work',       es: 'Trabajar' },
          { en: 'Study',      es: 'Estudiar' },
          { en: 'Read',       es: 'Leer' },
          { en: 'Write',      es: 'Escribir' },
          { en: 'Listen',     es: 'Escuchar' },
          { en: 'Speak',      es: 'Hablar' },
          { en: 'Run',        es: 'Correr' },
          { en: 'Walk',       es: 'Caminar' },
          { en: 'Play',       es: 'Jugar' },
          { en: 'Help',       es: 'Ayudar' },
        ]
      },
      {
        id: 'adjectives', titulo: 'Adjetivos opuestos', icono: '🔄',
        vocabulario: [
          { en: 'Big',       es: 'Grande' },
          { en: 'Small',     es: 'Pequeno' },
          { en: 'Good',      es: 'Bueno' },
          { en: 'Bad',       es: 'Malo' },
          { en: 'Hot',       es: 'Caliente' },
          { en: 'Cold',      es: 'Frio' },
          { en: 'New',       es: 'Nuevo' },
          { en: 'Old',       es: 'Viejo' },
          { en: 'Fast',      es: 'Rapido' },
          { en: 'Slow',      es: 'Lento' },
          { en: 'Easy',      es: 'Facil' },
          { en: 'Difficult', es: 'Dificil' },
        ]
      },
      {
        id: 'prepositions', titulo: 'Preposiciones', icono: '🔗',
        vocabulario: [
          { en: 'In',         es: 'En / Dentro de' },
          { en: 'On',         es: 'Sobre / En' },
          { en: 'Under',      es: 'Debajo de' },
          { en: 'Next to',    es: 'Al lado de' },
          { en: 'In front of',es: 'En frente de' },
          { en: 'Behind',     es: 'Detras de' },
          { en: 'And',        es: 'Y' },
          { en: 'But',        es: 'Pero' },
          { en: 'Because',    es: 'Porque' },
          { en: 'At',         es: 'A / En hora' },
        ]
      },
      {
        id: 'grammar', titulo: 'Gramatica basica', icono: '📖',
        vocabulario: [
          { en: 'I am',          es: 'Yo soy / estoy' },
          { en: 'You are',       es: 'Tu eres / estas' },
          { en: 'He is',         es: 'El es / esta' },
          { en: 'She is',        es: 'Ella es / esta' },
          { en: 'We are',        es: 'Nosotros somos' },
          { en: 'They are',      es: 'Ellos son' },
          { en: 'I can',         es: 'Yo puedo' },
          { en: 'I cannot',      es: 'Yo no puedo' },
          { en: 'I was',         es: 'Yo era / estaba' },
          { en: 'I am studying', es: 'Estoy estudiando' },
        ]
      },
    ]
  });
  console.log('✅ Seed A1 completo — 12 temas organizados y validados');
  mongoose.disconnect();
}