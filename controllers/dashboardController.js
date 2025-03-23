const Url = require('../models/urlModel');
const Click = require('../models/clickModel');
const UAParser = require('ua-parser-js');

const dashboardController = {
  renderDashboard: (req, res) => {
    const userId = req.session.userId;
    Url.findByUserId(userId, (err, urls) => {
      if (err) return res.send('Error fetching links: ' + err.message);

      const urlIds = urls.map(url => url.id);
      Click.findByUrlId(urlIds, (err, clicks) => {
        if (err) return res.send('Error fetching clicks: ' + err.message);

        const parser = new UAParser();
        const stats = urls.map(url => {
          const urlClicks = clicks.filter(click => click.url_id === url.id);
          const clickCount = urlClicks.length;
          const devices = urlClicks.map(click => {
            parser.setUA(click.user_agent);
            const result = parser.getResult();
            return result.device.type || 'Desktop';
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
  },
};

module.exports = dashboardController;