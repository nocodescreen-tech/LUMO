const { User } = require('../models');
User.findAll({ attributes: ['id', 'nom', 'email', 'role'] }).then(users => {
    users.forEach(u => console.log(`#${u.id} | ${u.nom} | ${u.email} | ${u.role}`));
    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });