const express  = require('express');
const http     = require('http');
const mongoose = require('mongoose');
const cors     = require('cors');
const helmet   = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);   // http server para compartir Express + Socket.io

// --- Seguridad ---
app.use(helmet());                                  // headers de seguridad
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10kb' }));           // limite de tamaño del body
app.use(mongoSanitize());                           // anti NoSQL injection

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/practice', require('./routes/practice'));
app.use('/api/cursos',   require('./routes/cursos'));
app.use('/api/quiz',     require('./routes/quiz'));
app.use('/api/tts',      require('./routes/tts'));
app.use('/api/interview', require('./routes/interview'));
app.use('/api/guide',    require('./routes/guide'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/placement-test', require('./routes/placementTest'));
app.use('/api/arena',    require('./routes/arena'));

app.get('/', (_req, res) => res.json({ status: 'Nexlum API OK' }));

// ── AulaQuest Arena (Socket.io, namespace /arena — módulo aislado) ──
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5173'],
    credentials: true,
  },
});
require('./arena/arenaSocket')(io);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀  Backend corriendo en: http://localhost:${PORT}`));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅  MongoDB conectado exitosamente');
  })  
  .catch(err => {
    console.error('❌  Error en MongoDB:', err.message);
    console.log('⚠️  El servidor sigue vivo, pero el string MONGODB_URI en tu .env está vacío o es incorrecto.');
  });