const router = require('express').Router();
const auth   = require('../middleware/auth');
const admin  = require('../middleware/admin');
const ctrl   = require('../controllers/adminController');

router.get('/stats',        auth, admin, ctrl.getStats);
router.get('/users',        auth, admin, ctrl.getUsers);
router.get('/level/:nivel', auth, admin, ctrl.getLevel);
router.get('/student/:id',  auth, admin, ctrl.getStudent);
router.put('/student/:id',    auth, admin, ctrl.updateStudent);
router.delete('/student/:id', auth, admin, ctrl.deleteStudent);

module.exports = router;