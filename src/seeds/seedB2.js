const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const db = mongoose.connection.db;
    await db.collection('cursos').deleteOne({ nivel: 'B2' });
    await db.collection('cursos').insertOne({
      nivel: 'B2',
      temas: [
        { id: 'economics', titulo: 'Economia y finanzas', icono: '💹',
          vocabulario: [
            {en:'Inflation',es:'Inflacion'},{en:'Recession',es:'Recesion'},{en:'GDP',es:'PIB'},
            {en:'Investment',es:'Inversion'},{en:'Stock market',es:'Bolsa de valores'},{en:'Interest rate',es:'Tasa de interes'},
            {en:'Budget',es:'Presupuesto'},{en:'Deficit',es:'Deficit'},{en:'Surplus',es:'Superavit'},
            {en:'Entrepreneur',es:'Empresario'},{en:'Venture capital',es:'Capital de riesgo'},{en:'Merger',es:'Fusion empresarial'},
          ]},
        { id: 'law_politics', titulo: 'Derecho y politica', icono: '⚖️',
          vocabulario: [
            {en:'Legislation',es:'Legislacion'},{en:'Constitution',es:'Constitucion'},{en:'Jurisdiction',es:'Jurisdiccion'},
            {en:'Democracy',es:'Democracia'},{en:'Corruption',es:'Corrupcion'},{en:'Sovereignty',es:'Soberania'},
            {en:'Treaty',es:'Tratado'},{en:'Referendum',es:'Referendum'},{en:'Amendment',es:'Enmienda'},
            {en:'Sanctions',es:'Sanciones'},{en:'Diplomacy',es:'Diplomacia'},{en:'Lobbying',es:'Cabildeo'},
          ]},
        { id: 'science', titulo: 'Ciencia e investigacion', icono: '🔬',
          vocabulario: [
            {en:'Hypothesis',es:'Hipotesis'},{en:'Methodology',es:'Metodologia'},{en:'Experiment',es:'Experimento'},
            {en:'Evidence',es:'Evidencia'},{en:'Phenomenon',es:'Fenomeno'},{en:'Analysis',es:'Analisis'},
            {en:'Conclusion',es:'Conclusion'},{en:'Peer review',es:'Revision por pares'},{en:'Breakthrough',es:'Avance cientifico'},
            {en:'Genome',es:'Genoma'},{en:'Quantum',es:'Cuantico'},{en:'Nanotechnology',es:'Nanotecnologia'},
          ]},
        { id: 'psychology', titulo: 'Psicologia y comportamiento', icono: '🧠',
          vocabulario: [
            {en:'Cognitive',es:'Cognitivo'},{en:'Behavior',es:'Comportamiento'},{en:'Motivation',es:'Motivacion'},
            {en:'Perception',es:'Percepcion'},{en:'Subconscious',es:'Subconsciente'},{en:'Empathy',es:'Empatia'},
            {en:'Resilience',es:'Resiliencia'},{en:'Trauma',es:'Trauma'},{en:'Anxiety',es:'Ansiedad'},
            {en:'Self-esteem',es:'Autoestima'},{en:'Bias',es:'Sesgo'},{en:'Stereotype',es:'Estereotipo'},
          ]},
        { id: 'arts_literature', titulo: 'Arte y literatura', icono: '🎨',
          vocabulario: [
            {en:'Masterpiece',es:'Obra maestra'},{en:'Aesthetic',es:'Estetica'},{en:'Metaphor',es:'Metafora'},
            {en:'Narrative',es:'Narrativa'},{en:'Genre',es:'Genero literario'},{en:'Symbolism',es:'Simbolismo'},
            {en:'Protagonist',es:'Protagonista'},{en:'Plot',es:'Trama'},{en:'Irony',es:'Ironia'},
            {en:'Satire',es:'Satira'},{en:'Abstract',es:'Abstracto'},{en:'Contemporary',es:'Contemporaneo'},
          ]},
        { id: 'globalization', titulo: 'Globalizacion', icono: '🌐',
          vocabulario: [
            {en:'Multinational',es:'Multinacional'},{en:'Trade agreement',es:'Tratado comercial'},{en:'Outsourcing',es:'Subcontratacion'},
            {en:'Migration',es:'Migracion'},{en:'Cultural exchange',es:'Intercambio cultural'},{en:'Inequality',es:'Desigualdad'},
            {en:'Poverty',es:'Pobreza'},{en:'Human rights',es:'Derechos humanos'},{en:'Refugee',es:'Refugiado'},
            {en:'Integration',es:'Integracion'},{en:'Protectionism',es:'Proteccionismo'},{en:'Tariff',es:'Arancel'},
          ]},
        { id: 'idioms', titulo: 'Modismos avanzados', icono: '🗣️',
          vocabulario: [
            {en:'Break a leg',es:'Buena suerte'},{en:'Hit the nail on the head',es:'Dar en el clavo'},
            {en:'Under the weather',es:'Sentirse mal'},{en:'Bite the bullet',es:'Aguantar el dolor'},
            {en:'Burn bridges',es:'Quemar las naves'},{en:'Cut to the chase',es:'Ir al grano'},
            {en:'On the fence',es:'Indeciso'},{en:'Miss the boat',es:'Perder la oportunidad'},
            {en:'Pull strings',es:'Mover influencias'},{en:'Read between the lines',es:'Leer entre lineas'},
            {en:'Spill the beans',es:'Revelar el secreto'},{en:'Take with a grain of salt',es:'Tomar con cautela'},
          ]},
        { id: 'formal_writing', titulo: 'Escritura formal', icono: '✍️',
          vocabulario: [
            {en:'Furthermore',es:'Ademas'},{en:'Nevertheless',es:'Sin embargo'},{en:'Subsequently',es:'Posteriormente'},
            {en:'Aforementioned',es:'Anteriormente mencionado'},{en:'Notwithstanding',es:'No obstante'},
            {en:'Herein',es:'Aqui dentro'},{en:'Pursuant to',es:'De conformidad con'},{en:'Whereby',es:'Por lo cual'},
            {en:'Henceforth',es:'De ahora en adelante'},{en:'Whereas',es:'Considerando que'},
            {en:'Thereof',es:'De ello'},{en:'Forthwith',es:'Inmediatamente'},
          ]},
        { id: 'debate', titulo: 'Debate y argumentacion', icono: '🎤',
          vocabulario: [
            {en:'Counterargument',es:'Contraargumento'},{en:'Evidence',es:'Evidencia'},{en:'Premise',es:'Premisa'},
            {en:'Inference',es:'Inferencia'},{en:'Fallacy',es:'Falacia'},{en:'Assertion',es:'Aseveracion'},
            {en:'Rebut',es:'Refutar'},{en:'Concede',es:'Conceder'},{en:'Elaborate',es:'Elaborar'},
            {en:'Substantiate',es:'Fundamentar'},{en:'Implication',es:'Implicacion'},{en:'Consensus',es:'Consenso'},
          ]},
        { id: 'business_english', titulo: 'Ingles de negocios', icono: '🤝',
          vocabulario: [
            {en:'Stakeholder',es:'Parte interesada'},{en:'ROI',es:'Retorno de inversion'},{en:'KPI',es:'Indicador clave'},
            {en:'Benchmark',es:'Referencia de rendimiento'},{en:'Scalable',es:'Escalable'},{en:'Revenue',es:'Ingresos'},
            {en:'Brand awareness',es:'Reconocimiento de marca'},{en:'Market share',es:'Cuota de mercado'},
            {en:'Pitch',es:'Presentacion de negocio'},{en:'Due diligence',es:'Debida diligencia'},
            {en:'Equity',es:'Capital propio'},{en:'Leverage',es:'Apalancamiento'},
          ]},
        { id: 'passive_voice', titulo: 'Voz pasiva avanzada', icono: '🔄',
          vocabulario: [
            {en:'It has been announced',es:'Ha sido anunciado'},{en:'The project was launched',es:'El proyecto fue lanzado'},
            {en:'They are being trained',es:'Estan siendo entrenados'},{en:'It will be completed',es:'Sera completado'},
            {en:'The law was amended',es:'La ley fue enmendada'},{en:'Results have been published',es:'Los resultados han sido publicados'},
            {en:'It is widely believed',es:'Se cree ampliamente'},{en:'The contract was terminated',es:'El contrato fue terminado'},
            {en:'Mistakes were made',es:'Se cometieron errores'},{en:'A solution has been found',es:'Se ha encontrado una solucion'},
            {en:'The meeting was postponed',es:'La reunion fue pospuesta'},{en:'It is expected that',es:'Se espera que'},
          ]},
        { id: 'grammar_b2', titulo: 'Gramatica B2', icono: '📚',
          vocabulario: [
            {en:'I should have known',es:'Deberia haber sabido'},{en:'Had I known',es:'Si hubiera sabido'},
            {en:'It would have been',es:'Habria sido'},{en:'She could have told me',es:'Ella podria haberme dicho'},
            {en:'They must have left',es:'Deben haber salido'},{en:'I ought to have called',es:'Deberia haber llamado'},
            {en:'He need not have worried',es:'El no necesitaba haberse preocupado'},
            {en:'If it were not for',es:'Si no fuera por'},{en:'I am supposed to',es:'Se supone que debo'},
            {en:'There is no point in',es:'No tiene sentido'},{en:'It goes without saying',es:'Huelga decir'},
            {en:'Not only did he',es:'No solo el'},
          ]},
      ]
    });
    console.log('✅ Seed B2 completo — 12 temas');
    mongoose.disconnect();
  }).catch(e => { console.error(e.message); process.exit(1); });