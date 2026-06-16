const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB conectado');
    const db = mongoose.connection.db;
    await db.collection('cursos').deleteOne({ nivel: 'B1' });
    await db.collection('cursos').insertOne({
      nivel: 'B1',
      temas: [
        {
          id: 'travel', titulo: 'Viajes y turismo', icono: '✈️',
          vocabulario: [
            { en: 'Passport', es: 'Pasaporte' }, { en: 'Boarding pass', es: 'Tarjeta de embarque' },
            { en: 'Check in', es: 'Registro de entrada' }, { en: 'Departure', es: 'Salida' },
            { en: 'Arrival', es: 'Llegada' }, { en: 'Customs', es: 'Aduana' },
            { en: 'Luggage', es: 'Equipaje' }, { en: 'Itinerary', es: 'Itinerario' },
            { en: 'Tourist', es: 'Turista' }, { en: 'Souvenir', es: 'Recuerdo' },
            { en: 'Accommodation', es: 'Alojamiento' }, { en: 'Currency', es: 'Moneda' },
          ]
        },
        {
          id: 'opinions', titulo: 'Dar opiniones', icono: '💬',
          vocabulario: [
            { en: 'In my opinion', es: 'En mi opinion' }, { en: 'I think that', es: 'Creo que' },
            { en: 'I agree', es: 'Estoy de acuerdo' }, { en: 'I disagree', es: 'No estoy de acuerdo' },
            { en: 'On the other hand', es: 'Por otro lado' }, { en: 'However', es: 'Sin embargo' },
            { en: 'Although', es: 'Aunque' }, { en: 'Therefore', es: 'Por lo tanto' },
            { en: 'In addition', es: 'Ademas' }, { en: 'For example', es: 'Por ejemplo' },
            { en: 'In conclusion', es: 'En conclusion' }, { en: 'It seems to me', es: 'Me parece que' },
          ]
        },
        {
          id: 'media', titulo: 'Medios y tecnologia', icono: '📱',
          vocabulario: [
            { en: 'Social media', es: 'Redes sociales' }, { en: 'Broadcast', es: 'Transmision' },
            { en: 'Headline', es: 'Titular' }, { en: 'Advertisement', es: 'Publicidad' },
            { en: 'Journalist', es: 'Periodista' }, { en: 'Reliable', es: 'Confiable' },
            { en: 'Fake news', es: 'Noticias falsas' }, { en: 'Influence', es: 'Influencia' },
            { en: 'Viral', es: 'Viral' }, { en: 'Subscribe', es: 'Suscribirse' },
            { en: 'Algorithm', es: 'Algoritmo' }, { en: 'Privacy', es: 'Privacidad' },
          ]
        },
        {
          id: 'environment', titulo: 'Medio ambiente', icono: '🌍',
          vocabulario: [
            { en: 'Climate change', es: 'Cambio climatico' }, { en: 'Pollution', es: 'Contaminacion' },
            { en: 'Renewable energy', es: 'Energia renovable' }, { en: 'Recycle', es: 'Reciclar' },
            { en: 'Deforestation', es: 'Deforestacion' }, { en: 'Endangered', es: 'En peligro' },
            { en: 'Sustainable', es: 'Sostenible' }, { en: 'Carbon footprint', es: 'Huella de carbono' },
            { en: 'Ecosystem', es: 'Ecosistema' }, { en: 'Greenhouse effect', es: 'Efecto invernadero' },
            { en: 'Biodiversity', es: 'Biodiversidad' }, { en: 'Conservation', es: 'Conservacion' },
          ]
        },
        {
          id: 'culture', titulo: 'Cultura y tradiciones', icono: '🎭',
          vocabulario: [
            { en: 'Heritage', es: 'Patrimonio' }, { en: 'Tradition', es: 'Tradicion' },
            { en: 'Festival', es: 'Festival' }, { en: 'Ceremony', es: 'Ceremonia' },
            { en: 'Folklore', es: 'Folclore' }, { en: 'Monument', es: 'Monumento' },
            { en: 'Ancestor', es: 'Antepasado' }, { en: 'Diversity', es: 'Diversidad' },
            { en: 'Belief', es: 'Creencia' }, { en: 'Costume', es: 'Traje tipico' },
            { en: 'Ritual', es: 'Ritual' }, { en: 'Mythology', es: 'Mitologia' },
          ]
        },
        {
          id: 'health_lifestyle', titulo: 'Salud y estilo de vida', icono: '🏃',
          vocabulario: [
            { en: 'Nutrition', es: 'Nutricion' }, { en: 'Mental health', es: 'Salud mental' },
            { en: 'Stress', es: 'Estres' }, { en: 'Therapy', es: 'Terapia' },
            { en: 'Balanced diet', es: 'Dieta equilibrada' }, { en: 'Obesity', es: 'Obesidad' },
            { en: 'Insomnia', es: 'Insomnio' }, { en: 'Addiction', es: 'Adiccion' },
            { en: 'Vaccination', es: 'Vacunacion' }, { en: 'Awareness', es: 'Conciencia' },
            { en: 'Wellbeing', es: 'Bienestar' }, { en: 'Prevention', es: 'Prevencion' },
          ]
        },
        {
          id: 'education', titulo: 'Educacion y aprendizaje', icono: '🎓',
          vocabulario: [
            { en: 'Scholarship', es: 'Beca' }, { en: 'Curriculum', es: 'Plan de estudios' },
            { en: 'Degree', es: 'Titulo universitario' }, { en: 'Research', es: 'Investigacion' },
            { en: 'Assignment', es: 'Tarea / Trabajo' }, { en: 'Graduate', es: 'Graduarse' },
            { en: 'Tutor', es: 'Tutor' }, { en: 'Campus', es: 'Campus' },
            { en: 'Semester', es: 'Semestre' }, { en: 'Thesis', es: 'Tesis' },
            { en: 'Academic', es: 'Academico' }, { en: 'Critical thinking', es: 'Pensamiento critico' },
          ]
        },
        {
          id: 'conditionals', titulo: 'Condicionales y subjuntivo', icono: '🔀',
          vocabulario: [
            { en: 'If I had', es: 'Si tuviera' }, { en: 'I would go', es: 'Yo iria' },
            { en: 'Unless', es: 'A menos que' }, { en: 'Provided that', es: 'Siempre que' },
            { en: 'Suppose that', es: 'Supongamos que' }, { en: 'In case', es: 'En caso de que' },
            { en: 'As long as', es: 'Mientras que' }, { en: 'Even if', es: 'Incluso si' },
            { en: 'Whether or not', es: 'Independientemente de si' }, { en: 'Otherwise', es: 'De lo contrario' },
            { en: 'Should you need', es: 'Si necesitaras' }, { en: 'Were I to', es: 'Si yo fuera a' },
          ]
        },
        {
          id: 'work_career', titulo: 'Carrera profesional', icono: '💼',
          vocabulario: [
            { en: 'Application', es: 'Solicitud de empleo' }, { en: 'Cover letter', es: 'Carta de presentacion' },
            { en: 'Experience', es: 'Experiencia' }, { en: 'References', es: 'Referencias' },
            { en: 'Negotiate', es: 'Negociar' }, { en: 'Promotion', es: 'Ascenso' },
            { en: 'Resign', es: 'Renunciar' }, { en: 'Colleague', es: 'Colega' },
            { en: 'Performance', es: 'Desempeno' }, { en: 'Feedback', es: 'Retroalimentacion' },
            { en: 'Deadline', es: 'Fecha limite' }, { en: 'Achievement', es: 'Logro' },
          ]
        },
        {
          id: 'narrative', titulo: 'Narrar historias', icono: '📖',
          vocabulario: [
            { en: 'Once upon a time', es: 'Habia una vez' }, { en: 'Meanwhile', es: 'Mientras tanto' },
            { en: 'Suddenly', es: 'De repente' }, { en: 'Eventually', es: 'Finalmente' },
            { en: 'As a result', es: 'Como resultado' }, { en: 'Due to', es: 'Debido a' },
            { en: 'Despite', es: 'A pesar de' }, { en: 'By the time', es: 'Para cuando' },
            { en: 'Afterwards', es: 'Despues de eso' }, { en: 'Prior to', es: 'Antes de' },
            { en: 'Consequently', es: 'Por consiguiente' }, { en: 'Nevertheless', es: 'No obstante' },
          ]
        },
        {
          id: 'technology', titulo: 'Tecnologia e innovacion', icono: '💻',
          vocabulario: [
            { en: 'Artificial intelligence', es: 'Inteligencia artificial' }, { en: 'Automation', es: 'Automatizacion' },
            { en: 'Cloud computing', es: 'Computacion en la nube' }, { en: 'Cybersecurity', es: 'Ciberseguridad' },
            { en: 'Database', es: 'Base de datos' }, { en: 'Software', es: 'Software' },
            { en: 'Innovation', es: 'Innovacion' }, { en: 'Startup', es: 'Empresa emergente' },
            { en: 'Digital transformation', es: 'Transformacion digital' }, { en: 'Blockchain', es: 'Cadena de bloques' },
            { en: 'Virtual reality', es: 'Realidad virtual' }, { en: 'Machine learning', es: 'Aprendizaje automatico' },
          ]
        },
        {
          id: 'grammar_b1', titulo: 'Gramatica B1', icono: '📝',
          vocabulario: [
            { en: 'I have been working', es: 'He estado trabajando' }, { en: 'She had already left', es: 'Ella ya se habia ido' },
            { en: 'They will have finished', es: 'Ellos habran terminado' }, { en: 'It is being built', es: 'Esta siendo construido' },
            { en: 'The report was written', es: 'El informe fue escrito' }, { en: 'He used to live', es: 'El solia vivir' },
            { en: 'I wish I could', es: 'Quisiera poder' }, { en: 'If only I knew', es: 'Si tan solo supiera' },
            { en: 'It is worth doing', es: 'Vale la pena hacerlo' }, { en: 'She is used to working', es: 'Ella esta acostumbrada a trabajar' },
            { en: 'I would rather stay', es: 'Preferiria quedarme' }, { en: 'He tends to forget', es: 'Tiende a olvidar' },
          ]
        },
      ]
    });
    console.log('✅ Seed B1 completo — 12 temas');
    mongoose.disconnect();
  }).catch(e => { console.error(e.message); process.exit(1); });