const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./urls.db', (err) => {
  if (err) console.error(err);
  console.log('Connected to SQLite');
});

// Create tables
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

db.run(`CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url_id INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (url_id) REFERENCES urls(id)
)`);

module.exports = db;