const express = require('express');
const shortid = require('shortid');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const bcrypt = require('bcryptjs');
const app = express();
const port = process.env.PORT || 3000;
const UAParser = require('ua-parser-js');
// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// SQLite Database Setup
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

db.run(`CREATE TABLE IF NOT EXISTS urls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  original_url TEXT NOT NULL,
  short_code TEXT UNIQUE NOT NULL,
  user_id INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

// New clicks table for detailed stats
db.run(`CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url_id INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (url_id) REFERENCES urls(id)
)`);

app.use(session({
  secret: 'miniclick_secret', //! Change this in production!
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

app.get('/dashboard', isAuthenticated, (req, res) => {
  const userId = req.session.userId;

  // Get user's URLs
  db.all(`SELECT id, short_code, original_url FROM urls WHERE user_id = ?`, [userId], (err, urls) => {
    if (err) return res.send('Error fetching links: ' + err.message);

    db.get(`SELECT COUNT(*) as linkCount FROM urls WHERE user_id = ?`, [userId], (err, countRow) => {
      if (err) return res.send('Error fetching data: ' + err.message);
      const linkCount = countRow.linkCount;
      if (linkCount >= 5 && !req.session.isPro) {
        return res.send('Free tier limit reached (5 links). Upgrade to Pro for unlimited!');
      }

      // Get click stats for each URL
      const urlIds = urls.map(url => url.id);
      db.all(`SELECT url_id, timestamp, ip_address, user_agent FROM clicks WHERE url_id IN (${urlIds.join(',') || 0})`, (err, clicks) => {
        if (err) return res.send('Error fetching clicks: ' + err.message);

        // Process stats
        const parser = new UAParser();
        const stats = urls.map(url => {
          const urlClicks = clicks.filter(click => click.url_id === url.id);
          const clickCount = urlClicks.length;
          const devices = urlClicks.map(click => {
            parser.setUA(click.user_agent);
            const result = parser.getResult();
            return result.device.type || 'Desktop'; // Fallback to Desktop if unknown
          });
          const deviceSummary = {};
          devices.forEach(device => {
            deviceSummary[device] = (deviceSummary[device] || 0) + 1;
          });
          const lastClick = urlClicks.length > 0 ? urlClicks[urlClicks.length - 1].timestamp : 'N/A';

          return {
            shortCode: url.short_code,
            originalUrl: url.original_url,
            clickCount,
            deviceSummary,
            lastClick
          };
        });

        res.render('dashboard', { links: stats, isPro: req.session.isPro });
      });
    });
  });
});
// Shorten URL
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
        const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
        res.send(`Short URL: ${baseUrl}/${shortCode}`);
      });
  });
});

app.get('/:code', (req, res) => {
  const shortCode = req.params.code;
  db.get(`SELECT id, original_url FROM urls WHERE short_code = ?`, [shortCode], (err, row) => {
    if (err || !row) return res.send('URL not found');

    const ip = req.ip; // Get client IP
    const userAgent = req.headers['user-agent'] || 'Unknown'; // Get user-agent

    db.run(`INSERT INTO clicks (url_id, ip_address, user_agent) VALUES (?, ?, ?)`, 
      [row.id, ip, userAgent], (err) => {
        if (err) console.error('Error logging click:', err);
        res.redirect(row.original_url);
      });
  });
});

app.listen(port, () => {
  console.log(`MiniClick running on port ${port}`);
});