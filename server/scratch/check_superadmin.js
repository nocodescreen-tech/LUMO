const { User } = require('../models');

async function test() {
  const superadmin = await User.findOne({ where: { role: 'superadmin' } });
  console.log('Superadmin:', superadmin ? superadmin.toJSON() : null);
}

test().catch(console.error).finally(() => process.exit(0));
