const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

router.get('/login', (req, res) => res.render('login', { error: null }));
router.get('/signup', (req, res) => res.render('signup', { error: null }));
router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.get('/logout', authController.logout);

module.exports = router;