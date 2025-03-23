
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  create: (email, password, callback) => {
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.run(`INSERT INTO users (email, password) VALUES (?, ?)`, [email, hashedPassword], callback);
  },
  findByEmail: (email, callback) => {
    db.get(`SELECT * FROM users WHERE email = ?`, [email], callback);
  },
};

module.exports = User;