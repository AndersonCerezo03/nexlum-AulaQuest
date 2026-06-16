const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const db = mongoose.connection.db;
    await db.collection('cursos').deleteOne({ nivel: 'C2' });
    await db.collection('cursos').insertOne({
      nivel: 'C2',
      temas: [
        { id: 'mastery_vocabulary', titulo: 'Vocabulario de maestria', icono: '👑',
          vocabulario: [
            {en:'Perspicacious',es:'Perspicaz'},{en:'Obfuscate',es:'Ofuscar'},{en:'Ephemeral',es:'Efimero'},
            {en:'Mellifluous',es:'Melodioso'},{en:'Sycophant',es:'Adulador'},{en:'Vociferous',es:'Vociferante'},
            {en:'Labyrinthine',es:'Laberintico'},{en:'Recondite',es:'Arcano / Oscuro'},{en:'Loquacious',es:'Locuaz'},
            {en:'Sagacious',es:'Sagaz'},{en:'Perfidious',es:'Perfido'},{en:'Magnanimous',es:'Magnifico / Generoso'},
          ]},
        { id: 'subtle_nuances', titulo: 'Matices y sutilezas', icono: '🎭',
          vocabulario: [
            {en:'Imply vs Infer',es:'Implicar vs Inferir'},{en:'Affect vs Effect',es:'Afectar vs Efecto'},
            {en:'Comprise vs Compose',es:'Comprender vs Componer'},{en:'Disinterested vs Uninterested',es:'Imparcial vs Sin interes'},
            {en:'Continual vs Continuous',es:'Intermitente vs Continuo'},{en:'Farther vs Further',es:'Mas lejos vs Ademas'},
            {en:'Lay vs Lie',es:'Poner vs Yacer'},{en:'Principal vs Principle',es:'Principal vs Principio'},
            {en:'Literally vs Figuratively',es:'Literalmente vs Figurativamente'},{en:'Deprecate vs Depreciate',es:'Desaprobar vs Depreciar'},
            {en:'Elicit vs Illicit',es:'Obtener vs Ilicito'},{en:'Flaunt vs Flout',es:'Ostentar vs Ignorar'},
          ]},
        { id: 'advanced_rhetoric', titulo: 'Retorica y persuasion C2', icono: '⚡',
          vocabulario: [
            {en:'Ethos',es:'Credibilidad del orador'},{en:'Pathos',es:'Apelacion a las emociones'},
            {en:'Logos',es:'Apelacion a la logica'},{en:'Anaphora',es:'Anafora'},
            {en:'Chiasmus',es:'Quiasmo'},{en:'Litotes',es:'Litote'},
            {en:'Synecdoche',es:'Sinecdoque'},{en:'Periphrasis',es:'Perifrasis'},
            {en:'Antithesis',es:'Antitesis'},{en:'Epistrophe',es:'Epifora'},
            {en:'Understatement',es:'Eufemismo sutil'},{en:'Circumlocution',es:'Circunloquio'},
          ]},
        { id: 'complex_conditionals', titulo: 'Condicionales complejos C2', icono: '🔀',
          vocabulario: [
            {en:'Were it not for the fact that',es:'Si no fuera por el hecho de que'},
            {en:'Had circumstances been different',es:'Si las circunstancias hubieran sido diferentes'},
            {en:'Should the need arise',es:'Si surgiera la necesidad'},
            {en:'But for your intervention',es:'De no ser por tu intervencion'},
            {en:'Supposing that were possible',es:'Suponiendo que eso fuera posible'},
            {en:'Given that this is the case',es:'Dado que este es el caso'},
            {en:'In the event that',es:'En el caso de que'},{en:'On the assumption that',es:'Bajo el supuesto de que'},
            {en:'Provided the conditions are met',es:'Siempre que se cumplan las condiciones'},
            {en:'Only if all parties agree',es:'Solo si todas las partes estan de acuerdo'},
            {en:'Under no circumstances would',es:'Bajo ninguna circunstancia'},
            {en:'Not until much later did',es:'No fue hasta mucho despues que'},
          ]},
        { id: 'native_expressions', titulo: 'Expresiones de hablante nativo', icono: '🇺🇸',
          vocabulario: [
            {en:'That is neither here nor there',es:'Eso no viene al caso'},{en:'By the same token',es:'Del mismo modo'},
            {en:'For all intents and purposes',es:'A todos los efectos'},{en:'In the grand scheme of things',es:'En el gran esquema de las cosas'},
            {en:'Touch and go',es:'Muy incierto'},{en:'A far cry from',es:'Muy diferente de'},
            {en:'Leave no stone unturned',es:'No dejar piedra sin mover'},{en:'The jury is still out',es:'Aun no hay veredicto'},
            {en:'A double-edged sword',es:'Un arma de doble filo'},{en:'On borrowed time',es:'Vivir de prestado'},
            {en:'Draw the line',es:'Poner un limite'},{en:'Move the goalposts',es:'Cambiar las reglas del juego'},
          ]},
        { id: 'advanced_connectors', titulo: 'Conectores de nivel nativo', icono: '🔗',
          vocabulario: [
            {en:'Insofar as',es:'En la medida en que'},{en:'Inasmuch as',es:'Dado que / En tanto que'},
            {en:'By virtue of',es:'En virtud de'},{en:'In lieu of',es:'En lugar de'},
            {en:'With a view to',es:'Con miras a'},{en:'In so far as',es:'En cuanto a'},
            {en:'To the extent that',es:'En la medida en que'},{en:'Vis-a-vis',es:'En relacion con'},
            {en:'De facto',es:'De hecho'},{en:'Inter alia',es:'Entre otras cosas'},
            {en:'Mutatis mutandis',es:'Cambiando lo que se deba cambiar'},{en:'A priori',es:'A priori'},
          ]},
        { id: 'discourse_mastery', titulo: 'Dominio del discurso', icono: '🎙️',
          vocabulario: [
            {en:'It stands to reason that',es:'Es logico que'},{en:'One cannot help but notice',es:'No se puede evitar notar'},
            {en:'It begs the question',es:'Surge la pregunta'},{en:'Without loss of generality',es:'Sin perder generalidad'},
            {en:'All things considered',es:'Considerando todo'},{en:'It is axiomatic that',es:'Es axiomatico que'},
            {en:'By no stretch of the imagination',es:'De ninguna manera'},{en:'At the risk of oversimplifying',es:'A riesgo de simplificar'},
            {en:'The crux of the matter',es:'El punto clave del asunto'},{en:'To put it in perspective',es:'Para dimensionarlo'},
            {en:'It merits serious consideration',es:'Merece seria consideracion'},{en:'This cannot be overstated',es:'Esto no se puede exagerar'},
          ]},
        { id: 'precision_language', titulo: 'Lenguaje de precision', icono: '🎯',
          vocabulario: [
            {en:'Approximately vs Roughly',es:'Aproximadamente vs Aproximadamente (informal)'},{en:'Significant vs Considerable',es:'Significativo vs Considerable'},
            {en:'Crucial vs Critical',es:'Crucial vs Critico'},{en:'Apparent vs Evident',es:'Aparente vs Evidente'},
            {en:'Adequate vs Sufficient',es:'Adecuado vs Suficiente'},{en:'Modify vs Alter',es:'Modificar vs Alterar'},
            {en:'Examine vs Scrutinize',es:'Examinar vs Escudriñar'},{en:'Decline vs Deteriorate',es:'Declinar vs Deteriorar'},
            {en:'Obtain vs Acquire',es:'Obtener vs Adquirir'},{en:'Indicate vs Demonstrate',es:'Indicar vs Demostrar'},
            {en:'Assist vs Facilitate',es:'Asistir vs Facilitar'},{en:'Require vs Necessitate',es:'Requerir vs Hacer necesario'},
          ]},
        { id: 'professional_mastery', titulo: 'Dominio profesional', icono: '💎',
          vocabulario: [
            {en:'Value proposition',es:'Propuesta de valor'},{en:'Paradigm shift',es:'Cambio de paradigma'},
            {en:'Core competency',es:'Competencia esencial'},{en:'Synergy',es:'Sinergia'},
            {en:'Disruptive innovation',es:'Innovacion disruptiva'},{en:'Thought leadership',es:'Liderazgo de opinion'},
            {en:'Strategic alignment',es:'Alineacion estrategica'},{en:'Change management',es:'Gestion del cambio'},
            {en:'Agile methodology',es:'Metodologia agil'},{en:'Scalability',es:'Escalabilidad'},
            {en:'Value chain',es:'Cadena de valor'},{en:'Competitive advantage',es:'Ventaja competitiva'},
          ]},
        { id: 'cultural_mastery', titulo: 'Dominio cultural nativo', icono: '🌟',
          vocabulario: [
            {en:'Catch-22',es:'Situacion sin salida'},{en:'Kafkaesque',es:'Absurdo y burocrático'},
            {en:'Pyrrhic victory',es:'Victoria pirrica'},{en:'Machiavellian',es:'Maquiavelico'},
            {en:'Herculean task',es:'Tarea herculea'},{en:'Sisyphean',es:'Sisifeo / Imposible'},
            {en:'Orwellian',es:'Orwelliano / Totalitario'},{en:'Quixotic',es:'Quijotesco / Idealista'},
            {en:'Promethean',es:'Prometeo / Audaz'},{en:'Draconian',es:'Draconiano / Severo'},
            {en:'Platonic',es:'Platonico'},{en:'Narcissistic',es:'Narcisista'},
          ]},
        { id: 'spontaneous_speech', titulo: 'Habla espontanea y natural', icono: '💬',
          vocabulario: [
            {en:'To be honest with you',es:'Para ser honesto contigo'},{en:'If you ask me',es:'Si me preguntas'},
            {en:'At the end of the day',es:'Al final del dia'},{en:'Come to think of it',es:'Pensandolo bien'},
            {en:'As a matter of fact',es:'De hecho'},{en:'Off the top of my head',es:'De improviso'},
            {en:'For what it is worth',es:'Por lo que vale'},{en:'Between you and me',es:'Entre tu y yo'},
            {en:'If anything',es:'Si acaso'},{en:'Having said that',es:'Dicho esto'},
            {en:'Mind you',es:'Eso si'},{en:'Come to that',es:'Ya que estamos'},
          ]},
        { id: 'grammar_c2', titulo: 'Gramatica C2 — dominio total', icono: '🏆',
          vocabulario: [
            {en:'Absolute construction',es:'Construccion absoluta'},{en:'Dangling modifier',es:'Modificador colgante'},
            {en:'Appositive phrase',es:'Frase apositiva'},{en:'Gerund as subject',es:'Gerundio como sujeto'},
            {en:'Inverted conditional',es:'Condicional invertido'},{en:'Extraposition',es:'Extraposicion'},
            {en:'Cataphoric reference',es:'Referencia catáforica'},{en:'Anaphoric reference',es:'Referencia anaforica'},
            {en:'Garden path sentence',es:'Oracion de interpretacion erronea'},{en:'Structural ambiguity',es:'Ambiguedad estructural'},
            {en:'Zero article usage',es:'Uso del articulo cero'},{en:'Aspect vs Tense',es:'Aspecto vs Tiempo verbal'},
          ]},
      ]
    });
    console.log('✅ Seed C2 completo — 12 temas');
    mongoose.disconnect();
  }).catch(e => { console.error(e.message); process.exit(1); });