const { sequelize } = require('../config/database');
const User = require('../models/User');

async function checkUserNames() {
  try {
    await sequelize.authenticate();
    const users = await User.findAll({
      attributes: ['id', 'nom', 'entreprise']
    });
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}
checkUserNames();
