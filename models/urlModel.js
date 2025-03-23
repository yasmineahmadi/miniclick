const db = require('../config/db');
const shortid = require('shortid');

const Url = {
  create: (originalUrl, shortCode, userId, callback) => {
    db.run(`INSERT INTO urls (original_url, short_code, user_id) VALUES (?, ?, ?)`, [originalUrl, shortCode, userId], callback);
  },
  findByShortCode: (shortCode, callback) => {
    db.get(`SELECT * FROM urls WHERE short_code = ?`, [shortCode], callback);
  },
  findByUserId: (userId, callback) => {
    db.all(`SELECT * FROM urls WHERE user_id = ?`, [userId], callback);
  },
};

module.exports = Url;