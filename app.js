const express = require('express');
const session = require('express-session');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const port = process.env.PORT || 3000;
const session_secret = process.env.SESSION_SECRET || 'miniclick_secret';

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.use(session({
  secret:session_secret,
  resave: false,
  saveUninitialized: false,
}));

// Routes
app.use('/', authRoutes);
app.use('/', urlRoutes);
app.use('/', dashboardRoutes);

app.get('/', (req, res) => {
  res.render('index', { user: req.session.userId ? 'User' : null });
});

module.exports = app;