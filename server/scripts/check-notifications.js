const { Notification } = require('../models');
Notification.findAll({ attributes: ['id', 'userId', 'titre', 'createdAt'], order: [['createdAt', 'DESC']], limit: 20 })
    .then(rows => {
        rows.forEach(n => console.log(`#${n.id} | userId: ${n.userId} | ${n.titre} | ${n.createdAt}`));
        process.exit(0);
    })
    .catch(e => { console.error(e); process.exit(1); });