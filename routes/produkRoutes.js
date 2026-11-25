const express = require('express');
const router = express.Router();
const c = require('../controllers/produkController');
const verifyToken = require('../middlewares/verifyToken');

router.get('/', c.getAll);
router.post('/', verifyToken, c.create);

module.exports = router;