const Url = require('../models/urlModel');
const Click = require('../models/clickModel');
const shortid = require('shortid');

const urlController = {
  shorten: (req, res) => {
    const { url, customCode, adWatched } = req.body;
    const userId = req.session.userId;

    let shortCode;
    if (customCode && (req.session.isPro || adWatched === 'true')) {
      shortCode = customCode;
    } else if (customCode) {
      return res.send('Watch an ad to use a custom URL or upgrade to Pro!');
    } else {
      shortCode = shortid.generate();
    }

    Url.create(url, shortCode, userId, (err) => {
      if (err) return res.send('Error: Code already taken or invalid');
      const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
      res.send(`Short URL: ${baseUrl}/${shortCode}`);
    });
  },
  redirect: (req, res) => {
    const shortCode = req.params.code;
    Url.findByShortCode(shortCode, (err, row) => {
      if (err || !row) return res.send('URL not found');
      Click.create(row.id, req.ip, req.headers['user-agent'], (err) => {
        if (err) console.error('Error logging click:', err);
        res.redirect(row.original_url);
      });
    });
  },
};

module.exports = urlController;