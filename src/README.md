<div align="center">

# 🎮 AulaQuest

### Plataforma de aprendizaje de inglés gamificada

*Una creación de **Nexlum Software** — Medellín, Colombia*

Aprende, juega y sube de nivel con tu avatar. Practica inglés con un tutor de voz,
completa misiones y avanza de A1 a C2.

`React` · `Node/Express` · `MongoDB` · `JWT` · `OpenAI` · `ElevenLabs` · `n8n`

</div>

---

## 📋 Tabla de contenido

- [Descripción](#-descripción)
- [Funcionalidades](#-funcionalidades)
- [Stack tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Base de datos](#-base-de-datos)
- [API — Endpoints](#-api--endpoints)
- [Variables de entorno](#-variables-de-entorno)
- [Instalación y arranque](#-instalación-y-arranque)
- [Seguridad](#-seguridad)
- [Bot de WhatsApp (n8n)](#-bot-de-whatsapp-n8n)

---

## 📖 Descripción

**AulaQuest** es una aplicación web para aprender inglés con mecánicas de juego.
Cada estudiante tiene un avatar, gana puntos de experiencia (XP), completa temas de
vocabulario por nivel y debe aprobar un quiz para avanzar al siguiente nivel.
Incluye un tutor de voz (**Mr. Alex**), práctica de entrevistas de trabajo en inglés
por voz, y minijuegos.

---

## ✨ Funcionalidades

- 🔐 **Autenticación JWT** con verificación de correo, recuperación de contraseña y bloqueo por intentos fallidos.
- 📚 **6 niveles CEFR** (A1 → C2), cada uno con temas de vocabulario y un quiz de avance.
- 🔒 **Progresión estricta:** hay que completar los temas para desbloquear el quiz, y aprobarlo para subir de nivel.
- 🗣️ **Tutor de voz Mr. Alex** (ElevenLabs) que pronuncia y corrige.
- 💼 **Entrevistas de trabajo en inglés** por voz (vía n8n + OpenAI).
- 🎯 **Minijuegos** (memoria, lluvia de palabras).
- 📊 **Panel de administración** con estadísticas y gestión de estudiantes.
- 💬 **Bot de soporte por WhatsApp** (n8n + OpenAI + Whapi.Cloud).

---

## 🛠 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19 + Vite |
| **Backend** | Node.js + Express 4 |
| **Base de datos** | MongoDB + Mongoose |
| **Autenticación** | JWT (jsonwebtoken) + bcryptjs |
| **Voz / TTS** | ElevenLabs API |
| **IA conversacional** | OpenAI (gpt-4o-mini) |
| **Automatización** | n8n (entrevistas + bot WhatsApp) |
| **Correo** | Nodemailer (SMTP) |

---

## 🏗 Arquitectura

```
┌─────────────┐      HTTP/JSON      ┌──────────────┐      ┌────────────┐
│  Frontend   │ ──────────────────► │   Backend    │ ───► │  MongoDB   │
│ React/Vite  │ ◄────────────────── │ Express API  │ ◄─── │            │
│  :5173      │                     │   :5001      │      │  :27017    │
└─────────────┘                     └──────┬───────┘      └────────────┘
                                           │
                          ┌────────────────┼────────────────┐
                          ▼                ▼                 ▼
                    ┌───────────┐   ┌────────────┐    ┌───────────┐
                    │ ElevenLabs│   │   OpenAI   │    │    n8n     │
                    │   (voz)   │   │ (gpt-4o)   │    │  :5678     │
                    └───────────┘   └────────────┘    └─────┬─────┘
                                                            │
                                                    ┌───────▼────────┐
                                                    │  Whapi.Cloud   │
                                                    │  (WhatsApp)    │
                                                    └────────────────┘
```

---

## 📁 Estructura del proyecto

```
nexlum/
├── src/                      # Backend
│   ├── app.js                # Punto de entrada (Express + Mongo)
│   ├── controllers/          # Lógica de negocio
│   ├── middleware/
│   │   ├── auth.js           # Verificación de JWT
│   │   ├── admin.js          # Verificación de rol admin
│   │   └── rateLimit.js      # Límites de peticiones
│   ├── models/               # Esquemas Mongoose
│   │   ├── User.js
│   │   ├── Mision.js
│   │   └── Quiz.js
│   ├── routes/               # Endpoints de la API
│   │   ├── auth.js
│   │   ├── cursos.js
│   │   ├── practice.js
│   │   ├── quiz.js
│   │   ├── tts.js
│   │   ├── interview.js
│   │   └── admin.js
│   ├── seeds/                # Scripts para poblar la BD
│   │   ├── seedA1.js ... seedC2.js
│   │   ├── seedQuizA1.js ... seedQuizC2.js
│   │   ├── makeAdmin.js
│   │   └── listUsers.js
│   └── utils/
│       ├── mailer.js         # Envío de correos (SMTP)
│       └── validators.js     # Validación de datos
├── frontend/                 # Frontend
│   ├── public/
│   │   ├── nexlum-logo.png   # Favicon / logo Nexlum
│   │   └── avatars/          # Fotos de entrevistadores
│   ├── src/
│   │   ├── App.jsx           # Componente principal
│   │   ├── WhatsAppButton.jsx# Botón flotante de WhatsApp
│   │   └── main.jsx          # Entrada de React
│   └── index.html
├── .env                      # Variables de entorno (NO se sube)
└── .gitignore
```

---

## 🗄 Base de datos

MongoDB con **3 colecciones** principales (Mongoose).

### 👤 User (`users`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | String | Nombre (2–60 caracteres) |
| `email` | String | Único, en minúsculas |
| `password` | String | Hash bcrypt (factor 12) |
| `role` | Enum | `user` \| `admin` |
| `englishLevel` | Enum | `A1`–`C2` (default `A1`) |
| `experiencePoints` | Number | XP acumulado |
| `wordsCorrect` | Number | Palabras acertadas |
| `nivelesAprobados` | [String] | Niveles ya aprobados |
| `progresoTemas` | Map | Temas completados por nivel |
| `ultimoTema` | String | Último tema visitado |
| `emailVerified` | Boolean | Correo verificado |
| `verifyToken` / `verifyTokenExp` | String / Date | Verificación de correo |
| `resetToken` / `resetTokenExp` | String / Date | Recuperación de contraseña |
| `failedLogins` | Number | Intentos fallidos de login |
| `lockUntil` | Date | Bloqueo temporal de cuenta |

**Métodos:** `matchPassword()`, `isLocked()`. El `toJSON()` elimina campos sensibles
(password, tokens, bloqueos) antes de enviar al cliente. El password se hashea
automáticamente con un hook `pre('save')`.

### 📝 Quiz (`quizzes`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nivel` | String | Nivel del quiz (único) |
| `nivelTarget` | String | Nivel al que se avanza al aprobar |
| `titulo` | String | Título del quiz |
| `descripcion` | String | Descripción |
| `minScore` | Number | Puntaje mínimo para aprobar (default 7) |
| `totalPregs` | Number | Total de preguntas (default 10) |
| `preguntas` | [Question] | Lista de preguntas |

**Subdocumento Question:** `q` (pregunta), `opts` (opciones), `ans` (índice correcto),
`tipo` (`vocab` \| `grammar` \| `listening` \| `fill`).

### 🎯 Mision (`misions`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `titulo` | String | Título de la misión |
| `descripcion` | String | Descripción |
| `nivel` | Enum | `A1`–`C2` |
| `habilidad` | Enum | `conversacion` \| `escritura` \| `comprension` \| `lectura` |
| `xpRecompensa` | Number | XP que otorga (default 100) |
| `duracionMin` | Number | Duración estimada (default 15) |
| `activa` | Boolean | Si está activa |
| `ejercicios` | [Ejercicio] | Lista de ejercicios |

**Subdocumento Ejercicio:** `pregunta`, `opciones`, `respuestaCorrecta`, `tipo`
(`opcion_multiple` \| `traduccion` \| `completar`).

---

## 🔌 API — Endpoints

Base URL: `http://localhost:5001/api`

### 🔐 Auth — `/api/auth`
| Método | Ruta | Descripción | Protegido |
|--------|------|-------------|-----------|
| POST | `/register` | Registro de usuario | — |
| POST | `/login` | Inicio de sesión | — |
| GET | `/verify/:token` | Verificar correo | — |
| POST | `/resend-verify` | Reenviar verificación | — |
| POST | `/forgot-password` | Solicitar recuperación | — |
| POST | `/reset-password` | Restablecer contraseña | — |
| GET | `/user` | Datos del usuario actual | ✅ JWT |

### 📚 Cursos — `/api/cursos`
| Método | Ruta | Descripción | Protegido |
|--------|------|-------------|-----------|
| GET | `/:nivel` | Temas de un nivel | ✅ JWT |
| GET | `/:nivel/tema/:temaId/palabra` | Palabra de un tema | ✅ JWT |

### 🎯 Practice — `/api/practice`
| Método | Ruta | Descripción | Protegido |
|--------|------|-------------|-----------|
| POST | `/word-done` | Registrar palabra acertada | ✅ JWT |
| GET | `/progreso` | Progreso del usuario | ✅ JWT |
| POST | `/ultimo-tema` | Guardar último tema | ✅ JWT |

### 📝 Quiz — `/api/quiz`
| Método | Ruta | Descripción | Protegido |
|--------|------|-------------|-----------|
| GET | `/:nivel` | Obtener quiz del nivel | ✅ JWT |
| POST | `/:nivel/submit` | Enviar respuestas | ✅ JWT |

### 🗣️ TTS — `/api/tts`
| Método | Ruta | Descripción | Protegido |
|--------|------|-------------|-----------|
| POST | `/speak` | Texto a voz (inglés) | ✅ JWT |
| POST | `/speak-es` | Texto a voz (español) | ✅ JWT |
| POST | `/speak-slow` | Texto a voz (lento) | ✅ JWT |

### 💼 Interview — `/api/interview`
| Método | Ruta | Descripción | Protegido |
|--------|------|-------------|-----------|
| POST | `/message` | Mensaje a la entrevista (proxy a n8n) | ✅ JWT |

### ⚙️ Admin — `/api/admin`
| Método | Ruta | Descripción | Protegido |
|--------|------|-------------|-----------|
| GET | `/stats` | Estadísticas generales | ✅ JWT + admin |
| GET | `/users` | Lista de usuarios | ✅ JWT + admin |
| GET | `/level/:nivel` | Datos por nivel | ✅ JWT + admin |
| GET | `/student/:id` | Detalle de estudiante | ✅ JWT + admin |
| PUT | `/student/:id` | Actualizar estudiante | ✅ JWT + admin |
| DELETE | `/student/:id` | Eliminar estudiante | ✅ JWT + admin |

---

## 🔑 Variables de entorno

Crea un archivo `.env` en la raíz (`nexlum/`). **Nunca lo subas a GitHub.**

```env
# Servidor
PORT=5001
MONGODB_URI=mongodb://localhost:27017/aulaquest

# Autenticación
JWT_SECRET=tu_secreto_largo_y_aleatorio
JWT_EXPIRES=7d

# Correo (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_app_password
MAIL_FROM=AulaQuest <tu_correo@gmail.com>
REQUIRE_EMAIL_VERIFICATION=true
APP_URL=http://localhost:5173

# Servicios de IA / voz
ELEVENLABS_API_KEY=tu_clave_elevenlabs
OPENAI_API_KEY=tu_clave_openai

# n8n
N8N_INTERVIEW_URL=http://localhost:5678/webhook/interview
```

---

## 🚀 Instalación y arranque

### Requisitos
- Node.js 18+
- MongoDB (local o Atlas)

### Pasos

```bash
# 1. Clonar
git clone https://github.com/AndersonCerezo03/nexlum-AulaQuest.git
cd nexlum-AulaQuest

# 2. Instalar dependencias del backend
npm install

# 3. Instalar dependencias del frontend
cd frontend && npm install && cd ..

# 4. Crear el archivo .env (ver sección anterior)

# 5. Poblar la base de datos (niveles y quizzes)
node src/seeds/seedA1.js
node src/seeds/seedQuizA1.js
# ... repetir para A2–C2

# 6. Arrancar el backend (puerto 5001)
npm run dev

# 7. En otra terminal, arrancar el frontend (puerto 5173)
cd frontend && npm run dev
```

App en `http://localhost:5173` · API en `http://localhost:5001`

---

## 🔒 Seguridad

- **Contraseñas:** hasheadas con bcrypt (factor 12), nunca en texto plano.
- **JWT:** autenticación por token; el token no se persiste en `localStorage`.
- **Bloqueo de cuenta:** tras varios intentos fallidos (`failedLogins` + `lockUntil`).
- **Verificación de correo** y recuperación de contraseña con tokens de expiración.
- **Rate limiting** en endpoints sensibles (registro, login, recuperación).
- **CORS** restringido al dominio del frontend.
- **Datos sensibles** (password, tokens) eliminados de las respuestas vía `toJSON()`.
- **`.env`** fuera del control de versiones (`.gitignore`).

---

## 💬 Bot de WhatsApp (n8n)

Flujo de soporte automatizado independiente del backend:

```
WhatsApp → Whapi.Cloud → (webhook) → ngrok → n8n → OpenAI → respuesta → WhatsApp
```

- **Webhook** en n8n recibe los mensajes (evento `messages.post`).
- **Nodo Code** filtra grupos / mensajes propios y arma el prompt de soporte.
- **OpenAI** (gpt-4o-mini) genera la respuesta como asistente de Nexlum.
- Palabras clave: `salir`/`menu` para cerrar o reabrir el menú.
- **ngrok** expone n8n local; en producción se recomienda un dominio fijo (VPS).

---

<div align="center">

**Nexlum Software** · Medellín, Colombia
Ingeniería de software a la medida y automatización con IA

</div>