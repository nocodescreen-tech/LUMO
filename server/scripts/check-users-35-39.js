const { User } = require('../models');
// Check who users 35, 36, 39 are
User.findAll({ where: { id: [35, 36, 39] }, attributes: ['id', 'nom', 'email', 'role', 'parentId'] })
    .then(users => {
        if (users.length === 0) console.log('These users no longer exist (were test accounts)');
        else users.forEach(u => console.log(`#${u.id} | ${u.nom} | ${u.email} | ${u.role}`));
        process.exit(0);
    })
    .catch(e => { console.error(e); process.exit(1); });