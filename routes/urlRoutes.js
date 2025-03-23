const express = require('express');
const urlController = require('../controllers/urlController');
const router = express.Router();

router.post('/shorten', urlController.shorten);
router.get('/:code', urlController.redirect);

module.exports = router;