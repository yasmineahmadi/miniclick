const db = require('../config/db');
//db
const Click = {
  create: (urlId, ipAddress, userAgent, callback) => {
    db.run(`INSERT INTO clicks (url_id, ip_address, user_agent) VALUES (?, ?, ?)`, [urlId, ipAddress, userAgent], callback);
  },
  findByUrlId: (urlId, callback) => {
    db.all(`SELECT * FROM clicks WHERE url_id = ?`, [urlId], callback);
  },
};

module.exports = Click;
