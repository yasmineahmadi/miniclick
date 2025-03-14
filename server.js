const express = require('express');
const shortid = require('shortid');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const bcrypt = require('bcryptjs');
const app = express();
const port = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// SQLite Database Setup
// Replace the existing db setup with this:
const db = new sqlite3.Database('./urls.db', (err) => {
    if (err) console.error(err);
    console.log('Connected to SQLite');
  });
  
  // Create users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_pro INTEGER DEFAULT 0
  )`);
   // Update urls table (drop and recreate for simplicity, or alter in production)
  db.run(`DROP TABLE IF EXISTS urls`);
  db.run(`CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_url TEXT NOT NULL,
    short_code TEXT NOT NULL,
    clicks INTEGER DEFAULT 0,
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);


app.use(session({
    secret: 'miniclick_secret', // Change this in production!
    resave: false,
    saveUninitialized: false,
  }));
  
  // Login Page
  app.get('/login', (req, res) => {
    res.render('login', { error: null });
  });
  
  // Signup Page
  app.get('/signup', (req, res) => {
    res.render('signup', { error: null });
  });


  app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users (email, password) VALUES (?, ?)`, 
      [email, hashedPassword], (err) => {
        if (err) return res.render('signup', { error: 'Email already exists' });
        res.redirect('/login');
      });
  });
  
  // Login Handler
  app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
      if (err || !user || !(await bcrypt.compare(password, user.password))) {
        return res.render('login', { error: 'Invalid credentials' });
      }
      req.session.userId = user.id;
      req.session.isPro = user.is_pro;
      res.redirect('/dashboard');
    });
  });
  
  // Logout
  app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
  });
  
  // Middleware to protect routes
  function isAuthenticated(req, res, next) {
    if (req.session.userId) return next();
    res.redirect('/login');
  }
// Home Route
app.get('/', (req, res) => {
    res.render('index', { user: req.session.userId ? 'User' : null });
  });

// Dashboard Route
app.get('/dashboard', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    db.get(`SELECT COUNT(*) as linkCount FROM urls WHERE user_id = ?`, [userId], (err, countRow) => {
      if (err) return res.send('Error fetching data'+ err.message);
      const linkCount = countRow.linkCount;
      if (linkCount >= 5 && !req.session.isPro) {
        return res.send('Free tier limit reached (5 links). Upgrade to Pro for unlimited!');
      }
      db.all(`SELECT short_code, original_url, clicks FROM urls WHERE user_id = ?`, [userId], (err, rows) => {
        if (err) return res.send('Error fetching links');
        res.render('dashboard', { links: rows, isPro: req.session.isPro });
      });
    });
  });
  
  // Update /shorten to require login and enforce limits
// Replace the existing /shorten endpoint
app.post('/shorten', isAuthenticated, (req, res) => {
    const { url, customCode, adWatched } = req.body;
    if (!url || !url.match(/^(http|https):\/\/[^\s]+$/)) {
      return res.send('Invalid URL');
    }
    const userId = req.session.userId;
  
    db.get(`SELECT COUNT(*) as linkCount, is_pro FROM users WHERE id = ?`, [userId], (err, user) => {
      if (err) return res.send('Error checking user');
      const linkCount = user.linkCount;
      const isPro = user.is_pro;
  
      if (linkCount >= 5 && !isPro) {
        return res.send('Free tier limit reached (5 links). Upgrade to Pro for unlimited!');
      }
  
      let shortCode;
      if (customCode && (isPro || adWatched === 'true')) {
        shortCode = customCode;
      } else if (customCode) {
        return res.send('Watch an ad to use a custom URL or upgrade to Pro!');
      } else {
        shortCode = shortid.generate();
      }
  
      db.run(`INSERT INTO urls (original_url, short_code, user_id) VALUES (?, ?, ?)`, 
        [url, shortCode, userId], function(err) {
          if (err) return res.send('Error: Code already taken or invalid');
          res.send(`Short URL: http://localhost:3000/${shortCode}`);
        });
    });
  });

// Redirect Short URL
app.get('/:code', (req, res) => {
  const shortCode = req.params.code;
  db.get(`SELECT original_url, clicks FROM urls WHERE short_code = ?`, 
    [shortCode], (err, row) => {
      if (err || !row) return res.send('URL not found');
      db.run(`UPDATE urls SET clicks = clicks + 1 WHERE short_code = ?`, [shortCode]);
      res.redirect(row.original_url);
    });
});

app.listen(port, () => {
  console.log(`MiniClick running at http://localhost:${port}`);
});