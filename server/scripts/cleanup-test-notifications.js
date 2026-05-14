const { Notification } = require('../models');
// Supprime toutes les notifications sauf celles des vrais utilisateurs (25, 29, 32)
Notification.destroy({ 
    where: { 
        userId: [6, 9, 12, 24, 35, 36, 39] 
    }, 
    force: true 
})
.then(r => { console.log(`Notifications de test supprimées: ${r}`); process.exit(0); })
.catch(e => { console.error(e); process.exit(1); });