const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const db = mongoose.connection.db;
    await db.collection('cursos').deleteOne({ nivel: 'C1' });
    await db.collection('cursos').insertOne({
      nivel: 'C1',
      temas: [
        { id: 'academic_writing', titulo: 'Escritura academica', icono: '📄',
          vocabulario: [
            {en:'Empirical',es:'Empirico'},{en:'Methodology',es:'Metodologia'},{en:'Paradigm',es:'Paradigma'},
            {en:'Dissertation',es:'Disertacion'},{en:'Peer-reviewed',es:'Revisado por pares'},{en:'Citation',es:'Cita'},
            {en:'Plagiarism',es:'Plagio'},{en:'Abstract',es:'Resumen ejecutivo'},{en:'Footnote',es:'Nota al pie'},
            {en:'Bibliography',es:'Bibliografia'},{en:'Quantitative',es:'Cuantitativo'},{en:'Qualitative',es:'Cualitativo'},
          ]},
        { id: 'advanced_idioms', titulo: 'Expresiones avanzadas', icono: '💡',
          vocabulario: [
            {en:'Bite off more than you can chew',es:'Abarcar mas de lo que puedes'},{en:'The ball is in your court',es:'La decision es tuya'},
            {en:'Bury the hatchet',es:'Hacer las paces'},{en:'The tip of the iceberg',es:'La punta del iceberg'},
            {en:'Throw in the towel',es:'Rendirse'},{en:'Beat around the bush',es:'Andar con rodeos'},
            {en:'Get the ball rolling',es:'Poner las cosas en marcha'},{en:'Burn the midnight oil',es:'Trabajar hasta tarde'},
            {en:'Hit the ground running',es:'Comenzar con fuerza'},{en:'Once in a blue moon',es:'Muy de vez en cuando'},
            {en:'Sit on the fence',es:'No tomar partido'},{en:'The writing is on the wall',es:'El final esta cerca'},
          ]},
        { id: 'philosophy', titulo: 'Filosofia y etica', icono: '🤔',
          vocabulario: [
            {en:'Ethics',es:'Etica'},{en:'Morality',es:'Moralidad'},{en:'Epistemology',es:'Epistemologia'},
            {en:'Ontology',es:'Ontologia'},{en:'Determinism',es:'Determinismo'},{en:'Relativism',es:'Relativismo'},
            {en:'Pragmatism',es:'Pragmatismo'},{en:'Consciousness',es:'Consciencia'},{en:'Virtue',es:'Virtud'},
            {en:'Dilemma',es:'Dilema'},{en:'Paradox',es:'Paradoja'},{en:'Transcendence',es:'Trascendencia'},
          ]},
        { id: 'advanced_grammar', titulo: 'Gramatica avanzada C1', icono: '✏️',
          vocabulario: [
            {en:'Inversion for emphasis',es:'Inversion para enfasis'},{en:'Cleft sentences',es:'Oraciones escindidas'},
            {en:'Subjunctive mood',es:'Modo subjuntivo'},{en:'Ellipsis',es:'Elipsis'},
            {en:'Nominalization',es:'Nominalizacion'},{en:'Hedging language',es:'Lenguaje atenuador'},
            {en:'Mixed conditionals',es:'Condicionales mixtos'},{en:'Fronting',es:'Posicion frontal'},
            {en:'Discourse markers',es:'Marcadores del discurso'},{en:'Appositives',es:'Aposiciones'},
            {en:'Reduced relative clauses',es:'Clausulas de relativo reducidas'},{en:'Participle clauses',es:'Clausulas de participio'},
          ]},
        { id: 'negotiation', titulo: 'Negociacion y persuasion', icono: '🤝',
          vocabulario: [
            {en:'Concession',es:'Concesion'},{en:'Compromise',es:'Compromiso'},{en:'Leverage',es:'Influencia'},
            {en:'Mediator',es:'Mediador'},{en:'Arbitration',es:'Arbitraje'},{en:'Deadlock',es:'Punto muerto'},
            {en:'Mutual benefit',es:'Beneficio mutuo'},{en:'Win-win',es:'Ganar-ganar'},{en:'Bottom line',es:'Minimo aceptable'},
            {en:'Stipulation',es:'Estipulacion'},{en:'Clause',es:'Clausula'},{en:'Ratify',es:'Ratificar'},
          ]},
        { id: 'media_criticism', titulo: 'Critica mediatica', icono: '📺',
          vocabulario: [
            {en:'Propaganda',es:'Propaganda'},{en:'Censorship',es:'Censura'},{en:'Objectivity',es:'Objetividad'},
            {en:'Sensationalism',es:'Sensacionalismo'},{en:'Framing',es:'Encuadre informativo'},{en:'Agenda setting',es:'Establecimiento de agenda'},
            {en:'Spin',es:'Manipulacion informativa'},{en:'Whistleblower',es:'Informante'},{en:'Transparency',es:'Transparencia'},
            {en:'Accountability',es:'Responsabilidad publica'},{en:'Disinformation',es:'Desinformacion'},{en:'Deepfake',es:'Contenido manipulado digitalmente'},
          ]},
        { id: 'social_issues', titulo: 'Problemas sociales', icono: '🌍',
          vocabulario: [
            {en:'Discrimination',es:'Discriminacion'},{en:'Inequality',es:'Desigualdad'},{en:'Marginalization',es:'Marginalizacion'},
            {en:'Systemic',es:'Sistemico'},{en:'Privilege',es:'Privilegio'},{en:'Inclusion',es:'Inclusion'},
            {en:'Advocacy',es:'Abogacia'},{en:'Grassroots',es:'De base popular'},{en:'Activism',es:'Activismo'},
            {en:'Reform',es:'Reforma'},{en:'Policy',es:'Politica publica'},{en:'Empowerment',es:'Empoderamiento'},
          ]},
        { id: 'advanced_vocabulary', titulo: 'Vocabulario C1 preciso', icono: '📖',
          vocabulario: [
            {en:'Ambivalent',es:'Ambivalente'},{en:'Compelling',es:'Convincente'},{en:'Contentious',es:'Controvertido'},
            {en:'Detrimental',es:'Perjudicial'},{en:'Elusive',es:'Esquivo'},{en:'Formidable',es:'Formidable'},
            {en:'Inherent',es:'Inherente'},{en:'Nuanced',es:'Matizado'},{en:'Proliferate',es:'Proliferar'},
            {en:'Scrutiny',es:'Escrutinio'},{en:'Undermine',es:'Socavar'},{en:'Unprecedented',es:'Sin precedentes'},
          ]},
        { id: 'presentations', titulo: 'Presentaciones profesionales', icono: '🎯',
          vocabulario: [
            {en:'I would like to draw your attention to',es:'Quisiera llamar su atencion a'},{en:'As previously mentioned',es:'Como se menciono anteriormente'},
            {en:'To summarize the key points',es:'Para resumir los puntos clave'},{en:'This brings me to my next point',es:'Esto me lleva a mi siguiente punto'},
            {en:'Let me elaborate on that',es:'Permitanme profundizar en eso'},{en:'To put it another way',es:'Dicho de otra manera'},
            {en:'The data clearly shows',es:'Los datos muestran claramente'},{en:'It is worth noting that',es:'Vale la pena señalar que'},
            {en:'Moving on to',es:'Pasando a'},{en:'In light of this',es:'A la luz de esto'},
            {en:'The implications are',es:'Las implicaciones son'},{en:'To wrap up',es:'Para concluir'},
          ]},
        { id: 'literature_analysis', titulo: 'Analisis literario', icono: '📚',
          vocabulario: [
            {en:'Allegory',es:'Alegoria'},{en:'Foreshadowing',es:'Presagio literario'},{en:'Motif',es:'Motivo literario'},
            {en:'Connotation',es:'Connotacion'},{en:'Denotation',es:'Denotacion'},{en:'Juxtaposition',es:'Yuxtaposicion'},
            {en:'Hyperbole',es:'Hiperbole'},{en:'Oxymoron',es:'Oxiomoron'},{en:'Allusion',es:'Alusion'},
            {en:'Ambiguity',es:'Ambiguedad'},{en:'Tone',es:'Tono literario'},{en:'Perspective',es:'Perspectiva narrativa'},
          ]},
        { id: 'intercultural', titulo: 'Comunicacion intercultural', icono: '🌐',
          vocabulario: [
            {en:'Cultural sensitivity',es:'Sensibilidad cultural'},{en:'Etiquette',es:'Protocolo'},{en:'Taboo',es:'Tabu'},
            {en:'Stereotype',es:'Estereotipo'},{en:'Assimilation',es:'Asimilacion'},{en:'Multiculturalism',es:'Multiculturalismo'},
            {en:'Xenophobia',es:'Xenofobia'},{en:'Cultural norm',es:'Norma cultural'},{en:'Code-switching',es:'Cambio de codigo'},
            {en:'Subculture',es:'Subcultura'},{en:'Identity',es:'Identidad'},{en:'Acculturation',es:'Aculturacion'},
          ]},
        { id: 'advanced_discourse', titulo: 'Discurso avanzado', icono: '🗣️',
          vocabulario: [
            {en:'Rhetoric',es:'Retorica'},{en:'Oratory',es:'Oratoria'},{en:'Coherence',es:'Coherencia'},
            {en:'Cohesion',es:'Cohesion'},{en:'Register',es:'Registro linguistico'},{en:'Pragmatics',es:'Pragmatica'},
            {en:'Intonation',es:'Entonacion'},{en:'Articulation',es:'Articulacion'},{en:'Fluency',es:'Fluidez'},
            {en:'Precision',es:'Precision'},{en:'Eloquence',es:'Elocuencia'},{en:'Brevity',es:'Brevedad'},
          ]},
      ]
    });
    console.log('✅ Seed C1 completo — 12 temas');
    mongoose.disconnect();
  }).catch(e => { console.error(e.message); process.exit(1); });