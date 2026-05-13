const { sequelize } = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function checkUsers() {
  try {
    await sequelize.authenticate();
    
    const users = await User.findAll({
      attributes: ['id', 'email', 'motDePasse']
    });
    console.log('Users:');
    for (const u of users) {
      console.log(`- ${u.email}: ${u.motDePasse}`);
      // Test password 'Admin123!' which might be the default
      const match1 = await bcrypt.compare('Admin123!', u.motDePasse);
      const match2 = await bcrypt.compare('nocode', u.motDePasse); // DB password is nocode
      console.log(`  Match Admin123!: ${match1}`);
      console.log(`  Match nocode: ${match2}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkUsers();
