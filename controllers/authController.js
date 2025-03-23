const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

const authController = {
  login: (req, res) => {
    const { email, password } = req.body;
    User.findByEmail(email, async (err, user) => {
      if (err || !user || !(await bcrypt.compare(password, user.password))) {
        return res.render('login', { error: 'Invalid credentials' });
      }
      req.session.userId = user.id;
      req.session.isPro = user.is_pro;
      res.redirect('/dashboard');
    });
  },
  signup: (req, res) => {
    const { email, password } = req.body;
    User.create(email, password, (err) => {
      if (err) return res.render('signup', { error: 'Email already exists' });
      res.redirect('/login');
    });
  },
  logout: (req, res) => {
    req.session.destroy();
    res.redirect('/');
  },
};

module.exports = authController;