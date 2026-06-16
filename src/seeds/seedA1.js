const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('✅ MongoDB conectado'); seed(); })
  .catch(err => { console.error('❌', err.message); process.exit(1); });

const cursoSchema = new mongoose.Schema({ nivel: String, temas: Array }, { collection: 'cursos' });
const Curso = mongoose.model('Curso', cursoSchema);

async function seed() {
  await Curso.deleteOne({ nivel: 'A1' });

  await Curso.create({
    nivel: 'A1',
    temas: [
      {
        id: 'greetings',
        titulo: 'Saludos y despedidas',
        icono: '👋',
        vocabulario: [
          { en: 'Hello',        es: 'Hola' },
          { en: 'Goodbye',      es: 'Adiós' },
          { en: 'Good morning', es: 'Buenos días' },
          { en: 'Good afternoon',es:'Buenas tardes' },
          { en: 'Good night',   es: 'Buenas noches' },
          { en: 'Please',       es: 'Por favor' },
          { en: 'Thank you',    es: 'Gracias' },
          { en: 'Sorry',        es: 'Lo siento' },
          { en: 'Yes',          es: 'Sí' },
          { en: 'No',           es: 'No' },
          { en: 'Welcome',      es: 'Bienvenido' },
          { en: 'Excuse me',    es: 'Disculpa' },
        ]
      },
      {
        id: 'numbers',
        titulo: 'Números del 1 al 20',
        icono: '🔢',
        vocabulario: [
          { en: 'One',      es: 'Uno' },
          { en: 'Two',      es: 'Dos' },
          { en: 'Three',    es: 'Tres' },
          { en: 'Four',     es: 'Cuatro' },
          { en: 'Five',     es: 'Cinco' },
          { en: 'Six',      es: 'Seis' },
          { en: 'Seven',    es: 'Siete' },
          { en: 'Eight',    es: 'Ocho' },
          { en: 'Nine',     es: 'Nueve' },
          { en: 'Ten',      es: 'Diez' },
          { en: 'Eleven',   es: 'Once' },
          { en: 'Twelve',   es: 'Doce' },
          { en: 'Twenty',   es: 'Veinte' },
          { en: 'Hundred',  es: 'Cien' },
        ]
      },
      {
        id: 'colors',
        titulo: 'Colores',
        icono: '🎨',
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
          { en: 'Brown',  es: 'Marrón' },
          { en: 'Gray',   es: 'Gris' },
        ]
      },
      {
        id: 'family',
        titulo: 'Familia',
        icono: '👨‍👩‍👧',
        vocabulario: [
          { en: 'Mother',      es: 'Madre' },
          { en: 'Father',      es: 'Padre' },
          { en: 'Brother',     es: 'Hermano' },
          { en: 'Sister',      es: 'Hermana' },
          { en: 'Son',         es: 'Hijo' },
          { en: 'Daughter',    es: 'Hija' },
          { en: 'Baby',        es: 'Bebé' },
          { en: 'Grandmother', es: 'Abuela' },
          { en: 'Grandfather', es: 'Abuelo' },
          { en: 'Friend',      es: 'Amigo/a' },
        ]
      },
      {
        id: 'food',
        titulo: 'Comida y bebida',
        icono: '🍎',
        vocabulario: [
          { en: 'Water',  es: 'Agua' },
          { en: 'Bread',  es: 'Pan' },
          { en: 'Milk',   es: 'Leche' },
          { en: 'Apple',  es: 'Manzana' },
          { en: 'Rice',   es: 'Arroz' },
          { en: 'Egg',    es: 'Huevo' },
          { en: 'Coffee', es: 'Café' },
          { en: 'Juice',  es: 'Jugo' },
          { en: 'Meat',   es: 'Carne' },
          { en: 'Soup',   es: 'Sopa' },
          { en: 'Chicken',es: 'Pollo' },
          { en: 'Sugar',  es: 'Azúcar' },
        ]
      },
      {
        id: 'body',
        titulo: 'Partes del cuerpo',
        icono: '🧍',
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
          { en: 'Heart', es: 'Corazón' },
        ]
      },
      {
        id: 'animals',
        titulo: 'Animales',
        icono: '🐾',
        vocabulario: [
          { en: 'Dog',      es: 'Perro' },
          { en: 'Cat',      es: 'Gato' },
          { en: 'Bird',     es: 'Pájaro' },
          { en: 'Fish',     es: 'Pez' },
          { en: 'Horse',    es: 'Caballo' },
          { en: 'Cow',      es: 'Vaca' },
          { en: 'Lion',     es: 'León' },
          { en: 'Elephant', es: 'Elefante' },
          { en: 'Rabbit',   es: 'Conejo' },
          { en: 'Snake',    es: 'Serpiente' },
        ]
      },
      {
        id: 'objects',
        titulo: 'Objetos del hogar',
        icono: '🏠',
        vocabulario: [
          { en: 'House',   es: 'Casa' },
          { en: 'Door',    es: 'Puerta' },
          { en: 'Window',  es: 'Ventana' },
          { en: 'Chair',   es: 'Silla' },
          { en: 'Table',   es: 'Mesa' },
          { en: 'Bed',     es: 'Cama' },
          { en: 'Book',    es: 'Libro' },
          { en: 'Phone',   es: 'Teléfono' },
          { en: 'Lamp',    es: 'Lámpara' },
          { en: 'Bag',     es: 'Bolsa' },
        ]
      },
      {
        id: 'verbs',
        titulo: '40 Verbos esenciales',
        icono: '⚡',
        vocabulario: [
          { en: 'Ask',        es: 'Preguntar' },
          { en: 'Buy',        es: 'Comprar' },
          { en: 'Call',       es: 'Llamar' },
          { en: 'Clean',      es: 'Limpiar' },
          { en: 'Come',       es: 'Venir' },
          { en: 'Do',         es: 'Hacer' },
          { en: 'Drink',      es: 'Beber' },
          { en: 'Drive',      es: 'Conducir' },
          { en: 'Eat',        es: 'Comer' },
          { en: 'Find',       es: 'Encontrar' },
          { en: 'Give',       es: 'Dar' },
          { en: 'Go',         es: 'Ir' },
          { en: 'Have',       es: 'Tener' },
          { en: 'Help',       es: 'Ayudar' },
          { en: 'Know',       es: 'Saber' },
          { en: 'Learn',      es: 'Aprender' },
          { en: 'Listen',     es: 'Escuchar' },
          { en: 'Live',       es: 'Vivir' },
          { en: 'Look',       es: 'Mirar' },
          { en: 'Make',       es: 'Fabricar' },
          { en: 'Open',       es: 'Abrir' },
          { en: 'Pay',        es: 'Pagar' },
          { en: 'Read',       es: 'Leer' },
          { en: 'Run',        es: 'Correr' },
          { en: 'Say',        es: 'Decir' },
          { en: 'See',        es: 'Ver' },
          { en: 'Speak',      es: 'Hablar' },
          { en: 'Start',      es: 'Empezar' },
          { en: 'Study',      es: 'Estudiar' },
          { en: 'Take',       es: 'Tomar' },
          { en: 'Think',      es: 'Pensar' },
          { en: 'Understand', es: 'Entender' },
          { en: 'Use',        es: 'Usar' },
          { en: 'Want',       es: 'Querer' },
          { en: 'Work',       es: 'Trabajar' },
          { en: 'Write',      es: 'Escribir' },
          { en: 'Sleep',      es: 'Dormir' },
          { en: 'Walk',       es: 'Caminar' },
          { en: 'Play',       es: 'Jugar' },
          { en: 'Sit',        es: 'Sentarse' },
        ]
      },
      {
        id: 'adjectives',
        titulo: 'Adjetivos opuestos',
        icono: '🔄',
        vocabulario: [
          { en: 'Big',       es: 'Grande' },
          { en: 'Small',     es: 'Pequeño' },
          { en: 'Good',      es: 'Bueno' },
          { en: 'Bad',       es: 'Malo' },
          { en: 'Hot',       es: 'Caliente' },
          { en: 'Cold',      es: 'Frío' },
          { en: 'New',       es: 'Nuevo' },
          { en: 'Old',       es: 'Viejo' },
          { en: 'Fast',      es: 'Rápido' },
          { en: 'Slow',      es: 'Lento' },
          { en: 'Easy',      es: 'Fácil' },
          { en: 'Difficult', es: 'Difícil' },
          { en: 'Happy',     es: 'Feliz' },
          { en: 'Sad',       es: 'Triste' },
          { en: 'Cheap',     es: 'Barato' },
          { en: 'Expensive', es: 'Caro' },
        ]
      },
      {
        id: 'prepositions',
        titulo: 'Preposiciones y conectores',
        icono: '🔗',
        vocabulario: [
          { en: 'In',          es: 'En / Dentro de' },
          { en: 'On',          es: 'Sobre / En' },
          { en: 'Under',       es: 'Debajo de' },
          { en: 'Next to',     es: 'Al lado de' },
          { en: 'In front of', es: 'En frente de' },
          { en: 'Behind',      es: 'Detrás de' },
          { en: 'And',         es: 'Y' },
          { en: 'But',         es: 'Pero' },
          { en: 'Because',     es: 'Porque' },
          { en: 'At',          es: 'A / En (hora)' },
        ]
      },
      {
        id: 'grammar',
        titulo: 'Estructuras gramaticales',
        icono: '📖',
        vocabulario: [
          { en: 'I am',          es: 'Yo soy / estoy' },
          { en: 'You are',       es: 'Tú eres / estás' },
          { en: 'He is',         es: 'Él es / está' },
          { en: 'She is',        es: 'Ella es / está' },
          { en: 'We are',        es: 'Nosotros somos' },
          { en: 'They are',      es: 'Ellos son' },
          { en: 'I can',         es: 'Yo puedo' },
          { en: 'I cannot',      es: 'Yo no puedo' },
          { en: 'I was',         es: 'Yo era / estaba' },
          { en: 'We were',       es: 'Éramos / estábamos' },
          { en: 'I am studying', es: 'Estoy estudiando' },
          { en: 'Some',          es: 'Algunos / un poco' },
          { en: 'Any',           es: 'Alguno (preguntas)' },
          { en: 'How much',      es: '¿Cuánto? (incontable)' },
          { en: 'How many',      es: '¿Cuántos? (contable)' },
        ]
      }
    ]
  });

  console.log('✅ Seed A1 completado —', 12, 'temas insertados en MongoDB');
  mongoose.disconnect();
}