const { Notification } = require('../models');
const { Op } = require('sequelize');

// Admin user ID 29 = rene nzaku (rcbeatzp@gmail.com)
Notification.destroy({ where: { userId: 29 }, force: true })
    .then(r => { console.log(`Notifications supprimées: ${r}`); process.exit(0); })
    .catch(e => { console.error(e); process.exit(1); });