const router  = require('express').Router();
const mongoose= require('mongoose');
const auth    = require('../middleware/auth');

const Curso = mongoose.model('Curso', new mongoose.Schema({ nivel:String, temas:Array },{ collection:'cursos' }));

router.get('/:nivel', auth, function(req, res) {
  Curso.findOne({ nivel: req.params.nivel.toUpperCase() })
    .then(function(curso) {
      if (!curso) return res.status(404).json({ msg: 'Nivel no encontrado' });
      return res.json(curso);
    })
    .catch(function(e) { return res.status(500).json({ msg: e.message }); });
});

router.get('/:nivel/tema/:temaId/palabra', auth, function(req, res) {
  Curso.findOne({ nivel: req.params.nivel.toUpperCase() })
    .then(function(curso) {
      if (!curso) return res.status(404).json({ msg: 'Nivel no encontrado' });
      var tema = curso.temas.find(function(t) { return t.id === req.params.temaId; });
      if (!tema) return res.status(404).json({ msg: 'Tema no encontrado' });
      var word = tema.vocabulario[Math.floor(Math.random() * tema.vocabulario.length)];
      return res.json(Object.assign({}, word, { nivel: req.params.nivel, tema: tema.titulo }));
    })
    .catch(function(e) { return res.status(500).json({ msg: e.message }); });
});

module.exports = router;