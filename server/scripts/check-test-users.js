const { User } = require('../models');
User.findAll({ where: { id: [6, 9, 12, 24, 35, 36, 39] }, attributes: ['id', 'nom', 'email', 'role', 'parentId'] })
    .then(users => {
        users.forEach(u => console.log(`#${u.id} | ${u.nom} | ${u.email} | ${u.role} | parent: ${u.parentId}`));
        process.exit(0);
    })
    .catch(e => { console.error(e); process.exit(1); });