const { sequelize } = require('../config/database');
const User = require('../models/User');

async function checkUsers() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    const users = await User.findAll({
      attributes: ['id', 'email', 'role', 'isVerified', 'isAdminValidated', 'isSuspended']
    });
    console.log('Users:', JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

checkUsers();
