const express = require('express');
const router = express.Router();
const pesananController = require('../controllers/pesananController');
// const cekApiKey = require('../middlewares/cekApiKey');
const verifyToken = require('../middlewares/verifyToken');
const hanyaRole = require('../middlewares/hanyaRole');

router.get('/', pesananController.getAll);
router.get('/user/:idUser', pesananController.getByUser);
router.get('/:id', pesananController.getById);
// role admin dan customer
router.post('/', verifyToken, hanyaRole('customer', 'admin'), pesananController.create);
router.put('/:id', verifyToken, hanyaRole('user', 'admin'), pesananController.update);
// hanya admin
router.delete('/:id', verifyToken, hanyaRole('admin'), pesananController.remove);

module.exports = router;